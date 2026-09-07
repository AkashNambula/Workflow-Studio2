from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user_claims
from app.db.database import db

router = APIRouter(tags=["Analytics"])


def verify_analytics_access(token_payload: dict):
    user = db.users.find_one({"email": token_payload.get("sub", "")})
    if not user or user.get("role") not in ["Admin", "Operator"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def start_for_range(time_range: str):
    ranges = {"24h": timedelta(hours=24), "7d": timedelta(days=7), "14d": timedelta(days=14), "30d": timedelta(days=30), "all": None}
    if time_range not in ranges:
        raise HTTPException(status_code=422, detail="time_range must be 24h, 7d, 14d, 30d, or all")
    duration = ranges[time_range]
    return datetime.now(timezone.utc).replace(tzinfo=None) - duration if duration else None


def status_bucket(status):
    value = str(status or "").lower()
    if any(word in value for word in ("success", "completed", "executed")):
        return "Successful"
    if "fail" in value or "error" in value:
        return "Failed"
    return "Other"


def timestamp(item):
    value = item.get("completed_at") or item.get("created_at") or item.get("updated_at")
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)
    # ObjectId generation time is a read-only, Mongo-provided fallback for older records.
    object_id = item.get("_id")
    fallback = getattr(object_id, "generation_time", None)
    return fallback.replace(tzinfo=None) if isinstance(fallback, datetime) else None


def iso_timestamp(value):
    return value.isoformat() if isinstance(value, datetime) else None


@router.get("/analytics")
def analytics(time_range: str = Query("30d"), token_payload: dict = Depends(get_current_user_claims)):
    verify_analytics_access(token_payload)
    start = start_for_range(time_range)
    records = []
    # History drives the current history UI; saga states are used only when it
    # has no persisted records, which keeps analytics tied to real executions.
    source = db.history if db.history.count_documents({}) else db.saga_states
    for item in source.find():
        occurred_at = timestamp(item)
        if start and (not occurred_at or occurred_at.replace(tzinfo=None) < start):
            continue
        records.append({
            "workflow_name": item.get("workflow_name", "Unknown Workflow"),
            "status": item.get("status", "Unknown"),
            "bucket": status_bucket(item.get("status")),
            "occurred_at": occurred_at,
            "operator": item.get("updated_by") or item.get("user") or item.get("operator") or item.get("email"),
            "employee": item.get("employee_name") or item.get("employee"),
        })

    successful = sum(item["bucket"] == "Successful" for item in records)
    failed = sum(item["bucket"] == "Failed" for item in records)
    statuses = {}
    workflows = {}
    trend = {}
    operators = {}
    for item in records:
        statuses[item["bucket"]] = statuses.get(item["bucket"], 0) + 1
        workflows[item["workflow_name"]] = workflows.get(item["workflow_name"], 0) + 1
        if item["occurred_at"]:
            day = item["occurred_at"].strftime("%Y-%m-%d")
            point = trend.setdefault(day, {"date": day, "successful": 0, "failed": 0, "other": 0, "total": 0})
            point[item["bucket"].lower()] += 1
            point["total"] += 1
        if item["operator"]:
            operators[item["operator"]] = operators.get(item["operator"], 0) + 1

    # Saved workflow records and execution records are read independently, then
    # combined in memory. This avoids mutations and works for documents created
    # before timestamp fields were added (ObjectId time is used as a fallback).
    saved_workflows = []
    for workflow in db.workflows.find():
        saved_at = timestamp(workflow)
        name = workflow.get("name", "Unknown Workflow")
        activity_count = workflows.get(name, 0)
        latest_execution = max(
            (record["occurred_at"] for record in records if record["workflow_name"] == name and record["occurred_at"]),
            default=None,
        )
        saved_workflows.append({
            "name": name,
            "activity_count": activity_count,
            "saved_at": iso_timestamp(saved_at),
            "latest_execution": iso_timestamp(latest_execution),
        })

    # A workflow may be recently used without having been newly saved. Those
    # are included in Recent Workflows, with real execution timestamps only.
    recent_workflows = []
    for workflow in db.workflows.find():
        name = workflow.get("name", "Unknown Workflow")
        matching_records = [record for record in records if record["workflow_name"] == name]
        latest_execution = max((record["occurred_at"] for record in matching_records if record["occurred_at"]), default=None)
        workflow_timestamp = timestamp(workflow)
        latest_activity = latest_execution or workflow_timestamp
        if latest_activity and (not start or latest_activity >= start):
            recent_workflows.append({
                "name": name,
                "activity_count": len(matching_records),
                "latest_execution": iso_timestamp(latest_execution),
                "latest_activity": iso_timestamp(latest_activity),
            })

    history_by_day = [trend[key] for key in sorted(trend, reverse=True)[:8]]
    return {
        "summary": {
            "total_executions": len(records), "successful_executions": successful,
            "failed_executions": failed, "success_rate": round(successful / len(records) * 100, 1) if records else 0,
            "workflows": len(saved_workflows), "users": db.users.count_documents({}),
        },
        "trend": [trend[key] for key in sorted(trend)],
        "status_distribution": [{"status": key, "count": value} for key, value in statuses.items()],
        "workflow_activity": [{"name": key, "count": value} for key, value in sorted(workflows.items(), key=lambda row: row[1], reverse=True)[:8]],
        "operator_activity": [{"name": key, "count": value} for key, value in sorted(operators.items(), key=lambda row: row[1], reverse=True)[:8]],
        "saved_workflows": sorted(saved_workflows, key=lambda item: (item["activity_count"], item["saved_at"] or ""), reverse=True)[:8],
        "recent_workflows": sorted(recent_workflows, key=lambda item: item["latest_activity"] or "", reverse=True)[:8],
        "execution_history": history_by_day,
    }
