from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.supabase_jwt import problem
from app.models_account import AuditLog, DeletionRequest, PrivacyConsent, Profile, UserPreference, UserRole
from app.schemas_account import ConsentIn, PreferencePatch, ProfilePatch

INTERESTS = {
    "menstrual_health",
    "general_wellness",
    "nutrition",
    "mental_wellness",
    "reproductive_education",
}


def _now() -> datetime:
    return datetime.now(UTC)


def _audit(db: Session, actor_id: str, action: str, resource_type: str, resource_id: str | None) -> None:
    db.add(
        AuditLog(
            id=str(uuid4()),
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            created_at=_now(),
        )
    )


def assert_owner(actor_id: str, requested_id: str) -> None:
    if actor_id != requested_id:
        raise problem(403, "forbidden", "You can only access your own account.")


def _closed(db: Session, user_id: str) -> bool:
    row = db.scalar(
        select(DeletionRequest)
        .where(DeletionRequest.user_id == user_id, DeletionRequest.request_status == "completed")
        .limit(1)
    )
    return row is not None


def _display_name(claims: dict) -> str:
    meta = claims.get("user_metadata")
    raw = ""
    if isinstance(meta, dict):
        raw = str(meta.get("display_name") or "")
    cleaned = " ".join(raw.split())[:80]
    return cleaned


def role_for(db: Session, user_id: str) -> str:
    roles = db.scalars(select(UserRole.role).where(UserRole.user_id == user_id)).all()
    return "admin" if "admin" in roles else "member"


def provision_profile(db: Session, user_id: str, claims: dict) -> Profile:
    if _closed(db, user_id):
        raise problem(403, "account_closed", "This account is closed.")
    existing = db.get(Profile, user_id)
    if existing:
        return existing
    now = _now()
    profile = Profile(
        id=user_id,
        display_name=_display_name(claims),
        preferred_language="bn",
        timezone="Asia/Dhaka",
        onboarding_completed=False,
        created_at=now,
        updated_at=now,
    )
    preference = UserPreference(
        id=str(uuid4()),
        user_id=user_id,
        theme="light",
        notifications_enabled=False,
        health_interests=[],
        created_at=now,
        updated_at=now,
    )
    role = UserRole(id=str(uuid4()), user_id=user_id, role="member", created_at=now)
    db.add(profile)
    db.add(preference)
    db.add(role)
    _audit(db, user_id, "profile_provisioned", "profile", user_id)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.get(Profile, user_id)
        if existing is None:
            raise
        return existing
    db.refresh(profile)
    return profile


def update_profile(db: Session, actor_id: str, body: ProfilePatch) -> Profile:
    profile = db.get(Profile, actor_id)
    if profile is None:
        raise problem(404, "not_found", "Profile not found.")
    if body.display_name is not None:
        profile.display_name = " ".join(body.display_name.split())
    if body.preferred_language is not None:
        profile.preferred_language = body.preferred_language
    if body.timezone is not None:
        profile.timezone = body.timezone
    if body.onboarding_completed is not None:
        profile.onboarding_completed = body.onboarding_completed
    profile.updated_at = _now()
    _audit(db, actor_id, "profile_updated", "profile", actor_id)
    db.commit()
    db.refresh(profile)
    return profile


def get_preferences(db: Session, user_id: str) -> UserPreference:
    row = db.scalar(select(UserPreference).where(UserPreference.user_id == user_id))
    if row is None:
        raise problem(404, "not_found", "Preferences not found.")
    return row


def update_preferences(db: Session, user_id: str, body: PreferencePatch) -> UserPreference:
    row = get_preferences(db, user_id)
    if body.theme is not None:
        row.theme = body.theme
    if body.notifications_enabled is not None:
        row.notifications_enabled = body.notifications_enabled
    if body.health_interests is not None:
        if any(item not in INTERESTS for item in body.health_interests):
            raise problem(422, "invalid_interest", "One of the interests is not supported.")
        row.health_interests = list(dict.fromkeys(body.health_interests))
    row.updated_at = _now()
    _audit(db, user_id, "preference_updated", "preference", row.id)
    db.commit()
    db.refresh(row)
    return row


def list_consents(db: Session, user_id: str) -> list[PrivacyConsent]:
    return list(
        db.scalars(
            select(PrivacyConsent).where(PrivacyConsent.user_id == user_id).order_by(PrivacyConsent.recorded_at.asc())
        ).all()
    )


def record_consent(db: Session, user_id: str, body: ConsentIn) -> PrivacyConsent:
    if body.consent_status == "withdrawn" and body.consent_type != "optional_processing":
        raise problem(403, "consent_required", "Required agreements are withdrawn by requesting account deletion.")
    now = _now()
    row = PrivacyConsent(
        id=str(uuid4()),
        user_id=user_id,
        consent_type=body.consent_type,
        policy_version=body.policy_version,
        consent_status=body.consent_status,
        recorded_at=now,
        withdrawn_at=now if body.consent_status == "withdrawn" else None,
    )
    db.add(row)
    _audit(db, user_id, "consent_recorded", "consent", row.id)
    db.commit()
    db.refresh(row)
    return row


def request_deletion(db: Session, user_id: str, email: str | None, confirmation: str) -> DeletionRequest:
    if not email or confirmation.lower() != email.lower():
        raise problem(400, "confirmation_failed", "Enter the email address on this account.")
    open_row = db.scalar(
        select(DeletionRequest).where(
            DeletionRequest.user_id == user_id,
            DeletionRequest.request_status.in_(("requested", "processing")),
        )
    )
    if open_row:
        return open_row
    row = DeletionRequest(
        id=str(uuid4()),
        user_id=user_id,
        request_status="requested",
        requested_at=_now(),
        completed_at=None,
    )
    db.add(row)
    _audit(db, user_id, "deletion_requested", "deletion", row.id)
    db.commit()
    db.refresh(row)
    return row


def deletion_status(db: Session, user_id: str) -> DeletionRequest | None:
    return db.scalar(
        select(DeletionRequest)
        .where(DeletionRequest.user_id == user_id)
        .order_by(DeletionRequest.requested_at.desc())
        .limit(1)
    )


def export_account(db: Session, user_id: str, email: str | None) -> dict:
    profile = db.get(Profile, user_id)
    preference = get_preferences(db, user_id)
    consents = list_consents(db, user_id)
    deletion = deletion_status(db, user_id)
    return {
        "included": ["profile", "preferences", "consents", "deletion_request"],
        "not_included": [
            "Cycle logs, symptom notes, and chat messages stay in the separate health database and are not part of this export."
        ],
        "profile": {
            "id": user_id,
            "email": email,
            "display_name": profile.display_name if profile else "",
            "preferred_language": profile.preferred_language if profile else "bn",
            "timezone": profile.timezone if profile else "Asia/Dhaka",
            "onboarding_completed": profile.onboarding_completed if profile else False,
            "role": role_for(db, user_id),
        },
        "preferences": {
            "theme": preference.theme,
            "notifications_enabled": preference.notifications_enabled,
            "health_interests": list(preference.health_interests or []),
        },
        "consents": [
            {
                "consent_type": item.consent_type,
                "policy_version": item.policy_version,
                "consent_status": item.consent_status,
                "recorded_at": item.recorded_at.isoformat(),
            }
            for item in consents
        ],
        "deletion_request": None
        if deletion is None
        else {"request_status": deletion.request_status, "requested_at": deletion.requested_at.isoformat()},
    }


def process_deletion(db: Session, actor_id: str, request_id: str) -> DeletionRequest:
    if role_for(db, actor_id) != "admin":
        raise problem(403, "forbidden", "Admin access is required.")
    row = db.get(DeletionRequest, request_id)
    if row is None:
        raise problem(404, "not_found", "Deletion request not found.")
    if row.request_status == "completed":
        return row
    from app.services.identity_admin import delete_auth_user

    if not delete_auth_user(row.user_id):
        raise problem(
            503,
            "deletion_unconfigured",
            "The identity provider is not configured, so this request stays open.",
        )
    user_id = row.user_id
    db.query(PrivacyConsent).filter(PrivacyConsent.user_id == user_id).delete()
    db.query(UserPreference).filter(UserPreference.user_id == user_id).delete()
    db.query(UserRole).filter(UserRole.user_id == user_id).delete()
    db.query(Profile).filter(Profile.id == user_id).delete()
    row.request_status = "completed"
    row.completed_at = _now()
    _audit(db, actor_id, "deletion_completed", "deletion", row.id)
    db.commit()
    db.refresh(row)
    return row


def list_directory(db: Session) -> list[dict]:
    profiles = db.scalars(select(Profile).order_by(Profile.created_at.asc())).all()
    return [
        {"id": profile.id, "display_name": profile.display_name, "role": role_for(db, profile.id)}
        for profile in profiles
    ]
