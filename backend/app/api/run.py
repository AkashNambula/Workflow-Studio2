from fastapi import APIRouter, Depends
from app.engine.executor import run_workflow
from app.db.database import db
from app.core.security import require_operator_or_admin
from pydantic import BaseModel
from typing import List

router = APIRouter()


class Employee(BaseModel):
    name: str
    email: str
    phone: str
    role: str
    joining_date: str


class RunRequest(BaseModel):
    employees: List[Employee]


@router.post("/run-workflow/{workflow_name}")
def execute_workflow(
    workflow_name: str,
    request: RunRequest,
    user=Depends(require_operator_or_admin)
):
    workflow = db.workflows.find_one({"name": workflow_name})

    if not workflow:
        return {"message": "Workflow not found"}

    logs = run_workflow(
        workflow["nodes"],
        workflow["edges"],
        request.employees,
        workflow_name
    )

    result = db.workflow_runs.insert_one({
        "workflow_name": workflow_name,
        "employees": [emp.dict() for emp in request.employees],
        "status": "completed",
        "logs": logs
    })

    print("Inserted ID:", result.inserted_id)
    print("Workflow saved to workflow_runs")

    return {
        "message": "Workflow executed successfully",
        "logs": logs
    }