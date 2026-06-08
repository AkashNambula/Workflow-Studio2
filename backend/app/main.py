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

app = FastAPI()

# 🟢 FIXED CORS ORIGINS: Explicitly allowing both localhost and 127.0.0.1 loopbacks
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(workflow_router)
app.include_router(run_router)
app.include_router(history_router)


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