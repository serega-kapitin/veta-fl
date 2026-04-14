from sqlalchemy import Column, Integer, String, Float, Date, LargeBinary, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "user"

    login = Column(String, primary_key=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Хранит SHA256 от login+password
    name = Column(String, nullable=True, default=None)


class Flower(Base):
    __tablename__ = "flower"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    foto = Column(LargeBinary, nullable=True)
    buy_price = Column(Float, nullable=True)
    buy_date = Column(Date, nullable=True)
    sell_price = Column(Float, nullable=True)
    sell_date = Column(Date, nullable=True)


class Operation(Base):
    __tablename__ = "operation"

    id = Column(Integer, primary_key=True, autoincrement=True)
    operation_type = Column(String, nullable=False)  # 'SELL', 'BUY', etc.
    flower_id = Column(Integer, ForeignKey("flower.id"), nullable=False)
    date = Column(Date, nullable=False)
    price_add = Column(Float, nullable=True)
    price_subtr = Column(Float, nullable=True)
    user_login = Column(String, ForeignKey("user.login"), nullable=False)