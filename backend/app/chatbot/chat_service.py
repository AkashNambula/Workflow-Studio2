from __future__ import annotations

from typing import Any, Dict

from app.chatbot.database_query_service import DatabaseQueryService
from app.chatbot.documentation_service import DocumentationService
from app.chatbot.gemini_service import GeminiService
from app.chatbot.intent_service import IntentService
from app.chatbot.navigation_service import NavigationService


class ChatService:
    def __init__(self) -> None:
        self.documentation_service = DocumentationService()
        self.intent_service = IntentService()
        self.navigation_service = NavigationService()
        self.database_query_service = DatabaseQueryService()
        self.gemini_service = GeminiService()
        self._sessions: Dict[str, list[dict[str, str]]] = {}

    def get_reply(self, message: str, current_user: Dict[str, Any] | None = None, conversation_id: str | None = None) -> str:
        if not message or not message.strip():
            return "How can I help with Workflow Studio today?"

        session_id = conversation_id or "default"
        history = self._sessions.setdefault(session_id, [])
        history.append({"role": "user", "content": message})

        intent_info = self.intent_service.classify(message)
        navigation = self.navigation_service.resolve(message)
        if navigation["should_navigate"]:
            history.append({"role": "assistant", "content": navigation["reply"]})
            return navigation["reply"]

        if intent_info.get("needs_live_data"):
            data = self._collect_live_data(current_user)
            context = self._build_live_data_context(data, message, intent_info)
            reply = self._respond_with_context(message, context, intent_info, history)
            history.append({"role": "assistant", "content": reply})
            return reply

        docs_context = self.documentation_service.get_context(message)
        if docs_context:
            reply = self._respond_with_context(message, docs_context, intent_info, history)
            history.append({"role": "assistant", "content": reply})
            return reply

        reply = self._fallback_reply(message, intent_info)
        history.append({"role": "assistant", "content": reply})
        return reply

    def _collect_live_data(self, current_user: Dict[str, Any] | None = None) -> Dict[str, Any]:
        stats = self.database_query_service.get_dashboard_statistics(current_user=current_user)
        role_counts = self.database_query_service.get_user_role_counts()
        latest_user = self.database_query_service.get_latest_registered_user()
        latest_execution = self.database_query_service.get_latest_execution()
        return {
            **stats,
            "role_counts": role_counts,
            "latest_user": latest_user,
            "latest_execution": latest_execution,
        }

    def _build_live_data_context(self, data: Dict[str, Any], message: str, intent_info: Dict[str, object]) -> str:
        language = intent_info.get("language", "english")
        user_context = data.get("current_user", {})
        role = user_context.get("role") or "Viewer"
        summary = (
            f"Current user role: {role}. "
            f"Total users: {data.get('total_users', 0)}. "
            f"Total workflows: {data.get('total_workflows', 0)}. "
            f"Completed runs: {data.get('completed_runs', 0)}. "
            f"Failed runs: {data.get('failed_runs', 0)}. "
            f"Running runs: {data.get('running_runs', 0)}."
        )
        if data.get("latest_user"):
            latest_user = data["latest_user"]
            summary += f" Latest registered user: {latest_user.get('name', '')} ({latest_user.get('email', '')}, {latest_user.get('role', '')})."
        if data.get("latest_execution"):
            latest_execution = data["latest_execution"]
            summary += f" Latest workflow execution: {latest_execution.get('workflow_name', '')} status {latest_execution.get('status', '')} at {latest_execution.get('time', '')}."
        if data.get("role_counts"):
            counts = data["role_counts"]
            summary += f" Admin count: {counts.get('Admin', 0)}. Viewer count: {counts.get('Viewer', 0)}. Operator count: {counts.get('Operator', 0)}."

        if language == "telugu_mixed":
            summary += " Reply in a concise Telugu-English mixed style."
        elif language == "telugu":
            summary += " Reply entirely in Telugu."
        else:
            summary += " Reply in English."

        return (
            "Use the following verified application data only and do not invent values. "
            f"Question: {message}\n\nData: {summary}\n\n"
            "If the data is unavailable, say that it could not be retrieved from the application backend."
        )

    def _respond_with_context(self, message: str, context: str, intent_info: Dict[str, object], history: list[dict[str, str]]) -> str:
        history_text = "\n".join(f"{entry['role']}: {entry['content']}" for entry in history[-6:])
        prompt = (
            "You are the Workflow Studio AI Application Assistant. "
            "Answer only from the supplied documentation and verified application data. "
            "Do not hallucinate application-specific features. "
            "If the information is not available in the documentation or data, say: 'I couldn't find this information in the application documentation.' "
            f"Previous conversation:\n{history_text}\n\nUser question: {message}\n\nContext:\n{context}"
        )
        reply = self.gemini_service.generate_response(prompt)
        if reply and ("temporarily unavailable" in reply.lower() or "could not reach gemini" in reply.lower()):
            return self._fallback_from_context(context)
        return reply

    def _fallback_from_context(self, context: str) -> str:
        summary = context.strip()
        if not summary:
            return "I couldn't find this information inside Workflow Studio."
        if "Documentation title:" in summary:
            return summary.split("Documentation title:", 1)[1].strip().split("\n", 1)[1].strip() if "\n" in summary.split("Documentation title:", 1)[1] else summary
        return summary[:700].strip()

    def _fallback_reply(self, message: str, intent_info: Dict[str, object]) -> str:
        docs_context = self.documentation_service.get_context(message)
        if docs_context:
            return self._respond_with_context(message, docs_context, intent_info, [])
        return "I couldn't find this information inside Workflow Studio."
