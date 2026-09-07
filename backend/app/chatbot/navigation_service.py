from __future__ import annotations

from typing import Dict, List, Tuple


class NavigationService:
    def resolve(self, message: str) -> Dict[str, object]:
        normalized = (message or "").strip().lower()
        routes: List[Tuple[str, str, List[str]]] = [
            ("/dashboard", "Dashboard", ["dashboard", "open dashboard", "go to dashboard"]),
            ("/saved-workflows", "Saved Workflows", ["saved workflows", "saved workflow", "open saved workflows"]),
            ("/execution-history", "Execution History", ["execution history", "open execution history", "show execution history"]),
            ("/admin-dashboard", "Recent Runs", ["recent runs", "open recent runs", "show recent runs"]),
            ("/user-management", "User Management", ["user management", "open user management", "manage users"]),
            ("/my-profile", "My Profile", ["my profile", "profile", "open profile"]),
            ("/dashboard", "Account Settings", ["account settings", "open account settings", "change password"]),
        ]

        for route, label, patterns in routes:
            if any(pattern in normalized for pattern in patterns):
                return {"should_navigate": True, "route": route, "label": label, "reply": f"Opening {label}."}

        return {"should_navigate": False, "route": None, "label": None, "reply": ""}
