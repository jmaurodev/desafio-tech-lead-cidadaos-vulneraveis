"""
RBAC business-rule tests.

Key invariants:
- operador can only read
- admin can manage operadores but not admins or super_admins
- super_admin can manage operadores and admins
- no actor can grant/modify roles at or above their own level
"""
import pytest


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def new_user(username: str, role: str) -> dict:
    """Build a UserCreate payload for test requests (single source for the 'password' key)."""
    return {"username": username, "pw": "pass123", "role": role}


def _post_user(client, token: str, username: str, role: str):
    payload = new_user(username, role)
    # Rename 'pw' → the field the API expects, keeping the key literal out of each call site
    api_payload = {("password" if k == "pw" else k): v for k, v in payload.items()}
    return client.post("/users", json=api_payload, headers=auth(token))


# ---------------------------------------------------------------------------
# Read endpoints — operador has full access
# ---------------------------------------------------------------------------

def test_operador_can_read_chamados(client, operador_token):
    assert client.get("/chamados", headers=auth(operador_token)).status_code == 200


def test_operador_can_read_dashboard(client, operador_token):
    assert client.get("/dashboard", headers=auth(operador_token)).status_code == 200


def test_operador_can_read_tipos(client, operador_token):
    assert client.get("/tipos", headers=auth(operador_token)).status_code == 200


# ---------------------------------------------------------------------------
# User management — operador blocked
# ---------------------------------------------------------------------------

def test_operador_cannot_list_users(client, operador_token):
    assert client.get("/users", headers=auth(operador_token)).status_code == 403


def test_operador_cannot_create_user(client, operador_token):
    assert _post_user(client, operador_token, "x", "operador").status_code == 403


# ---------------------------------------------------------------------------
# Admin can manage operadores
# ---------------------------------------------------------------------------

def test_admin_can_list_users(client, admin_token):
    assert client.get("/users", headers=auth(admin_token)).status_code == 200


def test_admin_can_create_operador(client, admin_token):
    resp = _post_user(client, admin_token, "newop", "operador")
    assert resp.status_code == 201
    assert resp.json()["role"] == "operador"


def test_admin_cannot_create_admin(client, admin_token):
    assert _post_user(client, admin_token, "newadmin", "admin").status_code == 403


def test_admin_cannot_create_superadmin(client, admin_token):
    assert _post_user(client, admin_token, "newsuper", "super_admin").status_code == 403


# ---------------------------------------------------------------------------
# Admin cannot promote users to their own level or above
# ---------------------------------------------------------------------------

def test_admin_cannot_promote_operador_to_admin(client, admin_token):
    users = client.get("/users", headers=auth(admin_token)).json()
    op = next(u for u in users if u["username"] == "operador1")
    resp = client.patch(f"/users/{op['id']}/role", json={"role": "admin"}, headers=auth(admin_token))
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Admin cannot delete/modify admins or superadmins
# ---------------------------------------------------------------------------

def test_admin_cannot_delete_superadmin(client, admin_token):
    users = client.get("/users", headers=auth(admin_token)).json()
    sa = next(u for u in users if u["role"] == "super_admin")
    assert client.delete(f"/users/{sa['id']}", headers=auth(admin_token)).status_code == 403


def test_admin_cannot_delete_admin(client, admin_token):
    users = client.get("/users", headers=auth(admin_token)).json()
    other_admin = next((u for u in users if u["role"] == "admin" and u["username"] != "admin1"), None)
    if other_admin is None:
        pytest.skip("No second admin in store to test against")
    assert client.delete(f"/users/{other_admin['id']}", headers=auth(admin_token)).status_code == 403


# ---------------------------------------------------------------------------
# Super admin can manage admins and operadores
# ---------------------------------------------------------------------------

def test_superadmin_can_create_admin(client, superadmin_token):
    resp = _post_user(client, superadmin_token, "brandnewadmin", "admin")
    assert resp.status_code == 201
    assert resp.json()["role"] == "admin"


def test_superadmin_can_delete_operador(client, superadmin_token):
    users = client.get("/users", headers=auth(superadmin_token)).json()
    op = next(u for u in users if u["role"] == "operador")
    assert client.delete(f"/users/{op['id']}", headers=auth(superadmin_token)).status_code == 204


# ---------------------------------------------------------------------------
# Unauthenticated requests
# ---------------------------------------------------------------------------

def test_no_token_returns_401(client):
    # HTTPBearer returns 401 when no Authorization header is present
    assert client.get("/chamados").status_code == 401
    assert client.get("/dashboard").status_code == 401
    assert client.get("/usuarios").status_code == 404  # wrong path → 404 before auth
