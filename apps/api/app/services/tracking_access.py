from fastapi import Request
from sqlalchemy.orm import Session

from app.account_db import open_account_session
from app.core.supabase_jwt import verify_supabase_jwt
from app.dependencies.auth import Identity
from app.services.profile_service import provision_profile, role_for


def open_bearer(request: Request) -> tuple[Identity, Session] | None:
    header = request.headers.get("authorization") or ""
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    db = open_account_session()
    try:
        claims = verify_supabase_jwt(token.strip())
        user_id = str(claims["sub"])
        email = claims.get("email")
        if not isinstance(email, str) or "@" not in email:
            email = None
        profile = provision_profile(db, user_id, claims)
        identity = Identity(user_id=user_id, email=email, role=role_for(db, user_id), profile=profile)
        return identity, db
    except Exception:
        db.close()
        raise
