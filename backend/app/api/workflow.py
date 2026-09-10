import asyncio
import logging

from typing import List, Dict, Any, Literal

from fastapi import APIRouter, HTTPException, Depends, status, Body
from pydantic import BaseModel, Field, ConfigDict
from app.db.database import db
from app.core.security import get_current_user_claims
from app.core.cache import (
    get_cached,
    set_cached,
    delete_cached,
    get_cache_stats
)
from app.worker.tasks import execute_workflow_task
import uuid
import json
from celery.result import AsyncResult
from app.models.saga_state import SagaState
from app.core.saga_manager import SagaManager
from app.core.idempotency import acquire_lock, release_lock

router = APIRouter(tags=["Workflows"])
logger = logging.getLogger(__name__)

# --- Pydantic Request Schemas ---
class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Human-readable description of the failure.")
    model_config = ConfigDict(json_schema_extra={"example": {"detail": "Workflow configuration was not found."}})


class WorkflowSaveRequest(BaseModel):
    name: str = Field(..., description="Unique name used to identify the saved workflow definition.")
    nodes: List[Dict[str, Any]] = Field(default_factory=list, description="Workflow node definitions for the canvas.")
    edges: List[Dict[str, Any]] = Field(default_factory=list, description="Connections between workflow nodes.")
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "new-hire-onboarding",
            "nodes": [{"id": "start", "type": "start", "data": {"label": "Start"}, "position": {"x": 0, "y": 0}}],
            "edges": []
        }
    })


class MessageResponse(BaseModel):
    message: str = Field(..., description="Status message returned by the workflow endpoint.")
    model_config = ConfigDict(json_schema_extra={"example": {"message": "Workflow canvas layout saved completely!"}})


class WorkflowDefinition(BaseModel):
    name: str = Field(..., description="Workflow definition name.")
    nodes: List[Dict[str, Any]] = Field(default_factory=list, description="Workflow node definitions.")
    edges: List[Dict[str, Any]] = Field(default_factory=list, description="Workflow connection edges.")
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "new-hire-onboarding",
            "nodes": [{"id": "start", "type": "start", "position": {"x": 0, "y": 0}}],
            "edges": []
        }
    })


class WorkflowSummary(WorkflowDefinition):
    created_at: str | None = Field(default=None, description="Workflow creation timestamp in ISO-8601 format.")
    updated_at: str | None = Field(default=None, description="Workflow last update timestamp in ISO-8601 format.")


class Employee(BaseModel):
    name: str = Field(..., description="Employee full name.")
    email: str = Field(..., description="Employee email used to match the workflow execution target.")
    phone: str = Field(..., description="Employee phone number.")
    role: str = Field(..., description="Employee role used by the automation workflow.")
    joining_date: str = Field(..., description="Employee start date in YYYY-MM-DD format.")
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Priya Nair",
            "email": "priya@workflowstudio.local",
            "phone": "+1-555-0108",
            "role": "Operator",
            "joining_date": "2026-06-04"
        }
    })


class WorkflowExecuteRequest(BaseModel):
    employees: List[Employee] = Field(..., description="One or more employee records to pass to the workflow engine.")
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "employees": [{
                "name": "Priya Nair",
                "email": "priya@workflowstudio.local",
                "phone": "+1-555-0108",
                "role": "Operator",
                "joining_date": "2026-06-04"
            }]
        }
    })


class WorkflowRunResponse(BaseModel):
    run_id: str = Field(..., description="Unique identifier assigned to the queued workflow run.")
    status: Literal["queued"] = Field(default="queued", description="Current execution state as the workflow enters the queue.")
    model_config = ConfigDict(json_schema_extra={
        "example": {"run_id": "f9aee6f4-4e14-4722-b556-9a6e955d0ae6", "status": "queued"}
    })


# --- Helper Role Validation Checker ---
def verify_operational_clearance(token_payload: dict):
    user_identity = token_payload.get("sub", "")
    user = db.users.find_one({"email": user_identity})
    if not user or user.get("role", "") not in ["Admin", "Operator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Insufficient operational clearance limits."
        )
    return user


async def acquire_execution_lock(idempotency_key: str) -> bool:
    """Retry only transient Redis connection failures before queueing a run."""
    last_error = None
    for attempt in range(3):
        try:
            return await acquire_lock(idempotency_key, ttl=300)
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Unable to acquire execution lock (attempt %s of 3)",
                attempt + 1,
                exc_info=True,
            )
            if attempt < 2:
                await asyncio.sleep(0.25 * (attempt + 1))
    raise last_error


# --- Core Router Endpoints ---

@router.post(
    "/create-workflow",
    response_model=MessageResponse,
    summary="Save or update a workflow definition",
    description="Persist the current workflow canvas to MongoDB and refresh the cached workflow list for subsequent API requests.",
    responses={
        200: {"description": "Workflow saved successfully", "model": MessageResponse},
        401: {"model": ErrorResponse, "description": "The caller JWT token is missing or invalid."},
        403: {"model": ErrorResponse, "description": "The caller does not have operational clearance."},
    },
)
async def save_workflow(data: WorkflowSaveRequest = Body(..., examples={"workflow": {"summary": "Workflow save example", "value": {"name": "new-hire-onboarding", "nodes": [{"id": "start", "type": "start", "data": {"label": "Start"}, "position": {"x": 0, "y": 0}}], "edges": []}}}), token_payload: dict = Depends(get_current_user_claims)):
    verify_operational_clearance(token_payload)
    workflow_data = {
        "name": data.name if data.name.strip() else "Notification Workflow",
        "nodes": data.nodes,
        "edges": data.edges,
        "updated_by": token_payload.get("sub")
    }
    db.workflows.update_one({"name": workflow_data["name"]}, {"$set": workflow_data}, upsert=True)
    try:
        await delete_cached("all_workflows")
    except Exception:
        # The workflow is already persisted; a cache outage must not turn a
        # successful save into an API failure.
        logger.exception("Unable to invalidate saved workflows cache")
    return {"message": "Workflow canvas layout saved completely!"}


# 🟢 FIXED: ADDED MISSING ROUTE TO LOAD INDIVIDUAL WORKFLOWS AND STOP 404 ERRORS
@router.get(
    "/workflow/{name}",
    response_model=WorkflowDefinition,
    summary="Retrieve one saved workflow",
    description="Fetch a single workflow definition by name, using the Redis cache when available and MongoDB as the source of truth.",
    responses={
        200: {"description": "Workflow definition returned successfully", "model": WorkflowDefinition},
        401: {"model": ErrorResponse, "description": "The caller JWT token is missing or invalid."},
        403: {"model": ErrorResponse, "description": "The caller does not have operational clearance."},
        404: {"model": ErrorResponse, "description": "The workflow definition could not be found."},
    },
)
async def get_single_workflow(
    name: str,
    token_payload: dict = Depends(get_current_user_claims)
):
    verify_operational_clearance(token_payload)

    cache_key = f"workflow:{name}"

    try:
        cached_data = await get_cached(cache_key)
    except Exception:
        logger.exception("Workflow cache is unavailable; reading MongoDB directly")
        cached_data = None

    print("REDIS VALUE =", cached_data)

    if cached_data:
        print(f"CACHE HIT: {cache_key}")
        return json.loads(cached_data)

    print(f"CACHE MISS: {cache_key}")

    workflow = db.workflows.find_one({"name": name})

    if not workflow:
        raise HTTPException(
            status_code=404,
            detail="Workflow layout schema not found."
        )

    result = {
        "name": workflow.get("name", "Notification Workflow"),
        "nodes": workflow.get("nodes", []),
        "edges": workflow.get("edges", [])
    }

    try:
        await set_cached(
            cache_key,
            json.dumps(result),
            ttl=120
        )
    except Exception:
        logger.exception("Unable to cache workflow %s", name)

    return result


@router.post(
    "/run-workflow/{workflow_name}",
    response_model=WorkflowRunResponse,
    summary="Queue a workflow execution",
    description="Validate authorization, ensure the workflow exists, acquire an idempotency lock, and queue the workflow run for asynchronous execution.",
    responses={
        200: {"description": "Workflow queued successfully", "model": WorkflowRunResponse},
        401: {
            "model": ErrorResponse,
            "description": "Invalid or expired credentials session token.",
            "content": {"application/json": {"example": {"detail": "Invalid or expired credentials session token."}}},
        },
        403: {
            "model": ErrorResponse,
            "description": "The caller does not have sufficient operational clearance.",
            "content": {"application/json": {"example": {"detail": "The caller does not have sufficient operational clearance."}}},
        },
        404: {
            "model": ErrorResponse,
            "description": "Workflow configuration was not found.",
            "content": {"application/json": {"example": {"detail": "Workflow configuration was not found."}}},
        },
        409: {
            "model": ErrorResponse,
            "description": "A workflow run for the same employee is already in progress.",
            "content": {"application/json": {"example": {"detail": "Workflow is already running for this employee."}}},
        },
        422: {
            "model": ErrorResponse,
            "description": "The request payload is missing required employee data.",
            "content": {"application/json": {"example": {"detail": "A valid employee email is required to run the workflow."}}},
        },
        503: {
            "model": ErrorResponse,
            "description": "The execution queue could not accept the workflow run.",
            "content": {"application/json": {"example": {"detail": "Workflow execution queue is temporarily unavailable."}}},
        },
    },
)
async def run_workflow(workflow_name: str, data: WorkflowExecuteRequest = Body(..., examples={"queued_run": {"summary": "Queue a workflow run", "value": {"employees": [{"name": "Priya Nair", "email": "priya@workflowstudio.local", "phone": "+1-555-0108", "role": "Operator", "joining_date": "2026-06-04"}]}}}), token_payload: dict = Depends(get_current_user_claims)):
    verify_operational_clearance(token_payload)
    workflow = db.workflows.find_one({"name": workflow_name})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow configuration was not found.")
    if not data.employees or not data.employees[0].get("email", "").strip():
        raise HTTPException(status_code=422, detail="A valid employee email is required to run the workflow.")

    idempotency_key = f"workflow-execution:{workflow_name}:{data.employees[0]['email'].strip()}"
    try:
        lock_acquired = await acquire_execution_lock(idempotency_key)
    except Exception as exc:
        logger.exception("Execution queue is unavailable while acquiring the lock for %s", workflow_name)
        raise HTTPException(status_code=503, detail="Workflow execution queue is temporarily unavailable.") from exc
    if not lock_acquired:
        raise HTTPException(status_code=409, detail="Workflow is already running for this employee.")

    run_id = str(uuid.uuid4())
    saga_created = False
    try:
        SagaState.create(run_id, workflow_name, data.employees)
        saga_created = True
        SagaManager.start(run_id)
        execute_workflow_task.apply_async(
            args=(workflow_name, data.dict(), run_id, idempotency_key),
            retry=True,
            retry_policy={
                "max_retries": 3,
                "interval_start": 0,
                "interval_step": 0.2,
                "interval_max": 0.5,
            },
        )
    except Exception as exc:
        # A broker outage must remain visible in the backend logs; the former
        # broad handler discarded the only useful cause of a 503 response.
        logger.exception("Unable to queue workflow run %s for %s", run_id, workflow_name)
        if saga_created:
            try:
                SagaManager.fail(run_id)
            except Exception:
                logger.exception("Unable to mark workflow run %s as failed", run_id)
        try:
            await release_lock(idempotency_key)
        except Exception:
            logger.exception("Unable to release the execution lock for run %s", run_id)
        raise HTTPException(status_code=503, detail="Workflow execution could not be queued.")

    return {
        "run_id": run_id,
        "status": "queued"
    }


@router.get(
    "/workflows",
    response_model=List[WorkflowSummary],
    summary="List saved workflows",
    description="Return the available saved workflow definitions, including creation and update metadata when present.",
    responses={
        200: {"description": "List of workflow definitions returned successfully", "content": {"application/json": {"example": [{"name": "new-hire-onboarding", "nodes": [{"id": "start", "type": "start"}], "edges": [], "created_at": "2026-06-01T10:00:00", "updated_at": "2026-06-01T10:05:00"}]}}},
        401: {"model": ErrorResponse, "description": "The caller JWT token is missing or invalid."},
        403: {"model": ErrorResponse, "description": "The caller does not have operational clearance."},
    },
)
async def get_all_workflows(token_payload: dict = Depends(get_current_user_claims)):
    verify_operational_clearance(token_payload)

    try:
        cached_data = await get_cached("all_workflows")
    except Exception:
        logger.exception("Saved workflows cache is unavailable; reading MongoDB directly")
        cached_data = None

    if cached_data:
        print("CACHE HIT: workflows")
        return json.loads(cached_data)

    print("CACHE MISS: workflows")

    cursor = db.workflows.find()

    output = []

    for w in cursor:
        created_at = w.get("created_at") or w.get("updated_at") or getattr(w.get("_id"), "generation_time", None)
        output.append(
            {
                "name": w.get("name", "Notification Workflow"),
                "nodes": w.get("nodes", []),
                "edges": w.get("edges", []),
                "created_at": created_at.isoformat() if created_at else None,
                "updated_at": w.get("updated_at").isoformat() if getattr(w.get("updated_at"), "isoformat", None) else None,
            }
        )

    try:
        await set_cached(
            "all_workflows",
            json.dumps(output),
            ttl=60
        )
    except Exception:
        logger.exception("Unable to cache saved workflows")

    return output


@router.get("/history")
# @router.get(
#     "/history",
#     tags=["History"]
# )
async def get_execution_history(
    token_payload: dict = Depends(get_current_user_claims)
):
    verify_operational_clearance(token_payload)

    try:
        cached_data = await get_cached("history")
    except Exception:
        # Execution history is backed by MongoDB; Redis is an optional cache.
        # Do not fail the history page while Redis/DNS is recovering.
        logger.exception("Execution history cache is unavailable; reading MongoDB directly")
        cached_data = None

    if cached_data:
        print("CACHE HIT: history")
        return json.loads(cached_data)

    print("CACHE MISS: history")

    cursor = db.history.find()

    output = []

    for h in cursor:
        occurred_at = h.get("completed_at") or h.get("created_at") or h.get("updated_at") or getattr(h.get("_id"), "generation_time", None)
        output.append(
            {
                "workflow_name": h.get(
                    "workflow_name",
                    "Unknown Workflow"
                ),
                "status": h.get(
                    "status",
                    "Completed"
                ),
                "employee": h.get("employee_name") or h.get("employee"),
                "completed_at": occurred_at.isoformat() if getattr(occurred_at, "isoformat", None) else None,
            }
        )

    try:
        await set_cached(
            "history",
            json.dumps(output),
            ttl=30
        )
    except Exception:
        logger.exception("Unable to cache execution history")

    return output

@router.get("/cache/stats")
def cache_stats():
    return get_cache_stats()

@router.get("/run-status/{run_id}")
def get_run_status(run_id: str):

    task = AsyncResult(run_id)

    return {
        "run_id": run_id,
        "status": task.status,
        "result": task.result if task.ready() else None
    }
