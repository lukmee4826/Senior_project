from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest
import sys
import os

# Add parent directory to path to import main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, get_db
from database import Base

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}

def test_get_user_me_creates_default():
    # Test that getting /users/me creates the demo user if not exists
    response = client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "demo@example.com"
    assert data["full_name"] == "Demo User"

def test_update_user_me():
    # Update user profile
    updates = {
        "full_name": "Updated Name",
        "institution": "Updated Hospital"
    }
    response = client.put("/users/me", json=updates)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["institution"] == "Updated Hospital"

    # Verify persistence
    response = client.get("/users/me")
    assert response.json()["full_name"] == "Updated Name"

def test_read_batches_empty():
    response = client.get("/batches")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
