from pydantic import BaseModel
from datetime import date
from typing import Optional


class AuthRequest(BaseModel):
    login: str
    password: str


class FlowerResponse(BaseModel):
    id: int
    name: str
    buy_price: Optional[float] = None
    buy_date: Optional[date] = None
    sell_price: Optional[float] = None
    sell_date: Optional[date] = None
