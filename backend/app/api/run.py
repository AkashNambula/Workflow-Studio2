from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import require_operator_or_admin
from app.db.database import db
from pydantic import BaseModel
from typing import List, Dict, Any
import uuid

# 🟢 DELIVERABLE 1 FIX: Import the asynchronous worker directly from your executor module
from app.engine.executor import run_workflow

router = APIRouter(tags=["Workflow Execution Engine"])

class Employee(BaseModel):
    name: str
    email: str
    phone: str
    role: str
    joining_date: str

class RunRequest(BaseModel):
    employees: List[Employee]


# 🟢 DELIVERABLE 1.2 FIX: Turned into an explicit async def route handler to manage coroutines safely
@router.post("/run-workflow/{workflow_name}")
async def execute_workflow(
    workflow_name: str,
    request: RunRequest,
    user: dict = Depends(require_operator_or_admin)
):
    workflow = db.workflows.find_one({"name": workflow_name})

    if not workflow:
        raise HTTPException(status_code=404, detail="Target workflow template profile not found.")

    # 🟢 DELIVERABLE 1.3 FIX: Generate an explicit, unique UUID4 run identification string block
    run_id = str(uuid.uuid4())

    # 🟢 DELIVERABLE 1.2 FIX: Implemented the critical 'await' keyword so the async executor fires perfectly
    logs = await run_workflow(
        workflow["nodes"],
        workflow["edges"],
        [emp.dict() for emp in request.employees],
        run_id  # 🟢 Passed the fresh unique run_id token here instead of workflow_name string!
    )

    # Commit the logs dataset trace safely back into your tracking collection matrix
    db.workflow_runs.insert_one({
        "run_id": run_id,
        "workflow_name": workflow_name,
        "employees": [emp.dict() for emp in request.employees],
        "status": "completed",
        "logs": logs
    })

    # 🟢 DELIVERABLE 1.3 FIX: Returning the formal structure format containing message, run_id, and execution logs
    return {
        "message": "Workflow executed successfully",
        "run_id": run_id,
        "logs": logs
    }