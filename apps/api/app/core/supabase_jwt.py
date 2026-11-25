from uuid import UUID

import jwt
from fastapi import HTTPException
from jwt import PyJWKClient

from app.core.config import settings


def problem(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"error": code, "message": message})


def verify_supabase_jwt(token: str) -> dict:
    if not token or token.count(".") != 2:
        raise problem(401, "invalid_token", "Sign in required")
    try:
        if settings.supabase_jwks_url:
            signing_key = PyJWKClient(settings.supabase_jwks_url).get_signing_key_from_jwt(token)
            key = signing_key.key
            algorithms = ["RS256", "ES256"]
        elif settings.supabase_jwt_secret:
            key = settings.supabase_jwt_secret
            algorithms = ["HS256"]
        else:
            raise problem(503, "auth_unconfigured", "Supabase JWT verification is not configured.")
        if not settings.supabase_jwt_issuer:
            raise problem(503, "auth_unconfigured", "SUPABASE_JWT_ISSUER is not configured.")
        claims = jwt.decode(
            token,
            key,
            algorithms=algorithms,
            audience=settings.supabase_jwt_audience,
            issuer=settings.supabase_jwt_issuer,
            options={"require": ["exp", "sub", "iss", "aud"]},
        )
    except HTTPException:
        raise
    except jwt.PyJWTError:
        raise problem(401, "invalid_token", "Sign in required") from None
    subject = claims.get("sub")
    try:
        UUID(str(subject))
    except (TypeError, ValueError):
        raise problem(401, "invalid_token", "Sign in required") from None
    return claims
