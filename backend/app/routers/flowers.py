from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from ..database import get_db
from ..models import User, Flower
from ..schemas import FlowerResponse
from ..jwt_handler import verify_token

router = APIRouter()


@router.get("/api/flowers", response_model=List[FlowerResponse])
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
