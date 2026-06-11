from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from datetime import datetime
from typing import Dict, List

router = APIRouter(tags=["Streaming Real-Time Logs"])

class ConnectionManager:
    """
    Coordinates live socket pipeline pools mapped explicitly to background run trackers.
    """
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, run_id: str, websocket: WebSocket):
        await websocket.accept()
        if run_id not in self.active_connections:
            self.active_connections[run_id] = []
        self.active_connections[run_id].append(websocket)
        print(f"🔌 [WebSocket Hooked]: Live tracking established for instance context run: {run_id}")

    def disconnect(self, run_id: str, websocket: WebSocket):
        if run_id in self.active_connections:
            self.active_connections[run_id].remove(websocket)
            if not self.active_connections[run_id]:
                del self.active_connections[run_id]
        print(f"🔌 [WebSocket Dropped]: Live track dropped for run: {run_id}")

    async def broadcast_step_update(self, run_id: str, node_id: str, status: str):
        """
        Emits standard {node_id, status, timestamp} payloads directly downstream to the visual dashboard loggers.
        """
        if run_id in self.active_connections:
            payload = {
                "node_id": node_id,
                "status": status.upper(),
                "timestamp": datetime.utcnow().isoformat()
            }
            message_string = json.dumps(payload)
            for connection in self.active_connections[run_id]:
                try:
                    await connection.send_text(message_string)
                except Exception:
                    pass

manager = ConnectionManager()

# 🟢 FIXED: Mapping 'broadcast_node_state' to match executor.py's import statement precisely
async def broadcast_node_state(run_id: str, node_id: str, status: str):
    """
    Alias wrapper function mapping node execution states directly to the connection pool manager.
    """
    await manager.broadcast_step_update(run_id, node_id, status)


@router.websocket("/ws/runs/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    await manager.connect(run_id, websocket)
    try:
        while True:
            # Keeps the socket connection alive and listening for client window closures
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(run_id, websocket)