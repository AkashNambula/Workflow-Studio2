import asyncio

from app.core.saga_manager import SagaManager
from app.engine.executor import run_workflow
from app.db.database import db
from app.worker.celery_app import celery_app


@celery_app.task
def execute_workflow_task(workflow_name, employee_data, run_id):

    print("[CELERY] Worker started")
    print(f"Running workflow: {workflow_name}")
    print(f"Run ID: {run_id}")

    # Start Saga
    SagaManager.start(run_id)

    # Fetch workflow
    workflow = db.workflows.find_one(
        {"name": workflow_name}
    )

    if not workflow:
        SagaManager.fail(run_id)
        return {
            "status": "FAILED",
            "message": "Workflow not found"
        }

    print("[CELERY] About to call run_workflow()")

    # Execute workflow
    logs = asyncio.run(
        run_workflow(
            workflow["nodes"],
            workflow["edges"],
            employee_data.get("employees", []),
            run_id,
            workflow_name
        )
    )

    # Mark Saga completed
    SagaManager.complete(run_id)

    print("[CELERY] Workflow execution completed")

    return {
        "run_id": run_id,
        "workflow_name": workflow_name,
        "status": "SUCCESS",
        "logs": logs
    }