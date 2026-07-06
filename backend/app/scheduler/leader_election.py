from app.core.cache import redis_client

LEADER_KEY = "scheduler_leader"
FENCING_TOKEN_KEY = "leader_fencing_token"


async def become_leader():
    """
    Try to become the leader.
    Returns True if this instance becomes leader.
    """

    result = await redis_client.set(
        LEADER_KEY,
        "leader",
        ex=10,
        nx=True
    )

    return result is True


async def renew_leader():
    """
    Renew the leader lease.
    """

    exists = await redis_client.exists(LEADER_KEY)

    if exists:
        await redis_client.expire(
            LEADER_KEY,
            10
        )


async def is_leader():
    """
    Check whether a leader already exists.
    """

    value = await redis_client.get(LEADER_KEY)

    return value is not None


async def resign_leader():
    """
    Remove leader lock.
    """

    await redis_client.delete(LEADER_KEY)
    
async def get_fencing_token():
    """
    Generate a new fencing token.
    """

    token = await redis_client.incr(
        FENCING_TOKEN_KEY
    )

    return token