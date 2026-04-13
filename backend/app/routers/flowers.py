from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
import base64
from ..database import get_db
from ..models import User, Flower
from ..schemas import FlowerResponse
from ..jwt_handler import verify_token

router = APIRouter()


def _to_response(flower: Flower) -> dict:
    return {
        "id": flower.id,
        "name": flower.name,
        "foto_base64": base64.b64encode(flower.foto).decode() if flower.foto else None,
        "buy_price": flower.buy_price,
        "buy_date": flower.buy_date,
        "sell_price": flower.sell_price,
        "sell_date": flower.sell_date,
    }


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
    return [_to_response(f) for f in query.all()]
