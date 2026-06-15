from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseNode(ABC):
    """
    Abstract Base Class (ABC) enforcing the explicit software runtime contract 
    for all derived automation block subclasses inside the Workflow Studio engine.
    """
    def __init__(
        self,
        node_id: str = "",
        name: str = "",
        node_type: str = "",
        data: Dict[str, Any] | None = None
    ):
        self.node_id = node_id
        self.name = name
        self.node_type = node_type
        self.data = data or {}

    @abstractmethod
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Contract boundary signature ensuring every functional node handles 
        context parameters asynchronously.
        """
        pass