from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import hashlib
from pydantic import BaseModel
from ..database import get_db
from ..models import User
from ..jwt_handler import verify_token

router = APIRouter()


class ProfileResponse(BaseModel):
    login: str
    name: str | None = None


class ProfileUpdate(BaseModel):
    name: str | None = None
    current_password: str | None = None
    new_password: str | None = None


@router.get("/api/profile")
def get_profile(current_user: User = Depends(verify_token)):
    return ProfileResponse(login=current_user.login, name=current_user.name)


@router.put("/api/profile")
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
):
    if data.name is not None:
        current_user.name = data.name

    if data.current_password and data.new_password:
        combined = current_user.login + data.current_password
        hash_value = hashlib.sha256(combined.encode()).hexdigest()
        if current_user.password != hash_value:
            raise HTTPException(status_code=401, detail="Invalid current password")
        new_hash = hashlib.sha256(
            (current_user.login + data.new_password).encode()
        ).hexdigest()
        current_user.password = new_hash

    db.commit()
    db.refresh(current_user)
    return ProfileResponse(login=current_user.login, name=current_user.name)
