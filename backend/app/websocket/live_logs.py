from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import datetime
import json
from typing import Dict, List

router = APIRouter()

# Global connection manager connection tracing pool
active_connections: Dict[str, List[WebSocket]] = {}

@router.websocket("/ws/runs/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str) -> None:
    await websocket.accept()
    if run_id not in active_connections:
        active_connections[run_id] = []
    active_connections[run_id].append(websocket)
    
    try:
        while True:
            # Keep channel links alive over active framework heartbeats
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections[run_id].remove(websocket)
        if not active_connections[run_id]:
            del active_connections[run_id]

async def broadcast_node_state(run_id: str, node_id: str, status: str) -> None:
    """
    🟢 FIXED: Real-time broadcast emission delivering metrics cleanly directly down to connection links
    """
    if run_id in active_connections:
        payload = {
            "node_id": str(node_id),
            "status": str(status),
            "timestamp": str(datetime.datetime.now().isoformat())
        }
        message = json.dumps(payload)
        for connection in active_connections[run_id]:
            try:
                await connection.send_text(message)
            except Exception:
                pass