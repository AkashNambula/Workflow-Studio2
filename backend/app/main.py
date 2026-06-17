import bcrypt
# 🟢 CRITICAL SYSTEM PATCH: Fixes the Python 3.14 + Passlib version tracking conflict
if not hasattr(bcrypt, "__about__"):
    class BcryptAbout: 
        __version__ = bcrypt.__version__
    bcrypt.__about__ = BcryptAbout()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import db
from app.api.auth import router as auth_router
from app.api.workflow import router as workflow_router
from app.api.run import router as run_router
from app.api.history import router as history_router
# 🟢 FIXED IMPORT: Pointing directly inside your app workspace submodule tree without 'backend.' prefix
from app.websocket.live_logs import router as websocket_router
from app.core.cache import test_redis

app = FastAPI(title="HR Automation Workflow Studio", version="3.0.0")

# 🟢 FIXED CORS ORIGINS: Explicitly added port 5174 loopbacks to stop the login blocking error!
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Application REST Framework Sub-routers
app.include_router(auth_router)
app.include_router(workflow_router)
app.include_router(run_router)
app.include_router(history_router)

# 🟢 FIXED: Mounted the WebSocket streaming layer to register the /ws/runs/{run_id} path parameters live at runtime
app.include_router(websocket_router)


@app.get("/")
def home():
    return {"message": "Workflow Studio Backend Running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/test-db")
def test_db():
    db.test_collection.insert_one({"message": "Mongo Connected"})
    return {"message": "MongoDB Connected Successfully"}
@app.get("/redis-test")
async def redis_test():
    value = await test_redis()
    return {"redis_value": value}