"""
Mock identity provider: in-memory user store + refresh token blacklist.
Replaces a real Keycloak/Auth0 in local dev and tests.
"""
import uuid

import bcrypt


def _hash(password: str) -> bytes:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())


def _verify(password: str, hashed: bytes) -> bool:
    return bcrypt.checkpw(password.encode(), hashed)


# Seed users. Passwords are intentionally weak (dev-only).
_USERS: dict[str, dict] = {
    "operador1": {
        "id": "u1",
        "username": "operador1",
        "hashed_password": _hash("operador123"),
        "role": "operador",
        "active": True,
    },
    "admin1": {
        "id": "u2",
        "username": "admin1",
        "hashed_password": _hash("admin123"),
        "role": "admin",
        "active": True,
    },
    "superadmin": {
        "id": "u3",
        "username": "superadmin",
        "hashed_password": _hash("super123"),
        "role": "super_admin",
        "active": True,
    },
}

# Blacklisted refresh token strings
_blacklist: set[str] = set()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def authenticate(username: str, password: str) -> dict | None:
    user = _USERS.get(username)
    if not user or not user["active"]:
        return None
    if not _verify(password, user["hashed_password"]):
        return None
    return user


def blacklist_token(token: str) -> None:
    _blacklist.add(token)


def is_blacklisted(token: str) -> bool:
    return token in _blacklist


# ---------------------------------------------------------------------------
# User CRUD (used by /users router)
# ---------------------------------------------------------------------------

def list_users() -> list[dict]:
    return [
        {k: v for k, v in u.items() if k != "hashed_password"}
        for u in _USERS.values()
    ]


def get_user(user_id: str) -> dict | None:
    for u in _USERS.values():
        if u["id"] == user_id:
            return {k: v for k, v in u.items() if k != "hashed_password"}
    return None


def get_user_by_username(username: str) -> dict | None:
    u = _USERS.get(username)
    if u:
        return {k: v for k, v in u.items() if k != "hashed_password"}
    return None


def create_user(username: str, password: str, role: str) -> dict:
    if username in _USERS:
        raise ValueError("Username already exists")
    user_id = str(uuid.uuid4())
    _USERS[username] = {
        "id": user_id,
        "username": username,
        "hashed_password": _hash(password),
        "role": role,
        "active": True,
    }
    return get_user(user_id)


def update_user_role(user_id: str, new_role: str) -> dict | None:
    for username, u in _USERS.items():
        if u["id"] == user_id:
            _USERS[username]["role"] = new_role
            return get_user(user_id)
    return None


def delete_user(user_id: str) -> bool:
    for username, u in _USERS.items():
        if u["id"] == user_id:
            del _USERS[username]
            return True
    return False
