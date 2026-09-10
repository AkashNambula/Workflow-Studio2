from typing import Literal

from fastapi import APIRouter, HTTPException, Depends, status, Body
from pydantic import BaseModel, EmailStr, Field, ConfigDict
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

class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Human-readable description of the request error.")


class MessageResponse(BaseModel):
    message: str = Field(..., description="Status message returned by the API.")
    model_config = ConfigDict(json_schema_extra={
        "example": {"message": "Login successful"}
    })


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address used to sign in.")
    password: str = Field(..., min_length=1, description="User password for the selected account.")
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "demo@example.com",
            "password": "ExamplePassword123!"
        }
    })


class LoginResponse(BaseModel):
    message: str = Field(..., description="Authentication status message.")
    token: str = Field(..., description="JWT access token issued for the authenticated user.")
    access_token: str = Field(..., description="Alias for the JWT access token to support frontend clients.")
    token_type: str = Field(default="bearer", description="Authentication scheme used for the token.")
    name: str = Field(..., description="Display name for the authenticated user.")
    email: EmailStr = Field(..., description="Authenticated user's email address.")
    phone: str = Field(default="", description="Authenticated user's phone number if available.")
    role: str = Field(..., description="User role assigned to the authenticated session.")
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "message": "Login successful",
            "token": "example.jwt.token",
            "access_token": "example.jwt.token",
            "token_type": "bearer",
            "name": "Demo User",
            "email": "demo@example.com",
            "phone": "+1-555-0100",
            "role": "Operator"
        }
    })


class RegisterRequest(BaseModel):
    name: str = Field(..., description="Full name for the user account.")
    email: EmailStr = Field(..., description="Email address for the new account.")
    password: str = Field(..., min_length=1, description="Initial password for the new account.")
    phone: str = Field(..., description="Phone number for the new user.")
    role: str = Field(default="Operator", description="Role assigned to the new account. Admin accounts are restricted in this endpoint.")
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Demo User",
            "email": "demo@example.com",
            "password": "ExamplePassword123!",
            "phone": "+1-555-0108",
            "role": "Operator"
        }
    })


class ChangePasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address of the account whose password is being changed.")
    old_password: str = Field(..., description="Current password for the account.")
    new_password: str = Field(..., description="New password to store for the account.")
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "demo@example.com",
            "old_password": "ExamplePassword123!",
            "new_password": "ExamplePassword456!"
        }
    })


class ResetPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address of the user whose password is being reset.")
    new_password: str = Field(..., description="Replacement password for the target user.")
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "demo@example.com",
            "new_password": "ExamplePassword456!"
        }
    })


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

@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Authenticate a user",
    description="Validate the supplied credentials and return a JWT token for authenticated access to protected API endpoints.",
    responses={
        200: {
            "description": "Authentication successful",
            "content": {"application/json": {"example": {
                "message": "Login successful",
                "token": "example.jwt.token",
                "access_token": "example.jwt.token",
                "token_type": "bearer",
                "name": "Demo User",
                "email": "demo@example.com",
                "phone": "+1-555-0100",
                "role": "Operator"
            }}}
        },
        401: {
            "model": ErrorResponse,
            "description": "Invalid email or password.",
            "content": {"application/json": {"example": {"detail": "Invalid Email or Password"}}},
        },
    },
)
def login(data: LoginRequest = Body(..., examples={"login": {"summary": "Demo login example", "value": {"email": "demo@example.com", "password": "ExamplePassword123!"}}})):

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

@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change the current account password",
    description="Update a user's password after validating the existing password.",
    responses={
        200: {"description": "Password updated successfully", "model": MessageResponse},
        400: {
            "model": ErrorResponse,
            "description": "The previous password did not match the stored password.",
            "content": {"application/json": {"example": {"detail": "Old password is incorrect"}}},
        },
        404: {
            "model": ErrorResponse,
            "description": "The target user account does not exist.",
            "content": {"application/json": {"example": {"detail": "User not found"}}},
        },
    },
)
def change_password(data: ChangePasswordRequest = Body(..., examples={"change_password": {"summary": "Password change example", "value": {"email": "demo@example.com", "old_password": "ExamplePassword123!", "new_password": "ExamplePassword456!"}}})):

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

@router.post(
    "/admin/create-user",
    response_model=MessageResponse,
    summary="Create a new non-admin user",
    description="Create a new Operator or Viewer user account. Only authenticated admins can use this endpoint.",
    responses={
        200: {"description": "User created successfully.", "model": MessageResponse},
        400: {
            "model": ErrorResponse,
            "description": "The supplied payload is invalid or the email already exists.",
            "content": {"application/json": {"example": {"detail": "Email already exists"}}},
        },
        403: {
            "model": ErrorResponse,
            "description": "The caller is not an Admin.",
            "content": {"application/json": {"example": {"detail": "Only Admin can create users."}}},
        },
        401: {
            "model": ErrorResponse,
            "description": "The supplied JWT token is missing or invalid.",
            "content": {"application/json": {"example": {"detail": "Could not validate credentials"}}},
        },
    },
)
def admin_create_user(
    user: RegisterRequest = Body(..., examples={"create_user": {"summary": "Create operator account", "value": {"name": "Demo User", "email": "demo@example.com", "password": "ExamplePassword123!", "phone": "+1-555-0108", "role": "Operator"}}}),
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