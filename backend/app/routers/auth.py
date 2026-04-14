from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import hashlib
from ..database import get_db
from ..models import User
from ..schemas import AuthRequest
from ..jwt_handler import create_access_token

router = APIRouter()


@router.post("/api/auth")
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
