from pydantic import BaseModel, field_serializer
from datetime import date
from typing import Optional
import base64


class AuthRequest(BaseModel):
    login: str
    password: str


class FlowerResponse(BaseModel):
    id: int
    name: str
    foto_base64: Optional[str] = None
    buy_price: Optional[float] = None
    buy_date: Optional[date] = None
    sell_price: Optional[float] = None
    sell_date: Optional[date] = None

    @field_serializer('foto_base64')
    def serialize_foto(self, v: Optional[str], _info) -> Optional[str]:
        return v


class SellRequest(BaseModel):
    sell_price: float
