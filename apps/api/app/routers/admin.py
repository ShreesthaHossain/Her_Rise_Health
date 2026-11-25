from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.account_db import get_account_db
from app.dependencies.auth import Identity, require_admin
from app.models_account import AuditLog
from app.services.profile_service import list_directory, process_deletion

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def users(db: Session = Depends(get_account_db), _admin: Identity = Depends(require_admin)) -> list[dict]:
    return list_directory(db)


@router.get("/audit")
def audit(db: Session = Depends(get_account_db), _admin: Identity = Depends(require_admin)) -> list[dict]:
    rows = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc())).all()
    return [
        {
            "id": row.id,
            "actor_id": row.actor_id,
            "action": row.action,
            "resource_type": row.resource_type,
            "resource_id": row.resource_id,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


@router.post("/deletion-requests/{request_id}/complete")
def complete_deletion(
    request_id: str,
    db: Session = Depends(get_account_db),
    admin: Identity = Depends(require_admin),
) -> dict:
    row = process_deletion(db, admin.user_id, request_id)
    return {
        "id": row.id,
        "request_status": row.request_status,
        "identity_deleted": row.request_status == "completed",
    }
