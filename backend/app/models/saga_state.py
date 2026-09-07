from enum import Enum
from datetime import datetime
from app.db.database import db


class SagaStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    FAILED = "FAILED"
    COMPENSATING = "COMPENSATING"
    COMPENSATED = "COMPENSATED"
    COMPLETED = "COMPLETED"


class SagaState:

    collection = db.saga_states

    @classmethod
    def create(
    cls,
    run_id: str,
    workflow_name: str,
    employees: list
):
        cls.collection.insert_one({
        "run_id": run_id,
        "workflow_name": workflow_name,
        "employees": employees,
        "status": SagaStatus.PENDING.value,
        "completed_nodes": [],
        "current_node": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })

    @classmethod
    def update_status(cls, run_id: str, status: SagaStatus):
        cls.collection.update_one(
            {"run_id": run_id},
            {
                "$set": {
                    "status": status.value,
                    "updated_at": datetime.utcnow()
                }
            }
        )

    @classmethod
    def update_current_node(cls, run_id: str, node_id: str):
        cls.collection.update_one(
            {"run_id": run_id},
            {
                "$set": {
                    "current_node": node_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )

    @classmethod
    def add_completed_node(cls, run_id: str, node_data: dict):
        cls.collection.update_one(
            {"run_id": run_id},
            {
                "$push": {
                    "completed_nodes": node_data
                },
                "$set": {
                    "updated_at": datetime.utcnow()
                }
            }
        )



    @classmethod
    def get(cls, run_id: str):
        return cls.collection.find_one({"run_id": run_id})