from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
import base64
from datetime import date
from ..database import get_db
from ..models import User, Flower, Operation
from ..schemas import FlowerResponse, SellRequest
from ..jwt_handler import verify_token

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}


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
    sold: bool = Query(False, description="Include sold flowers in results"),
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
):
    query = db.query(Flower)
    # sold=False (default): only unsold flowers
    # sold=True: all flowers (sold + unsold)
    if sold is False:
        query = query.filter(and_(Flower.sell_price.is_(None), Flower.sell_date.is_(None)))
    # sold=True: no filter — return all
    return [_to_response(f) for f in query.all()]


@router.post("/api/flowers/{flower_id}/sell")
def sell_flower(
    flower_id: int,
    data: SellRequest,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
):
    # 1. Check flower exists
    flower = db.query(Flower).filter(Flower.id == flower_id).first()
    if not flower:
        raise HTTPException(status_code=404, detail="Flower not found")

    # 2. Check flower is not already sold
    if flower.sell_price is not None or flower.sell_date is not None:
        raise HTTPException(status_code=409, detail="Flower is already sold")

    # 3. Update flower with sell info
    flower.sell_price = data.sell_price
    flower.sell_date = date.today()

    # 4. Create operation record
    operation = Operation(
        operation_type="SELL",
        flower_id=flower_id,
        date=date.today(),
        price_add=0.0,
        price_subtr=data.sell_price,
        user_login=current_user.login,
    )
    db.add(operation)
    db.commit()
    db.refresh(flower)

    return _to_response(flower)


@router.put("/api/flowers/{flower_id}/photo")
async def update_flower_photo(
    flower_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
):
    # 1. Check flower exists
    flower = db.query(Flower).filter(Flower.id == flower_id).first()
    if not flower:
        raise HTTPException(status_code=404, detail="Flower not found")

    # 2. Check flower is not already sold
    if flower.sell_price is not None or flower.sell_date is not None:
        raise HTTPException(status_code=409, detail="Cannot update photo of a sold flower")

    # 3. Validate file is an image
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(sorted(ALLOWED_IMAGE_TYPES))}",
        )

    # 4. Read and store photo
    photo_data = await file.read()
    if not photo_data:
        raise HTTPException(status_code=400, detail="Empty file")

    # Limit to 20MB
    if len(photo_data) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    flower.foto = photo_data
    db.commit()
    db.refresh(flower)

    return _to_response(flower)


@router.post("/api/flowers/buy")
def buy_flower(
    name: str = Form(...),
    buy_price: float = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """
    Buy a new flower.
    - name: required
    - buy_price: required
    - file: optional image (jpeg, png, webp, gif, bmp) max 20MB
    """
    # Validate name
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Flower name is required")
    name = name.strip()

    # Validate buy_price
    if buy_price < 0:
        raise HTTPException(status_code=400, detail="Buy price must be non-negative")

    # Process optional file
    foto_data = None
    if file is not None:
        # Validate file type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(sorted(ALLOWED_IMAGE_TYPES))}",
            )
        # Read file
        foto_data = file.file.read()
        if not foto_data:
            raise HTTPException(status_code=400, detail="Empty file")
        # Limit size
        if len(foto_data) > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    # Create flower record
    flower = Flower(
        name=name,
        buy_price=buy_price,
        buy_date=date.today(),
        foto=foto_data,
    )
    db.add(flower)
    db.commit()
    db.refresh(flower)

    # Create operation record for BUY
    operation = Operation(
        operation_type="BUY",
        flower_id=flower.id,
        date=date.today(),
        price_add=buy_price,
        price_subtr=0.0,
        user_login=current_user.login,
    )
    db.add(operation)
    db.commit()

    return _to_response(flower)
