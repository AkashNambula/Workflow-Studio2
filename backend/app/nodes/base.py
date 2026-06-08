from abc import ABC, abstractmethod
from typing import Any, Dict, List

class BaseNode(ABC):
    """
    Abstract Base Class enforcing rigid standard signatures across all NodeExecutors.
    """
    @abstractmethod
    def execute(self, *args: Any, **kwargs: Any) -> Any:
        """
        Enforce subclass execution paradigm.
        """
        pass