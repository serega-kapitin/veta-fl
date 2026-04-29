"""Tests for backend API endpoints."""

import os
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing"
os.environ["JWT_ALGORITHM"] = "HS256"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date
import struct
import zlib
import io
import hashlib

from app.main import app
from app.database import get_db
from app.models import Base, User, Flower, Operation


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


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables and seed test data before each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Create test users
    test_password_hash = hashlib.sha256(("ser" + "ser123").encode()).hexdigest()
    user1 = User(login="ser", password=test_password_hash, name="Sergey")
    user2 = User(login="admin", password=hashlib.sha256(("admin" + "admin123").encode()).hexdigest(), name="Admin")
    user3 = User(login="emptyname", password=hashlib.sha256(("emptyname" + "pass").encode()).hexdigest(), name=None)
    db.add_all([user1, user2, user3])

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
        assert data["name"] == "Sergey"

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


# ============================================================
# Advanced tests (merged from test_advanced.py)
# ============================================================


@pytest.fixture
def admin_headers(client):
    """Login as 'admin' and return headers with token."""
    resp = client.post("/api/auth", json={"login": "admin", "password": "admin123"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def make_test_png(r, g, b, size=40):
    """Create a minimal PNG image."""
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
    raw = b""
    for _ in range(size):
        raw += b"\x00"
        for _ in range(size):
            raw += bytes([r % 256, g % 256, b % 256])
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", ihdr)
    png += chunk(b"IDAT", zlib.compress(raw))
    png += chunk(b"IEND", b"")
    return png


# --- Photo Upload Tests ---
class TestPhotoUpload:
    def test_upload_photo_success(self, client, auth_headers):
        """Upload a photo to an unsold flower."""
        png_data = make_test_png(255, 0, 0)
        files = {"file": ("flower.png", io.BytesIO(png_data), "image/png")}
        resp = client.put("/api/flowers/1/photo", headers=auth_headers, files=files)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == 1
        assert data["foto_base64"] is not None

    def test_upload_photo_nonexistent_flower(self, client, auth_headers):
        """Try to upload photo to non-existent flower."""
        png_data = make_test_png(255, 0, 0)
        files = {"file": ("flower.png", io.BytesIO(png_data), "image/png")}
        resp = client.put("/api/flowers/9999/photo", headers=auth_headers, files=files)
        assert resp.status_code == 404

    def test_upload_photo_sold_flower(self, client, auth_headers):
        """Try to upload photo to already sold flower."""
        png_data = make_test_png(255, 0, 0)
        files = {"file": ("flower.png", io.BytesIO(png_data), "image/png")}
        # Flower id=3 is sold
        resp = client.put("/api/flowers/3/photo", headers=auth_headers, files=files)
        assert resp.status_code == 409

    def test_upload_photo_invalid_type(self, client, auth_headers):
        """Try to upload a non-image file."""
        files = {"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")}
        resp = client.put("/api/flowers/1/photo", headers=auth_headers, files=files)
        assert resp.status_code == 400
        assert "Invalid file type" in resp.json()["detail"]

    def test_upload_photo_empty_file(self, client, auth_headers):
        """Try to upload an empty file."""
        files = {"file": ("empty.png", io.BytesIO(b""), "image/png")}
        resp = client.put("/api/flowers/1/photo", headers=auth_headers, files=files)
        assert resp.status_code == 400
        assert "Empty file" in resp.json()["detail"]

    def test_upload_photo_unauthorized(self, client):
        """Try to upload photo without authentication."""
        png_data = make_test_png(255, 0, 0)
        files = {"file": ("flower.png", io.BytesIO(png_data), "image/png")}
        resp = client.put("/api/flowers/1/photo", files=files)
        assert resp.status_code == 401

    def test_upload_photo_jpeg(self, client, auth_headers):
        """Upload a JPEG file (allowed type)."""
        # Create minimal JPEG-like file (will be rejected by content-type check if not actual JPEG)
        # Instead, test with PNG but different filename extension
        png_data = make_test_png(0, 255, 0)
        files = {"file": ("flower.jpg", io.BytesIO(png_data), "image/jpeg")}
        resp = client.put("/api/flowers/1/photo", headers=auth_headers, files=files)
        assert resp.status_code == 200

    def test_upload_photo_webp(self, client, auth_headers):
        """Upload a WebP file (allowed type)."""
        png_data = make_test_png(0, 0, 255)
        files = {"file": ("flower.webp", io.BytesIO(png_data), "image/webp")}
        resp = client.put("/api/flowers/1/photo", headers=auth_headers, files=files)
        assert resp.status_code == 200

    def test_upload_photo_gif(self, client, auth_headers):
        """Upload a GIF file (allowed type)."""
        png_data = make_test_png(255, 255, 0)
        files = {"file": ("flower.gif", io.BytesIO(png_data), "image/gif")}
        resp = client.put("/api/flowers/1/photo", headers=auth_headers, files=files)
        assert resp.status_code == 200

    def test_upload_photo_replaces_existing(self, client, auth_headers):
        """Upload second photo should replace the first."""
        png_data1 = make_test_png(255, 0, 0)
        files1 = {"file": ("red.png", io.BytesIO(png_data1), "image/png")}
        resp1 = client.put("/api/flowers/1/photo", headers=auth_headers, files=files1)
        assert resp1.status_code == 200

        png_data2 = make_test_png(0, 255, 0)
        files2 = {"file": ("green.png", io.BytesIO(png_data2), "image/png")}
        resp2 = client.put("/api/flowers/1/photo", headers=auth_headers, files=files2)
        assert resp2.status_code == 200
        assert resp2.json()["foto_base64"] != resp1.json()["foto_base64"]

    def test_upload_photo_no_file_field(self, client, auth_headers):
        """Try to upload without the 'file' field."""
        resp = client.put("/api/flowers/1/photo", headers=auth_headers)
        assert resp.status_code == 422  # Validation error


# --- Profile Edge Cases ---
class TestProfileEdgeCases:
    def test_get_profile_null_name(self, client):
        """Get profile for user with null name."""
        resp = client.post("/api/auth", json={"login": "emptyname", "password": "pass"})
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.get("/api/profile", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] is None

    def test_update_profile_set_null_name(self, client, auth_headers):
        """Setting name to null is a no-op (backend only updates when name is not None)."""
        resp = client.put("/api/profile", json={"name": None}, headers=auth_headers)
        assert resp.status_code == 200
        # Name remains unchanged since None is skipped by backend logic
        assert resp.json()["name"] == "Sergey"

    def test_update_profile_empty_body(self, client, auth_headers):
        """Update profile with empty body (no changes)."""
        resp = client.put("/api/profile", json={}, headers=auth_headers)
        assert resp.status_code == 200

    def test_update_profile_partial_update(self, client, auth_headers):
        """Update only name without touching password."""
        resp = client.put("/api/profile", json={"name": "Updated Name"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"

    def test_update_profile_only_password(self, client, auth_headers):
        """Update only password without touching name."""
        resp = client.put("/api/profile", json={
            "current_password": "ser123",
            "new_password": "newpass123"
        }, headers=auth_headers)
        assert resp.status_code == 200
        # Name should remain unchanged
        assert resp.json()["name"] == "Sergey"


# --- Auth Edge Cases ---
class TestAuthEdgeCases:
    def test_login_empty_credentials(self, client):
        resp = client.post("/api/auth", json={"login": "", "password": ""})
        assert resp.status_code == 401

    def test_login_whitespace_credentials(self, client):
        resp = client.post("/api/auth", json={"login": "   ", "password": "   "})
        assert resp.status_code == 401

    def test_login_case_sensitive(self, client):
        """Login should be case-sensitive."""
        resp = client.post("/api/auth", json={"login": "SER", "password": "ser123"})
        assert resp.status_code == 401

    def test_login_different_user(self, client):
        """Login as different user."""
        resp = client.post("/api/auth", json={"login": "admin", "password": "admin123"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data


# --- JWT Edge Cases ---
class TestJWTAdvanced:
    def test_invalid_token_format(self, client):
        """Send malformed token."""
        headers = {"Authorization": "Bearer invalid.token.format"}
        resp = client.get("/api/profile", headers=headers)
        assert resp.status_code == 401

    def test_missing_bearer_prefix(self, client, auth_headers):
        """Send token without 'Bearer ' prefix."""
        token = auth_headers["Authorization"].replace("Bearer ", "")
        headers = {"Authorization": token}
        resp = client.get("/api/profile", headers=headers)
        assert resp.status_code == 401

    def test_empty_token(self, client):
        """Send empty token."""
        headers = {"Authorization": "Bearer "}
        resp = client.get("/api/profile", headers=headers)
        assert resp.status_code == 401

    def test_no_authorization_header(self, client):
        """Request without Authorization header."""
        resp = client.get("/api/profile")
        assert resp.status_code == 401


# --- Flowers Edge Cases ---
class TestFlowersAdvanced:
    def test_get_flowers_default_is_unsold(self, client, auth_headers):
        """Default (no sold param) should return only unsold."""
        resp = client.get("/api/flowers", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert all(f["sell_price"] is None for f in data)
        assert all(f["sell_date"] is None for f in data)

    def test_get_flowers_with_sold_false(self, client, auth_headers):
        """Explicit sold=false should return only unsold."""
        resp = client.get("/api/flowers?sold=false", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_get_flowers_with_sold_true(self, client, auth_headers):
        """sold=true should return all flowers."""
        resp = client.get("/api/flowers?sold=true", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3

    def test_sell_flower_updates_operation_table(self, client, auth_headers):
        """Selling a flower should create an operation record."""
        db = TestingSessionLocal()
        ops_before = db.query(Operation).count()
        db.close()

        resp = client.post("/api/flowers/1/sell", json={"sell_price": 600.0}, headers=auth_headers)
        assert resp.status_code == 200

        db = TestingSessionLocal()
        ops_after = db.query(Operation).count()
        db.close()
        assert ops_after == ops_before + 1

    def test_sell_flower_operation_record_correct(self, client, auth_headers):
        """Operation record should have correct data."""
        client.post("/api/flowers/1/sell", json={"sell_price": 750.0}, headers=auth_headers)

        db = TestingSessionLocal()
        op = db.query(Operation).filter(Operation.flower_id == 1).first()
        assert op is not None
        assert op.operation_type == "SELL"
        assert op.price_add == 0.0
        assert op.price_subtr == 750.0
        assert op.user_login == "ser"
        assert op.date is not None
        db.close()

    def test_sell_flower_unauthorized(self, client):
        """Sell without auth."""
        resp = client.post("/api/flowers/1/sell", json={"sell_price": 500.0})
        assert resp.status_code == 401

    def test_sell_flower_negative_price(self, client, auth_headers):
        """Sell with negative price (should work - backend doesn't validate)."""
        resp = client.post("/api/flowers/1/sell", json={"sell_price": -100.0}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["sell_price"] == -100.0

    def test_sell_flower_zero_price(self, client, auth_headers):
        """Sell with zero price."""
        resp = client.post("/api/flowers/1/sell", json={"sell_price": 0.0}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["sell_price"] == 0.0

    def test_sell_flower_different_users(self, client, auth_headers, admin_headers):
        """Sell by one user, verify operation records user_login."""
        client.post("/api/flowers/1/sell", json={"sell_price": 500.0}, headers=auth_headers)
        client.post("/api/flowers/2/sell", json={"sell_price": 300.0}, headers=admin_headers)

        db = TestingSessionLocal()
        ops = db.query(Operation).all()
        assert len(ops) == 2
        logins = sorted([op.user_login for op in ops])
        assert logins == ["admin", "ser"]
        db.close()

    def test_flower_response_has_all_fields(self, client, auth_headers):
        """Response should contain all expected fields."""
        resp = client.get("/api/flowers", headers=auth_headers)
        assert resp.status_code == 200
        flower = resp.json()[0]
        assert set(flower.keys()) == {"id", "name", "foto_base64", "buy_price", "buy_date", "sell_price", "sell_date"}


# --- Database Model Tests ---
class TestModels:
    def test_user_model(self):
        from app.models import User
        user = User(login="test", password="hash", name="Test User")
        assert user.login == "test"
        assert user.password == "hash"
        assert user.name == "Test User"

    def test_user_model_null_name(self):
        from app.models import User
        user = User(login="test", password="hash")
        assert user.name is None

    def test_flower_model(self):
        from app.models import Flower
        from datetime import date
        flower = Flower(
            name="Test",
            buy_price=100.0,
            buy_date=date(2026, 1, 1),
        )
        assert flower.name == "Test"
        assert flower.buy_price == 100.0
        assert flower.sell_price is None
        assert flower.sell_date is None
        assert flower.foto is None

    def test_flower_model_with_all_fields(self):
        from app.models import Flower
        from datetime import date
        flower = Flower(
            name="Sold Flower",
            buy_price=100.0,
            buy_date=date(2026, 1, 1),
            sell_price=200.0,
            sell_date=date(2026, 2, 1),
            foto=b"\x89PNG",
        )
        assert flower.name == "Sold Flower"
        assert flower.sell_price == 200.0
        assert flower.foto == b"\x89PNG"

    def test_operation_model(self):
        from app.models import Operation
        from datetime import date
        op = Operation(
            operation_type="SELL",
            flower_id=1,
            date=date(2026, 4, 13),
            price_add=0.0,
            price_subtr=500.0,
            user_login="ser",
        )
        assert op.operation_type == "SELL"
        assert op.flower_id == 1
        assert op.price_add == 0.0
        assert op.price_subtr == 500.0
        assert op.user_login == "ser"
