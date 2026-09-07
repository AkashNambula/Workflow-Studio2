from __future__ import annotations

import re
from typing import Dict


class IntentService:
    def classify(self, message: str) -> Dict[str, object]:
        normalized = (message or "").strip().lower()
        if not normalized:
            return {"intent": "general", "language": "english", "needs_live_data": False}

        language = self._detect_language(normalized)

        navigation_patterns = [
            r"\b(open|go to|navigate to|show|launch)\b.*\b(dashboard|saved workflows|execution history|recent runs|user management|account settings|change password|my profile|profile)\b",
            r"\b(open|go to|show)\b.*\b(saved workflows|execution history|recent runs|user management|account settings|my profile|profile)\b",
            r"\b(change password|account settings|my profile)\b",
        ]
        if any(re.search(pattern, normalized) for pattern in navigation_patterns):
            return {"intent": "navigation", "language": language, "needs_live_data": False}

        live_data_patterns = [
            r"\bhow many\b.*\b(users|user|workflows|saved workflows|executions|runs|failed|failed workflows|today|recent runs)\b",
            r"\b(user count|workflow count|execution count|dashboard statistics|recent runs|latest workflow execution|latest registered user|current logged in user|role of current user|admin count|viewer count|operator count)\b",
            r"\b(registered|saved|failed|running|completed)\b"
        ]
        if any(re.search(pattern, normalized) for pattern in live_data_patterns):
            return {"intent": "live-data", "language": language, "needs_live_data": True}

        workflow_help_patterns = [
            r"\b(workflow|builder|create workflow|delay node|email node|http node|condition node|sms node|workflow execution|workflow create|create ela)\b",
            r"\b(ela|enti|cheyyi|unnaru|marchali|chupinchu|ante)\b"
        ]
        if any(re.search(pattern, normalized) for pattern in workflow_help_patterns):
            return {"intent": "workflow-help", "language": language, "needs_live_data": False}

        account_help_patterns = [
            r"\b(password|account settings|profile|login|registration|role|permissions|viewer)\b"
        ]
        if any(re.search(pattern, normalized) for pattern in account_help_patterns):
            return {"intent": "account-help", "language": language, "needs_live_data": False}

        return {"intent": "general", "language": language, "needs_live_data": False}

    def _detect_language(self, normalized: str) -> str:
        telugu_markers = ["ela", "enti", "cheyyi", "unnaru", "marchali", "chupinchu", "ante", "eppudu", "mari", "endi"]
        if any(marker in normalized for marker in telugu_markers):
            return "telugu_mixed"
        if any(marker in normalized for marker in ["telugu", "meeru", "nuvvu"]):
            return "telugu"
        return "english"