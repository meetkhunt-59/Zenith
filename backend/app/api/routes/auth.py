from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core.supabase_client import supabase
from app.schemas.auth import AuthRequest, AuthResponse
from app.services.auth import upsert_user

router = APIRouter()


@router.post("/signup", response_model=AuthResponse)
async def signup(payload: AuthRequest, db: AsyncSession = Depends(get_session)):
    try:
        result = supabase.auth.sign_up(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as exc:  # supabase-py raises typed errors; fallback to generic
        raise HTTPException(status_code=400, detail=str(exc))

    supa_user = result.user
    if supa_user is None:
        raise HTTPException(
            status_code=400,
            detail="Sign-up failed. Ensure email is valid or check Supabase settings.",
        )

    user = await upsert_user(db, supa_user.id, payload.email, payload.role or "inventory_manager")
    requires_confirmation = result.session is None

    return AuthResponse(
        user_id=str(user.id),
        email=user.email,
        access_token=result.session.access_token if result.session else None,
        refresh_token=result.session.refresh_token if result.session else None,
        requires_email_confirmation=requires_confirmation,
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: AuthRequest, db: AsyncSession = Depends(get_session)):
    try:
        result = supabase.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid credentials.")

    if not result.session:
        raise HTTPException(
            status_code=401,
            detail="Login requires email verification. Check your inbox.",
        )

    supa_user = result.user
    if supa_user is None:
        raise HTTPException(status_code=400, detail="User not found in Supabase.")

    user = await upsert_user(db, supa_user.id, payload.email, payload.role or "inventory_manager")

    return AuthResponse(
        user_id=str(user.id),
        email=user.email,
        access_token=result.session.access_token,
        refresh_token=result.session.refresh_token,
        requires_email_confirmation=False,
    )
