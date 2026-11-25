from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.account_db import get_account_db
from app.dependencies.auth import Identity, get_identity
from app.schemas_account import DeletionIn, DeletionOut
from app.services.profile_service import deletion_status, request_deletion

router = APIRouter(prefix="/account", tags=["account"])


def _out(row) -> DeletionOut:
    if row is None:
        return DeletionOut(id=None, request_status=None, requested_at=None, completed_at=None, identity_deleted=False)
    return DeletionOut(
        id=row.id,
        request_status=row.request_status,
        requested_at=row.requested_at,
        completed_at=row.completed_at,
        identity_deleted=row.request_status == "completed",
    )


@router.post("/deletion-request", response_model=DeletionOut, status_code=201)
def create_deletion(
    body: DeletionIn,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> DeletionOut:
    row = request_deletion(db, identity.user_id, identity.email, body.confirmation_email)
    return _out(row)


@router.get("/deletion-status", response_model=DeletionOut)
def read_deletion(db: Session = Depends(get_account_db), identity: Identity = Depends(get_identity)) -> DeletionOut:
    return _out(deletion_status(db, identity.user_id))
