from dataclasses import dataclass

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.account_db import get_account_db
from app.core.supabase_jwt import problem, verify_supabase_jwt
from app.models_account import Profile
from app.services.profile_service import provision_profile, role_for


@dataclass
class Identity:
    user_id: str
    email: str | None
    role: str
    profile: Profile


def _bearer(request: Request) -> str:
    header = request.headers.get("authorization") or ""
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise problem(401, "missing_token", "Sign in required")
    return token.strip()


def get_identity(request: Request, db: Session = Depends(get_account_db)) -> Identity:
    claims = verify_supabase_jwt(_bearer(request))
    user_id = str(claims["sub"])
    email = claims.get("email")
    if not isinstance(email, str) or "@" not in email:
        email = None
    profile = provision_profile(db, user_id, claims)
    return Identity(user_id=user_id, email=email, role=role_for(db, user_id), profile=profile)


def require_admin(identity: Identity = Depends(get_identity)) -> Identity:
    if identity.role != "admin":
        raise problem(403, "forbidden", "Admin access is required.")
    return identity
