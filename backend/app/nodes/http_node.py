import httpx
from typing import Any, Dict
from app.nodes.base import BaseNode

class HTTPRequestNode(BaseNode):
    """
    Sprint 2 Deliverable: HTTPRequestNode execution component block.
    """
    async def execute(self, url: str, method: str = "GET", payload: Dict[str, Any] = None) -> Dict[str, Any]:
        if not url:
            return {"status": "FAILED", "error": "Missing destination target URL"}
        
        async with httpx.AsyncClient() as client:
            method_normalized = method.upper()
            try:
                if method_normalized == "POST":
                    response = await client.post(url, json=payload or {}, timeout=10.0)
                else:
                    response = await client.get(url, params=payload, timeout=10.0)
                
                return {
                    "status_code": response.status_code,
                    "body": response.json() if "application/json" in response.headers.get("content-type", "") else response.text
                }
            except Exception as e:
                raise RuntimeError(f"HTTP Target node connection failed: {str(e)}")