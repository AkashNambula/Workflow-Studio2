from __future__ import annotations

import re
from typing import Tuple


class IntentMatcher:
    def match(self, message: str) -> Tuple[str, str | None]:
        normalized = (message or "").strip().lower()

        if not normalized:
            return "general", None

        workflow_patterns = [
            r"\b(create|new|build|make)\b.*\b(workflow)\b",
            r"\bworkflow\b.*\b(create|build|make|start)\b",
            r"\bworkflow creation\b",
        ]
        if any(re.search(pattern, normalized) for pattern in workflow_patterns):
            return "workflow-builder", "workflow-builder.md"
        
        password_patterns = [
            r"\b(change|update|reset|forgot)\b.*\b(password)\b",
            r"\bpassword\b.*\b(change|update|reset)\b",
        ]
        if any(re.search(pattern, normalized) for pattern in password_patterns):
            return "account-settings", "account-settings.md"
        
        history_patterns = [
            r"\b(execution|run|runs)\b.*\b(history)\b",
            r"\b(history)\b",
            r"\bexecution history\b",
        ]
        if any(re.search(pattern, normalized) for pattern in history_patterns):
            return "execution-history", "execution-history.md"
        
        saved_patterns = [
            r"\bsaved workflows\b",
            r"\bsaved workflow\b",
        ]
        if any(re.search(pattern, normalized) for pattern in saved_patterns):
            return "saved-workflows", "saved-workflows.md"

        recent_patterns = [
            r"\brecent runs\b",
            r"\brecent run\b",
        ]
        if any(re.search(pattern, normalized) for pattern in recent_patterns):
            return "recent-runs", "recent-runs.md"
        
        return "general", None
