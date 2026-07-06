from app.core.cache import redis_client

IDEMPOTENCY_PREFIX = "idempotency:"


async def acquire_lock(
    key: str,
    ttl: int = 300
) -> bool:

    result = await redis_client.set(
        f"{IDEMPOTENCY_PREFIX}{key}",
        "LOCKED",
        ex=ttl,
        nx=True
    )

    return result is True


async def release_lock(
    key: str
):

    await redis_client.delete(
        f"{IDEMPOTENCY_PREFIX}{key}"
    )


async def is_duplicate(
    key: str
) -> bool:

    value = await redis_client.get(
        f"{IDEMPOTENCY_PREFIX}{key}"
    )

    return value is not None