import httpx
from typing import Dict, Any
from app.models.base_node import BaseNode
from app.core.retry import retryable

class HTTPRequestNode(BaseNode):
    """
    NodeExecutor Subclass: Handles custom outbound webhook triggers asynchronously.
    Enforces the BaseNode ABC contract and wraps processing within retry parameters.
    """
    @retryable(max_attempts=3, base_delay=1.0)
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        url = self.data.get("url")
        method = self.data.get("method", "GET").upper()
        payload = self.data.get("payload", {})

        if not url:
            raise ValueError(f"HTTP Node {self.node_id} is missing its required endpoint URL configuration string.")

        async with httpx.AsyncClient(timeout=5.0) as client:
            print(f"📡 [HTTP Action Node {self.node_id}]: Firing async {method} request to {url}...")
            if method == "POST":
                response = await client.post(url, json=payload)
            else:
                response = await client.get(url)
            
            # 🟢 CRITICAL: This throws an exception on 4xx or 5xx responses, which kicks off our @retryable backoff decorator!
            response.raise_for_status()
            
            context[f"http_res_{self.node_id}"] = response.json()
            return context