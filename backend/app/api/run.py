from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_operator_or_admin
from app.db.database import db
from pydantic import BaseModel
from typing import List
from app.models.saga_state import SagaState
from app.core.idempotency import acquire_lock
from app.worker.tasks import execute_workflow_task
import uuid

router = APIRouter(tags=["Workflow Execution Engine"])


class Employee(BaseModel):
    name: str
    email: str
    phone: str
    role: str
    joining_date: str


class RunRequest(BaseModel):
    employees: List[Employee]


@router.post("/run-workflow/{workflow_name}")
async def execute_workflow(
    workflow_name: str,
    request: RunRequest,
    user: dict = Depends(require_operator_or_admin)
):
    workflow = db.workflows.find_one({"name": workflow_name})

    if not workflow:
        raise HTTPException(
            status_code=404,
            detail="Target workflow template profile not found."
        )

    run_id = str(uuid.uuid4())

    SagaState.create(
        run_id,
        workflow_name
    )

    print(f"[SAGA] Saga document created for Run ID: {run_id}")

    idempotency_key = (
        f"{workflow_name}:"
        f"{request.employees[0].email}"
    )

    lock_acquired = await acquire_lock(
        idempotency_key,
        ttl=300
    )

    if not lock_acquired:
        raise HTTPException(
            status_code=409,
            detail="Duplicate workflow request blocked."
        )

    execute_workflow_task.delay(
        workflow_name,
        {
            "employees": [
                emp.dict()
                for emp in request.employees
            ]
        },
        run_id
    )

    return {
        "message": "Workflow queued successfully",
        "run_id": run_id
    }