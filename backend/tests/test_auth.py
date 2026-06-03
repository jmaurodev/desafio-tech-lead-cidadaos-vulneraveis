"""Auth flow tests: login, refresh, logout, token validation."""
import pytest
from fastapi.testclient import TestClient


def test_login_success(client: TestClient):
    resp = client.post("/auth/token", data={"username": "operador1", "password": "operador123"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password(client: TestClient):
    resp = client.post("/auth/token", data={"username": "operador1", "password": "wrong"})
    assert resp.status_code == 401


def test_login_unknown_user(client: TestClient):
    resp = client.post("/auth/token", data={"username": "ghost", "password": "x"})
    assert resp.status_code == 401


def test_refresh_token(client: TestClient):
    login = client.post("/auth/token", data={"username": "operador1", "password": "operador123"})
    refresh_token = login.json()["refresh_token"]

    resp = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    # Old refresh token must be rotated (blacklisted)
    replay = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert replay.status_code == 401


def test_logout_blacklists_refresh(client: TestClient):
    login = client.post("/auth/token", data={"username": "operador1", "password": "operador123"})
    tokens = login.json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    resp = client.post("/auth/logout", json={"refresh_token": tokens["refresh_token"]}, headers=headers)
    assert resp.status_code == 200

    replay = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert replay.status_code == 401


def test_expired_token_rejected(client: TestClient, expired_token: str):
    resp = client.get("/chamados", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401


def test_access_token_as_refresh_rejected(client: TestClient, operador_token: str):
    resp = client.post("/auth/refresh", json={"refresh_token": operador_token})
    assert resp.status_code == 401


def test_refresh_token_as_access_rejected(client: TestClient):
    from api.auth.jwt import create_token
    from datetime import timedelta

    refresh = create_token("u1", "operador", "refresh", timedelta(days=1))
    resp = client.get("/chamados", headers={"Authorization": f"Bearer {refresh}"})
    assert resp.status_code == 401
