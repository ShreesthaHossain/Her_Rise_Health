from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.account_db import get_account_db
from app.dependencies.auth import Identity, get_identity
from app.schemas_account import ConsentIn, ConsentOut
from app.services.profile_service import list_consents, record_consent

router = APIRouter(prefix="/consents", tags=["consents"])


def _out(row) -> ConsentOut:
    return ConsentOut(
        id=row.id,
        consent_type=row.consent_type,
        policy_version=row.policy_version,
        consent_status=row.consent_status,
        recorded_at=row.recorded_at,
        withdrawn_at=row.withdrawn_at,
    )


@router.get("", response_model=list[ConsentOut])
def read_consents(db: Session = Depends(get_account_db), identity: Identity = Depends(get_identity)) -> list[ConsentOut]:
    return [_out(row) for row in list_consents(db, identity.user_id)]


@router.post("", response_model=ConsentOut, status_code=201)
def create_consent(
    body: ConsentIn,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> ConsentOut:
    return _out(record_consent(db, identity.user_id, body))
