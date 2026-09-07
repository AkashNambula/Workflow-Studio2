from fastapi import APIRouter, Depends

from app.core.security import require_admin
from app.db.database import db

router = APIRouter()


@router.get("/history")
# @router.get(
#     "/history",
#     tags=["History"]
# )
def get_history(user=Depends(require_admin)):
    history = list(db.workflow_runs.find({}, {"_id": 0}))
    return history 