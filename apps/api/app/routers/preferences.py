from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.account_db import get_account_db
from app.dependencies.auth import Identity, get_identity
from app.schemas_account import PreferenceOut, PreferencePatch
from app.services.profile_service import get_preferences, update_preferences

router = APIRouter(prefix="/preferences", tags=["preferences"])


def _out(row) -> PreferenceOut:
    return PreferenceOut(
        theme=row.theme,
        notifications_enabled=row.notifications_enabled,
        health_interests=list(row.health_interests or []),
    )


@router.get("", response_model=PreferenceOut)
def read_preferences(db: Session = Depends(get_account_db), identity: Identity = Depends(get_identity)) -> PreferenceOut:
    return _out(get_preferences(db, identity.user_id))


@router.patch("", response_model=PreferenceOut)
def patch_preferences(
    body: PreferencePatch,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> PreferenceOut:
    return _out(update_preferences(db, identity.user_id, body))
