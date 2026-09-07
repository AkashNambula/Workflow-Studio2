from fastapi import APIRouter, Depends, HTTPException, status
from app.db.database import db
from app.api.auth import get_current_user_claims

router = APIRouter(tags=["Dashboard"])


@router.get("/admin/dashboard")
def admin_dashboard(token_payload: dict = Depends(get_current_user_claims)):

    user_identity = token_payload.get("sub", "")

    current_admin = db.users.find_one({"email": user_identity})

    if not current_admin or current_admin.get("role", "") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can access Dashboard."
        )

    total_users = db.users.count_documents({})

    total_workflows = db.workflows.count_documents({})

    completed_runs = db.history.count_documents(
        {"status": "Completed"}
    )

    failed_runs = db.history.count_documents(
        {"status": "Failed"}
    )

    running_runs = db.history.count_documents(
        {"status": "Running"}
    )

    recent_runs = []

    history = db.history.find().sort("_id", -1).limit(5)

    for item in history:

        recent_runs.append({

            "workflow_name": item.get("workflow_name", ""),

            "employee": item.get("employee_name", ""),

            "status": item.get("status", ""),

            "time": str(item.get("created_at", ""))

        })

    return {

        "total_users": total_users,

        "total_workflows": total_workflows,

        "completed_runs": completed_runs,

        "failed_runs": failed_runs,

        "running_runs": running_runs,

        "recent_runs": recent_runs

    }