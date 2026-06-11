import asyncio
import functools
import logging
from typing import Any, Callable

logger = logging.getLogger("uvicorn.error")

def retryable(max_attempts: int = 3, base_delay: float = 1.0) -> Callable:
    """
    Decorator executing exponential backoff sequence (delay = base_delay * 2^attempt)
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            attempt = 0
            delay = base_delay
            while attempt < max_attempts:
                try:
                    if asyncio.iscoroutinefunction(func):
                        return await func(*args, **kwargs)
                    return func(*args, **kwargs)
                except Exception as e:
                    attempt += 1
                    logger.warning(f"⚠️ Retrying target action. Attempt {attempt}/{max_attempts} triggered. Error: {str(e)}")
                    if attempt >= max_attempts:
                        logger.error("❌ Execution threshold exhausted. Terminating retry attempts wrapper loop.")
                        raise e
                    # Exponential Backoff Calculation: delay * (2 ^ (attempt - 1))
                    current_backoff = delay * (2 ** (attempt - 1))
                    await asyncio.sleep(current_backoff)
        return wrapper
    return decorator