from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseNode(ABC):
    """
    Base class for all workflow nodes.
    Every node must implement execute() and compensate().
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
        pass

    @abstractmethod
    async def compensate(self, context: Dict[str, Any]) -> None:
        """
        Undo the work performed by execute().
        """
        pass