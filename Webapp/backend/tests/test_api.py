import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path to allow importing main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}

def test_admin_standards():
    # Because we excluded securing the admin endpoints in this refactor,
    # we can test reading standards without authentication!
    response = client.get("/standards")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_missing_auth():
    # Ensure protected endpoints still enforce authentication
    response = client.get("/users/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"
