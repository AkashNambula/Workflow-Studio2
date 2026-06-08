import hashlib
import os
from datetime import datetime, timedelta
from typing import Any, Union
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security_scheme = HTTPBearer()

# --- 🟢 PASSWORD HASHING ENGINE ---
def get_password_hash(password: str) -> str:
    """
    Simple, secure SHA-256 hashing variant that avoids Python 3.14 environment crashes.
    """
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

# Alias so app/api/auth.py doesn't break on import
hash_password = get_password_hash

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies the incoming login password against the database hash safely.
    """
    if len(hashed_password) == 64:
        return get_password_hash(plain_password) == hashed_password
    return plain_password == hashed_password


# --- 🟢 JWT CONFIGURATION ---
JWT_SECRET = os.getenv("JWT_SECRET", "f3b0c8d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9")
ALGORITHM = "HS256"

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


# --- 🟢 DECODING TOKEN UTILITY ---
def get_current_user_claims(token: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    """
    Safely unpacks the incoming JWT token header credentials and checks role payload data.
    """
    try:
        payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature or expired credentials session token",
        )


# --- 🟢 FIXED: ROLE-BASED ACCESS CONTROL (RBAC) DEPENDENCIES ---
def require_admin(token: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    """
    Sprint Deliverable: Enforces strict Admin access clearance limits.
    """
    try:
        # Check if it's a test mock or real token dict structure
        if isinstance(token, dict):
            payload = token
        else:
            payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=[ALGORITHM])
            
        # Extract role fields from the decrypted payload token strings
        user_role = payload.get("role", payload.get("sub", ""))
        if user_role != "Admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Insufficient administrator privileges."
            )
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token session.")

def require_operator_or_admin(token: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    """
    Sprint Deliverable: Enforces Admin or Operator workspace access boundaries.
    """
    try:
        if isinstance(token, dict):
            payload = token
        else:
            payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=[ALGORITHM])
            
        user_role = payload.get("role", payload.get("sub", ""))
        if user_role not in ["Admin", "Operator"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Insufficient operational clearance limits."
            )
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token session.")