import logging

from fastapi import APIRouter, Request
from pydantic import BaseModel
from jose import jwt

from app.chatbot.chat_service import ChatService
from app.core.security import ALGORITHM, JWT_SECRET
from app.db.database import db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chatbot"])
service = ChatService()


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    navigation_route: str | None = None
    navigation_label: str | None = None


@router.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest, http_request: Request) -> ChatResponse:
    try:
        current_user = None
        auth_header = http_request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
                current_user = payload
                try:
                    db_user = db.users.find_one({"email": payload.get("sub")})
                    if db_user:
                        current_user = {
                            "sub": db_user.get("email"),
                            "role": db_user.get("role", "Viewer"),
                            "name": db_user.get("name", ""),
                        }
                except Exception:
                    current_user = {
                        "sub": payload.get("sub"),
                        "role": payload.get("role", "Viewer"),
                        "name": payload.get("name", ""),
                    }
            except Exception:
                current_user = None

        reply = service.get_reply(request.message, current_user=current_user, conversation_id=request.conversation_id)
        navigation_route = None
        navigation_label = None
        if request.message.lower().startswith("open ") or "saved workflows" in request.message.lower() or "execution history" in request.message.lower() or "recent runs" in request.message.lower() or "user management" in request.message.lower() or "account settings" in request.message.lower() or "change password" in request.message.lower() or "my profile" in request.message.lower() or "profile" in request.message.lower():
            route_map = {
                "dashboard": "/dashboard",
                "saved workflows": "/saved-workflows",
                "execution history": "/execution-history",
                "recent runs": "/admin-dashboard",
                "user management": "/user-management",
                "account settings": "/dashboard",
                "change password": "/dashboard",
                "my profile": "/my-profile",
                "profile": "/my-profile",
            }
            lowered = request.message.lower()
            for key, route in route_map.items():
                if key in lowered:
                    navigation_route = route
                    navigation_label = key.replace("dashboard", "Dashboard").title()
                    break

        return ChatResponse(reply=reply, navigation_route=navigation_route, navigation_label=navigation_label)
    except Exception:
        logger.exception("Chat endpoint failed")
        raise
