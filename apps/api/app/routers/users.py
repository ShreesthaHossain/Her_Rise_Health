from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.account_db import get_account_db
from app.dependencies.auth import Identity, get_identity
from app.schemas_account import ProfileOut, ProfilePatch
from app.services.profile_service import export_account, update_profile

router = APIRouter(prefix="/users", tags=["users"])


def _out(identity: Identity) -> ProfileOut:
    profile = identity.profile
    return ProfileOut(
        id=identity.user_id,
        email=identity.email,
        display_name=profile.display_name,
        preferred_language=profile.preferred_language,
        timezone=profile.timezone,
        onboarding_completed=profile.onboarding_completed,
        role=identity.role,
    )


@router.get("/me", response_model=ProfileOut)
def read_me(identity: Identity = Depends(get_identity)) -> ProfileOut:
    return _out(identity)


@router.patch("/me", response_model=ProfileOut)
def patch_me(
    body: ProfilePatch,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> ProfileOut:
    identity.profile = update_profile(db, identity.user_id, body)
    return _out(identity)


@router.get("/me/export")
def export_me(db: Session = Depends(get_account_db), identity: Identity = Depends(get_identity)) -> dict:
    return export_account(db, identity.user_id, identity.email)
