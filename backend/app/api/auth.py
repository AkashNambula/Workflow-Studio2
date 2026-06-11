from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from app.db.database import db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    JWT_SECRET,
    ALGORITHM
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt

router = APIRouter(tags=["Authentication"])
security_scheme = HTTPBearer()

# --- Pydantic Data Schemas ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    role: str = "Operator"

class ChangePasswordRequest(BaseModel):
    email: EmailStr
    old_password: str
    new_password: str


# --- Secure Global Token Decode Validation Dependency Helper ---
def get_current_user_claims(token: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:  
    """
    Decodes incoming authorization bearer headers using the crash-proof PyJWT setup.
    """
    try:
        payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Could not validate credentials structure access token matrix"
        )


# --- Public Auth Endpoints ---

@router.post("/login")
def login(data: LoginRequest):
    user = db.users.find_one({"email": data.email})

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    if not verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    token = create_access_token(subject=user["email"])

    # 🟢 DUAL-TOKEN RETURN MATRIX: Maps to both naming standards to sync frontend state
    return {
        "message": "Login successful",
        "token": token,            # Matches frontends using res.data.token
        "access_token": token,     # Matches frontends using res.data.access_token
        "token_type": "bearer",
        "name": user.get("name", "Admin User"),
        "email": user["email"],
        "phone": user.get("phone", ""),
        "role": user.get("role", "Admin")
    }


@router.post("/change-password")
def change_password(data: ChangePasswordRequest):
    """
    Updates a user's password securely in the database matrix loops.
    """
    user = db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User profile not found in database records."
        )

    if not verify_password(data.old_password, user["password"]):
        raise HTTPException(
            status_code=400,
            detail="Mismatched credentials: Old password is incorrect."
        )

    updated_password_hash = hash_password(data.new_password)
    db.users.update_one(
        {"email": data.email},
        {"$set": {"password": updated_password_hash}}
    )

    return {"message": "Password updated successfully!"}


# --- Admin Privileged RBAC Operations Matrix Endpoints ---

@router.post("/admin/create-user")
def admin_create_user(
    user: RegisterRequest, 
    token_payload: dict = Depends(get_current_user_claims)
):
    """
    Provision fresh operational user profiles inside the database collection cleanly.
    """
    user_identity = token_payload.get("sub", "")
    
    # Check database record of the logged-in user to verify role privileges
    current_admin = db.users.find_one({"email": user_identity})
    if not current_admin or current_admin.get("role", "") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Admin can provision profiles tracking organizational parameters."
        )
        
    if user.role.strip() == "Admin":
        raise HTTPException(
            status_code=400,
            detail="Security Fault: Multi-admin runtime initialization vector locked execution sequence."
        )

    existing_user = db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    user_data = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "phone": user.phone,
        "role": user.role
    }

    db.users.insert_one(user_data)
    return {"message": f"{user.role} user registered successfully by Admin privileges matrix"}


@router.get("/admin/users")
def admin_get_all_users(token_payload: dict = Depends(get_current_user_claims)):
    user_identity = token_payload.get("sub", "")
    current_admin = db.users.find_one({"email": user_identity})
    
    if not current_admin or current_admin.get("role", "") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Unauthorized access mapping sequence layer directory parameters."
        )
        
    users_cursor = db.users.find()
    users_list = []
    
    for u in users_cursor:
        users_list.append({
            "id": str(u["_id"]),
            "name": u.get("name", ""),
            "email": u["email"],
            "phone": u.get("phone", ""),
            "role": u.get("role", "Operator")
        })
        
    return users_list


@router.delete("/admin/user/{email}")
def admin_delete_user(email: str, token_payload: dict = Depends(get_current_user_claims)):
    user_identity = token_payload.get("sub", "")
    current_admin = db.users.find_one({"email": user_identity})
    
    if not current_admin or current_admin.get("role", "") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Unauthorized drop configuration control command sequence request vector."
        )
        
    target_user = db.users.find_one({"email": email})
    if not target_user:
        raise HTTPException(status_code=404, detail="Staff directory mapping profile reference not found")
        
    if target_user.get("role", "") == "Admin":
        raise HTTPException(status_code=400, detail="Cannot purge primary authorization node reference from DB matrix loops.")

    db.users.delete_one({"email": email})
    return {"message": f"Account profile trace matching target entity email user {email} dropped tracking execution layer completely."}