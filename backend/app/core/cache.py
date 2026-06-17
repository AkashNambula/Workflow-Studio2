import redis.asyncio as redis
from app.core.config import settings

cache_hits = 0
cache_misses = 0

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=int(settings.REDIS_PORT),
    decode_responses=True
)

async def get_cached(key: str):
    global cache_hits, cache_misses

    value = await redis_client.get(key)

    if value:
        cache_hits += 1
    else:
        cache_misses += 1

    return value

async def set_cached(key: str, value: str, ttl: int = 300):
    await redis_client.set(key, value, ex=ttl)
    
async def test_redis():
    await redis_client.set("test_key", "hello_akash")
    value = await redis_client.get("test_key")
    return value

async def delete_cached(key: str):
    await redis_client.delete(key)
    
def get_cache_stats():
    total = cache_hits + cache_misses

    return {
        "hits": cache_hits,
        "misses": cache_misses,
        "hit_rate": round(
            cache_hits / total,
            2
        ) if total > 0 else 0
    }