from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import hashlib
from .database import get_db
from .models import User
from .schemas import AuthRequest
from .jwt_handler import create_access_token, verify_token
from datetime import timedelta
from pydantic import BaseModel

app = FastAPI()


class ProfileResponse(BaseModel):
    login: str
    name: str | None = None


@app.post("/api/auth")
def authenticate(auth_data: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == auth_data.login).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login or password")

    # Проверка пароля (как ранее)
    combined = auth_data.login + auth_data.password
    hash_value = hashlib.sha256(combined.encode()).hexdigest()
    if user.password != hash_value:
        raise HTTPException(status_code=401, detail="Invalid login or password")

    # Создаем токен
    access_token = create_access_token(data={"sub": user.login})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/profile")
def get_profile(current_user: User = Depends(verify_token)):
    return ProfileResponse(login=current_user.login, name=current_user.name)


class ProfileUpdate(BaseModel):
    name: str | None = None
    current_password: str | None = None
    new_password: str | None = None


@app.put("/api/profile")
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