from enum import Enum
from pydantic import BaseModel

ROLE_HIERARCHY = {"operador": 0, "admin": 1, "super_admin": 2}


class Role(str, Enum):
    operador = "operador"
    admin = "admin"
    super_admin = "super_admin"


class UserCreate(BaseModel):
    username: str
    password: str
    role: Role


class UserRoleUpdate(BaseModel):
    role: Role


class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    active: bool
