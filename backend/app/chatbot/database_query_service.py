from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List

from app.db.database import db


class DatabaseQueryService:
    def __init__(self, database: Any | None = None) -> None:
        self.database = database or db

    def get_dashboard_statistics(self, current_user: Dict[str, Any] | None = None) -> Dict[str, Any]:
        total_users = self._safe_count("users")
        total_workflows = self._safe_count("workflows")
        completed_runs = self._safe_count("history", {"status": "Completed"})
        failed_runs = self._safe_count("history", {"status": "Failed"})
        running_runs = self._safe_count("history", {"status": "Running"})
        recent_runs = self._safe_recent_history(limit=5)

        result = {
            "total_users": total_users,
            "total_workflows": total_workflows,
            "completed_runs": completed_runs,
            "failed_runs": failed_runs,
            "running_runs": running_runs,
            "recent_runs": [self._serialize_history_item(item) for item in recent_runs],
        }

        if current_user:
            result["current_user"] = {
                "email": current_user.get("sub"),
                "role": current_user.get("role"),
            }

        return result

    def get_user_count(self) -> int:
        return self._safe_count("users")

    def get_workflow_count(self) -> int:
        return self._safe_count("workflows")

    def get_saved_workflow_count(self) -> int:
        return self._safe_count("workflows")

    def get_execution_count(self) -> int:
        return self._safe_count("history")

    def get_failed_execution_count(self) -> int:
        return self._safe_count("history", {"status": "Failed"})

    def get_today_execution_count(self) -> int:
        today = datetime.utcnow().date()
        start = datetime(today.year, today.month, today.day)
        end = start + timedelta(days=1)
        return self._safe_count("history", {"created_at": {"$gte": start, "$lt": end}})

    def get_latest_registered_user(self) -> Dict[str, Any] | None:
        user = self._safe_find_one("users", {}, sort=[("_id", -1)])
        if not user:
            return None
        return {"name": user.get("name", ""), "email": user.get("email", ""), "role": user.get("role", "")}

    def get_latest_execution(self) -> Dict[str, Any] | None:
        item = self._safe_find_one("history", {}, sort=[("_id", -1)])
        if not item:
            return None
        return self._serialize_history_item(item)

    def get_user_role_counts(self) -> Dict[str, int]:
        counts = {"Admin": 0, "Operator": 0, "Viewer": 0}
        try:
            for user in self.database.users.find({}):
                role = user.get("role", "Viewer")
                counts[role] = counts.get(role, 0) + 1
        except Exception:
            return counts
        return counts

    def _safe_count(self, collection_name: str, filter: Dict[str, Any] | None = None) -> int:
        try:
            collection = getattr(self.database, collection_name)
            return collection.count_documents(filter or {})
        except Exception:
            return 0

    def _safe_find_one(self, collection_name: str, filter: Dict[str, Any] | None = None, sort: List[tuple[str, int]] | None = None) -> Dict[str, Any] | None:
        try:
            collection = getattr(self.database, collection_name)
            if sort:
                return collection.find_one(filter or {}, sort=sort)
            return collection.find_one(filter or {})
        except Exception:
            return None

    def _safe_recent_history(self, limit: int) -> List[Dict[str, Any]]:
        try:
            return list(self.database.history.find().sort("_id", -1).limit(limit))
        except Exception:
            return []

    def _serialize_history_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        created_at = item.get("created_at")
        if isinstance(created_at, datetime):
            created_at_text = created_at.isoformat()
        else:
            created_at_text = str(created_at or "")

        return {
            "workflow_name": item.get("workflow_name", ""),
            "employee": item.get("employee_name", ""),
            "status": item.get("status", ""),
            "time": created_at_text,
        }
