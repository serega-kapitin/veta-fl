from sqlalchemy import Column, Integer, String, Float, Date, LargeBinary
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