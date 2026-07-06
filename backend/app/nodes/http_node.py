import httpx
from typing import Dict, Any

from app.nodes.base import BaseNode
from app.core.retry import retryable


class HTTPRequestNode(BaseNode):

    @retryable(max_attempts=3, base_delay=1.0)
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:

        url = self.data.get("url")
        method = self.data.get("method", "GET").upper()
        payload = self.data.get("payload", {})

        if not url:
            raise ValueError(
                f"HTTP Node {self.node_id} is missing endpoint URL."
            )

        async with httpx.AsyncClient(timeout=5.0) as client:

            print(
                f"📡 HTTP Node {self.node_id}: {method} {url}"
            )

            if method == "POST":

                response = await client.post(
                    url,
                    json=payload
                )

            elif method == "PUT":

                response = await client.put(
                    url,
                    json=payload
                )

            elif method == "DELETE":

                response = await client.delete(url)

            else:

                response = await client.get(url)

            response.raise_for_status()

            context[f"http_res_{self.node_id}"] = response.json()

            return context

    async def compensate(self, context: Dict[str, Any]):

        rollback_url = self.data.get("rollback_url")

        if not rollback_url:

            print(
                f"[SAGA] No rollback URL configured for HTTP Node {self.node_id}"
            )

            return

        async with httpx.AsyncClient(timeout=5.0) as client:

            try:

                response = await client.post(rollback_url)

                response.raise_for_status()

                print(
                    f"[SAGA] HTTP compensation completed for Node {self.node_id}"
                )

            except Exception as e:

                print(
                    f"[SAGA] HTTP compensation failed: {e}"
                )