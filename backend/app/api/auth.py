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


# ---------- Pydantic Models ----------

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


# ✅ NEW
class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


# ---------- JWT Helper ----------
def get_current_user_claims(
    token: HTTPAuthorizationCredentials = Depends(security_scheme)
):

    print("TOKEN =", token.credentials)

    try:
        payload = jwt.decode(
            token.credentials,
            JWT_SECRET,
            algorithms=[ALGORITHM]
        )

        print("PAYLOAD =", payload)
        return payload

    except Exception as e:
        print("JWT ERROR =", repr(e))

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


# ---------- Login ----------

@router.post("/login")
def login(data: LoginRequest):

    user = db.users.find_one({"email": data.email})

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    if not verify_password(
        data.password,
        user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    token = create_access_token(subject=user["email"])

    return {
        "message": "Login successful",
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "name": user.get("name", "Admin User"),
        "email": user["email"],
        "phone": user.get("phone", ""),
        "role": user.get("role", "Admin")
    }


# ---------- Change Own Password ----------

@router.post("/change-password")
def change_password(data: ChangePasswordRequest):

    user = db.users.find_one({"email": data.email})

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(
        data.old_password,
        user["password"]
    ):
        raise HTTPException(
            status_code=400,
            detail="Old password is incorrect"
        )

    db.users.update_one(
        {"email": data.email},
        {
            "$set": {
                "password": hash_password(data.new_password)
            }
        }
    )

    return {
        "message": "Password updated successfully"
    }


# ---------- Admin Create User ----------

@router.post("/admin/create-user")
def admin_create_user(
    user: RegisterRequest,
    token_payload: dict = Depends(get_current_user_claims)
):

    user_identity = token_payload.get("sub", "")

    current_admin = db.users.find_one(
        {
            "email": user_identity
        }
    )

    if (
        not current_admin or
        current_admin.get("role") != "Admin"
    ):
        raise HTTPException(
            status_code=403,
            detail="Only Admin can create users."
        )

    if user.role == "Admin":
        raise HTTPException(
            status_code=400,
            detail="Cannot create another Admin."
        )

    existing = db.users.find_one(
        {
            "email": user.email
        }
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    db.users.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "phone": user.phone,
        "role": user.role
    })

    return {
        "message": "User created successfully"
    }


# ---------- Admin Get Users ----------

@router.get("/admin/users")
def admin_get_all_users(
    token_payload: dict = Depends(get_current_user_claims)
):

    user_identity = token_payload.get("sub", "")

    current_admin = db.users.find_one(
        {
            "email": user_identity
        }
    )

    if (
        not current_admin or
        current_admin.get("role") != "Admin"
    ):
        raise HTTPException(
            status_code=403,
            detail="Only Admin can access users."
        )

    users = []

    for u in db.users.find():

        users.append({
            "id": str(u["_id"]),
            "name": u.get("name", ""),
            "email": u.get("email", ""),
            "phone": u.get("phone", ""),
            "role": u.get("role", "Operator")
        })

    return users


# ---------- Admin Delete User ----------

@router.delete("/admin/user/{email}")
def admin_delete_user(
    email: str,
    token_payload: dict = Depends(get_current_user_claims)
):

    user_identity = token_payload.get("sub", "")

    current_admin = db.users.find_one(
        {
            "email": user_identity
        }
    )

    if (
        not current_admin or
        current_admin.get("role") != "Admin"
    ):
        raise HTTPException(
            status_code=403,
            detail="Only Admin can delete users."
        )

    target = db.users.find_one(
        {
            "email": email
        }
    )

    if not target:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if target.get("role") == "Admin":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete Admin."
        )

    db.users.delete_one(
        {
            "email": email
        }
    )

    return {
        "message": "User deleted successfully"
    }


# ====================================================
# ✅ NEW ADMIN RESET PASSWORD API
# ====================================================

@router.put("/admin/reset-password")
def admin_reset_password(
    data: ResetPasswordRequest,
    token_payload: dict = Depends(get_current_user_claims)
):

    user_identity = token_payload.get("sub", "")

    current_admin = db.users.find_one(
        {
            "email": user_identity
        }
    )

    if (
        not current_admin or
        current_admin.get("role") != "Admin"
    ):
        raise HTTPException(
            status_code=403,
            detail="Only Admin can reset passwords."
        )

    target_user = db.users.find_one(
        {
            "email": data.email
        }
    )

    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    db.users.update_one(
        {
            "email": data.email
        },
        {
            "$set": {
                "password": hash_password(data.new_password)
            }
        }
    )

    return {
        "message": "Password reset successfully."
    }