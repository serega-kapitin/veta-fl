from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
import hashlib
from .database import get_db
from .models import User, Flower
from .schemas import AuthRequest, FlowerResponse
from .jwt_handler import create_access_token, verify_token
from datetime import timedelta
from typing import List
from pydantic import BaseModel

app = FastAPI()


class ProfileResponse(BaseModel):
    login: str
    name: str | None = None


class ProfileUpdate(BaseModel):
    name: str | None = None
    current_password: str | None = None
    new_password: str | None = None


@app.post("/api/auth")
def authenticate(auth_data: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == auth_data.login).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login or password")

    combined = auth_data.login + auth_data.password
    hash_value = hashlib.sha256(combined.encode()).hexdigest()
    if user.password != hash_value:
        raise HTTPException(status_code=401, detail="Invalid login or password")

    access_token = create_access_token(data={"sub": user.login})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/profile")
def get_profile(current_user: User = Depends(verify_token)):
    return ProfileResponse(login=current_user.login, name=current_user.name)


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


@app.get("/api/flowers", response_model=List[FlowerResponse])
def get_flowers(
    sold: bool = Query(False, description="Filter sold/unsold flowers"),
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
):
    query = db.query(Flower)
    if sold is False:
        query = query.filter(and_(Flower.sell_price.is_(None), Flower.sell_date.is_(None)))
    elif sold is True:
        query = query.filter(and_(Flower.sell_price.isnot(None), Flower.sell_date.isnot(None)))
    return query.all()
