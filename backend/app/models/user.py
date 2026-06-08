from pydantic import BaseModel
from datetime import datetime


class User(BaseModel):
    name: str
    email: str
    password: str
    phone: str
    created_at: datetime = datetime.utcnow()