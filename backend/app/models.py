from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "user"

    login = Column(String, primary_key=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Хранит SHA256 от login+password
    name = Column(String, nullable=True, default=None)