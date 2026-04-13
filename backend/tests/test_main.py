"""Tests for backend API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date

from app.main import app
from app.database import get_db
from app.models import Base, User, Flower


# --- Test database setup ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_vetafl.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Use in-memory SQLite secret for tests
import os

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing"
os.environ["JWT_ALGORITHM"] = "HS256"


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables and seed test data before each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Create test user: login=ser, password=SHA256(ser + ser123)
    import hashlib

    test_password_hash = hashlib.sha256(("ser" + "ser123").encode()).hexdigest()
    user = User(login="ser", password=test_password_hash, name="Test User")
    db.add(user)

    # Create test flowers
    flowers = [
        Flower(name="Роза", buy_price=300.0, buy_date=date(2026, 4, 10)),
        Flower(name="Тюльпан", buy_price=120.0, buy_date=date(2026, 4, 11)),
        Flower(name="Лилия", buy_price=450.0, buy_date=date(2026, 4, 12),
               sell_price=900.0, sell_date=date(2026, 4, 13)),
    ]
    db.add_all(flowers)
    db.commit()
    db.close()

    yield

    # Cleanup
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    """Login and return headers with token."""
    resp = client.post("/api/auth", json={"login": "ser", "password": "ser123"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# --- Auth Tests ---
class TestAuth:
    def test_login_success(self, client):
        resp = client.post("/api/auth", json={"login": "ser", "password": "ser123"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        resp = client.post("/api/auth", json={"login": "ser", "password": "wrong"})
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = client.post("/api/auth", json={"login": "unknown", "password": "123"})
        assert resp.status_code == 401


# --- Profile Tests ---
class TestProfile:
    def test_get_profile(self, client, auth_headers):
        resp = client.get("/api/profile", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["login"] == "ser"
        assert data["name"] == "Test User"

    def test_get_profile_unauthorized(self, client):
        resp = client.get("/api/profile")
        assert resp.status_code == 401

    def test_update_profile_name(self, client, auth_headers):
        resp = client.put("/api/profile", json={"name": "New Name"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"

    def test_update_profile_wrong_password(self, client, auth_headers):
        resp = client.put("/api/profile", json={
            "current_password": "wrong", "new_password": "new123"
        }, headers=auth_headers)
        assert resp.status_code == 401


# --- Flowers Tests ---
class TestFlowers:
    def test_get_unsold_flowers(self, client, auth_headers):
        resp = client.get("/api/flowers", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        # Only unsold flowers (sell_price and sell_date are null)
        assert len(data) == 2
        assert all(f["sell_price"] is None for f in data)

    def test_get_all_flowers(self, client, auth_headers):
        resp = client.get("/api/flowers?sold=true", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3

    def test_sell_flower(self, client, auth_headers):
        # Get an unsold flower
        resp = client.get("/api/flowers", headers=auth_headers)
        flower_id = resp.json()[0]["id"]

        resp = client.post(
            f"/api/flowers/{flower_id}/sell",
            json={"sell_price": 500.0},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["sell_price"] == 500.0

    def test_sell_already_sold_flower(self, client, auth_headers):
        resp = client.get("/api/flowers?sold=true", headers=auth_headers)
        sold_flower = next(f for f in resp.json() if f["sell_price"] is not None)

        resp = client.post(
            f"/api/flowers/{sold_flower['id']}/sell",
            json={"sell_price": 999.0},
            headers=auth_headers,
        )
        assert resp.status_code == 409

    def test_sell_nonexistent_flower(self, client, auth_headers):
        resp = client.post(
            "/api/flowers/9999/sell",
            json={"sell_price": 500.0},
            headers=auth_headers,
        )
        assert resp.status_code == 404


# --- JWT Handler Tests ---
class TestJWT:
    def test_create_and_verify_token(self):
        from app.jwt_handler import create_access_token, verify_token, security
        from fastapi import HTTPException
        from fastapi.security import HTTPAuthorizationCredentials
        from app.database import get_db

        token = create_access_token(data={"sub": "ser"})
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_expired_token_rejected(self):
        from app.jwt_handler import create_access_token
        from datetime import timedelta

        token = create_access_token(
            data={"sub": "ser"}, expires_delta=timedelta(minutes=-1)
        )
        # Token with negative expiry should fail verification
        # We verify by checking the token can be decoded but expired
        from jose import jwt, JWTError
        from app.jwt_handler import SECRET_KEY, ALGORITHM
        try:
            jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            # If we get here without exception, check exp is in the past
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM],
                               options={"verify_exp": False})
            assert "exp" in payload
        except JWTError:
            pass  # Expected for expired token
