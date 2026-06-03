from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from ..auth.jwt import create_token
from ..auth.mock_idp import authenticate, blacklist_token
from ..auth.rbac import get_current_user, get_refresh_payload
from ..config import settings
from ..schemas.auth import LogoutRequest, RefreshRequest, TokenResponse

router = APIRouter()


def _issue_tokens(user_id: str, role: str) -> TokenResponse:
    access = create_token(
        sub=user_id,
        role=role,
        token_type="access",
        ttl=timedelta(minutes=settings.access_token_ttl_minutes),
    )
    refresh = create_token(
        sub=user_id,
        role=role,
        token_type="refresh",
        ttl=timedelta(days=settings.refresh_token_ttl_days),
    )
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/token", response_model=TokenResponse, summary="Login (OAuth2 password flow)")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = authenticate(form.username, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _issue_tokens(user["id"], user["role"])


@router.post("/refresh", response_model=TokenResponse, summary="Rotate access + refresh tokens")
def refresh(body: RefreshRequest):
    payload = get_refresh_payload(body.refresh_token)
    # Rotate: invalidate the old refresh token before issuing a new one
    blacklist_token(body.refresh_token)
    return _issue_tokens(payload["sub"], payload["role"])


@router.post("/logout", summary="Revoke refresh token")
def logout(body: LogoutRequest, _user: dict = Depends(get_current_user)):
    blacklist_token(body.refresh_token)
    return {"detail": "Logged out"}
