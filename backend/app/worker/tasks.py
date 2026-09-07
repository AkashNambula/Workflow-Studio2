import asyncio
from datetime import datetime
import logging

from app.core.saga_manager import SagaManager
from app.engine.executor import run_workflow
from app.db.database import db
from app.worker.celery_app import celery_app
from app.core.cache import delete_cached
from app.core.idempotency import release_lock

logger = logging.getLogger(__name__)


def record_execution_history(run_id, workflow_name, employees, status):
    """Persist the outcome for this run only, so the history views stay live."""
    first_employee = employees[0] if employees else {}
    db.history.update_one(
        {"run_id": run_id},
        {
            "$set": {
                "workflow_name": workflow_name,
                "employee_name": first_employee.get("name"),
                "employee": first_employee.get("name"),
                "status": status,
                "completed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            },
            "$setOnInsert": {"created_at": datetime.utcnow()},
        },
        upsert=True,
    )


def invalidate_history_cache():
    """Ensure history is visible immediately after this legitimate run update."""
    try:
        asyncio.run(delete_cached("history"))
    except Exception:
        logger.exception("Unable to invalidate execution history cache")


@celery_app.task(acks_late=True)
def execute_workflow_task(workflow_name, employee_data, run_id, idempotency_key=None):

    print("[CELERY] Worker started")
    print(f"Running workflow: {workflow_name}")
    print(f"Run ID: {run_id}")

    try:
        SagaManager.start(run_id)
        workflow = db.workflows.find_one({"name": workflow_name})
        saga = SagaManager.get_state(run_id)

        if saga:
            employee_data["employees"] = saga.get("employees", [])

        if not workflow:
            SagaManager.fail(run_id)
            record_execution_history(run_id, workflow_name, employee_data.get("employees", []), "Failed")
            invalidate_history_cache()
            return {"status": "FAILED", "message": "Workflow not found"}

        logs = asyncio.run(
            run_workflow(
                workflow["nodes"],
                workflow["edges"],
                employee_data.get("employees", []),
                run_id,
                workflow_name
            )
        )
        SagaManager.complete(run_id)
        record_execution_history(run_id, workflow_name, employee_data.get("employees", []), "Completed")
        invalidate_history_cache()
        print("[CELERY] Workflow execution completed")
        return {"run_id": run_id, "workflow_name": workflow_name, "status": "SUCCESS", "logs": logs}
    except Exception:
        SagaManager.fail(run_id)
        record_execution_history(run_id, workflow_name, employee_data.get("employees", []), "Failed")
        invalidate_history_cache()
        logger.exception("Workflow run %s failed", run_id)
        raise
    finally:
        if idempotency_key:
            try:
                asyncio.run(release_lock(idempotency_key))
            except Exception:
                print("[IDEMPOTENCY] Failed to release execution lock")
