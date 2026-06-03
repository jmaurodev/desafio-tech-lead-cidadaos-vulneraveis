from fastapi import APIRouter, Depends, HTTPException, status

from ..auth.mock_idp import (
    create_user,
    delete_user,
    get_user,
    list_users,
    update_user_role,
)
from ..auth.rbac import get_current_user
from ..schemas.user import ROLE_HIERARCHY, UserCreate, UserResponse, UserRoleUpdate

router = APIRouter()


def _require_admin(user: dict = Depends(get_current_user)) -> dict:
    if ROLE_HIERARCHY.get(user["role"], -1) < ROLE_HIERARCHY["admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")
    return user


def _assert_can_manage(actor: dict, target_role: str) -> None:
    """Actor cannot assign or manage roles above their own level."""
    if ROLE_HIERARCHY.get(target_role, 99) >= ROLE_HIERARCHY.get(actor["role"], 0):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot manage users with equal or higher role",
        )


@router.get("", response_model=list[UserResponse])
def list_all_users(actor: dict = Depends(_require_admin)):
    return list_users()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_new_user(body: UserCreate, actor: dict = Depends(_require_admin)):
    _assert_can_manage(actor, body.role.value)
    try:
        return create_user(body.username, body.password, body.role.value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.patch("/{user_id}/role", response_model=UserResponse)
def change_user_role(user_id: str, body: UserRoleUpdate, actor: dict = Depends(_require_admin)):
    target = get_user(user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Cannot modify users at or above own level
    _assert_can_manage(actor, target["role"])
    # Cannot assign roles at or above own level
    _assert_can_manage(actor, body.role.value)

    updated = update_user_role(user_id, body.role.value)
    return updated


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(user_id: str, actor: dict = Depends(_require_admin)):
    target = get_user(user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    _assert_can_manage(actor, target["role"])
    delete_user(user_id)
