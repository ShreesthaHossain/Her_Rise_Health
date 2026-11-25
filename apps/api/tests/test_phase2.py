import base64
import json
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app.account_db import account_engine
from app.core.config import settings
from app.main import app
from app.models_account import AccountBase, UserRole
from app.services.profile_service import assert_owner
from sqlalchemy.orm import Session


def _token(user_id, email, name, *, secret=None, issuer=None, audience="authenticated", exp=None, alg="HS256", key=None):
    payload = {
        "sub": str(user_id),
        "email": email,
        "iss": issuer or settings.supabase_jwt_issuer,
        "aud": audience,
        "exp": exp or datetime.now(UTC) + timedelta(minutes=10),
        "user_metadata": {"display_name": name},
    }
    return jwt.encode(payload, key or secret or settings.supabase_jwt_secret, algorithm=alg)


def _auth(user_id, email="owner@example.com", name="Owner"):
    return {"Authorization": f"Bearer {_token(user_id, email, name)}"}


@pytest.fixture()
def client():
    engine = account_engine()
    AccountBase.metadata.drop_all(bind=engine)
    AccountBase.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    AccountBase.metadata.drop_all(bind=engine)


def test_missing_and_bad_tokens_are_rejected(client: TestClient):
    missing = client.get("/api/v1/users/me")
    assert missing.status_code == 401
    assert missing.json()["detail"]["error"] == "missing_token"
    bad = client.get("/api/v1/users/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert bad.status_code == 401
    expired = _token(uuid4(), "a@example.com", "A", exp=datetime.now(UTC) - timedelta(hours=1))
    assert client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401
    wrong = _token(uuid4(), "a@example.com", "A", secret="another-secret-that-is-long-enough")
    assert client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {wrong}"}).status_code == 401
    audience = _token(uuid4(), "a@example.com", "A", audience="anon")
    assert client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {audience}"}).status_code == 401
    issuer = _token(uuid4(), "a@example.com", "A", issuer="https://evil.example/auth")
    assert client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {issuer}"}).status_code == 401


def test_unsigned_token_is_rejected(client: TestClient):
    payload = {
        "sub": str(uuid4()),
        "email": "a@example.com",
        "iss": settings.supabase_jwt_issuer,
        "aud": "authenticated",
        "exp": int((datetime.now(UTC) + timedelta(minutes=5)).timestamp()),
    }

    def b64(raw: bytes) -> str:
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

    token = b64(b'{"alg":"none","typ":"JWT"}') + "." + b64(json.dumps(payload).encode()) + "."
    response = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_rs256_token_is_checked_against_jwks(client: TestClient, monkeypatch):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    user_id = uuid4()
    token = _token(user_id, "rsa@example.com", "Rsa", alg="RS256", key=private_key)

    class FakeKey:
        key = private_key.public_key()

    class FakeClient:
        def __init__(self, _url: str) -> None:
            pass

        def get_signing_key_from_jwt(self, _token: str) -> FakeKey:
            return FakeKey()

    monkeypatch.setattr("app.core.supabase_jwt.PyJWKClient", FakeClient)
    monkeypatch.setattr(settings, "supabase_jwks_url", "https://example.test/.well-known/jwks.json")
    response = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "rsa@example.com"
    monkeypatch.setattr(settings, "supabase_jwks_url", "")


def test_profile_is_private_and_provisioned_once(client: TestClient):
    owner = uuid4()
    other = uuid4()
    first = client.get("/api/v1/users/me", headers=_auth(owner, "owner@example.com", "Owner"))
    second = client.get("/api/v1/users/me", headers=_auth(owner, "owner@example.com", "Owner"))
    assert first.status_code == 200
    assert second.json()["id"] == str(owner)
    assert second.json()["role"] == "member"
    client.get("/api/v1/users/me", headers=_auth(other, "other@example.com", "Other"))
    changed = client.patch(
        "/api/v1/users/me",
        headers=_auth(owner, "owner@example.com", "Owner"),
        json={"display_name": "Owner Updated", "role": "admin", "user_id": str(other), "preferred_language": "en"},
    )
    assert changed.status_code == 200
    assert changed.json()["role"] == "member"
    assert changed.json()["id"] == str(owner)
    assert changed.json()["display_name"] == "Owner Updated"
    other_view = client.get("/api/v1/users/me", headers=_auth(other, "other@example.com", "Other"))
    assert other_view.json()["display_name"] == "Other"
    assert other_view.json()["preferred_language"] == "bn"
    with pytest.raises(Exception) as denied:
        assert_owner(str(owner), str(other))
    assert denied.value.status_code == 403


def test_preferences_and_consent_history_stay_with_the_owner(client: TestClient):
    owner = uuid4()
    other = uuid4()
    headers = _auth(owner, "owner@example.com", "Owner")
    other_headers = _auth(other, "other@example.com", "Other")
    client.get("/api/v1/users/me", headers=headers)
    client.get("/api/v1/users/me", headers=other_headers)
    updated = client.patch(
        "/api/v1/preferences",
        headers=headers,
        json={"theme": "dark", "health_interests": ["nutrition"], "user_id": str(other)},
    )
    assert updated.status_code == 200
    assert updated.json()["theme"] == "dark"
    assert client.get("/api/v1/preferences", headers=other_headers).json()["theme"] == "light"
    granted = client.post(
        "/api/v1/consents",
        headers=headers,
        json={"consent_type": "optional_processing", "policy_version": "2026-11-22", "consent_status": "granted"},
    )
    assert granted.status_code == 201
    client.post(
        "/api/v1/consents",
        headers=headers,
        json={"consent_type": "optional_processing", "policy_version": "2026-11-22", "consent_status": "granted"},
    )
    withdrawn = client.post(
        "/api/v1/consents",
        headers=headers,
        json={"consent_type": "optional_processing", "policy_version": "2026-11-22", "consent_status": "withdrawn"},
    )
    assert withdrawn.status_code == 201
    history = client.get("/api/v1/consents", headers=headers).json()
    assert len(history) == 3
    assert history[0]["consent_status"] == "granted"
    assert history[-1]["consent_status"] == "withdrawn"
    blocked = client.post(
        "/api/v1/consents",
        headers=headers,
        json={"consent_type": "terms", "policy_version": "2026-11-22", "consent_status": "withdrawn"},
    )
    assert blocked.status_code == 403
    assert client.get("/api/v1/consents", headers=other_headers).json() == []


def test_deletion_request_does_not_pretend_to_finish(client: TestClient, monkeypatch):
    owner = uuid4()
    admin = uuid4()
    headers = _auth(owner, "owner@example.com", "Owner")
    client.get("/api/v1/users/me", headers=headers)
    client.get("/api/v1/users/me", headers=_auth(admin, "admin@example.com", "Admin"))
    with Session(account_engine()) as db:
        db.add(UserRole(id=str(uuid4()), user_id=str(admin), role="admin", created_at=datetime.now(UTC)))
        db.commit()
    rejected = client.post(
        "/api/v1/account/deletion-request",
        headers=headers,
        json={"confirmation_email": "someone-else@example.com"},
    )
    assert rejected.status_code == 400
    created = client.post(
        "/api/v1/account/deletion-request",
        headers=headers,
        json={"confirmation_email": "owner@example.com"},
    )
    assert created.status_code == 201
    assert created.json()["request_status"] == "requested"
    assert created.json()["identity_deleted"] is False
    assert "service" not in json.dumps(created.json()).lower()
    still_there = client.get("/api/v1/users/me", headers=headers)
    assert still_there.status_code == 200
    member_complete = client.post(f"/api/v1/admin/deletion-requests/{created.json()['id']}/complete", headers=headers)
    assert member_complete.status_code == 403
    waiting = client.post(
        f"/api/v1/admin/deletion-requests/{created.json()['id']}/complete",
        headers=_auth(admin, "admin@example.com", "Admin"),
    )
    assert waiting.status_code == 503
    assert client.get("/api/v1/account/deletion-status", headers=headers).json()["request_status"] == "requested"
    monkeypatch.setattr("app.services.identity_admin.delete_auth_user", lambda _user_id: True)
    done = client.post(
        f"/api/v1/admin/deletion-requests/{created.json()['id']}/complete",
        headers=_auth(admin, "admin@example.com", "Admin"),
    )
    assert done.status_code == 200
    assert done.json()["identity_deleted"] is True
    closed = client.get("/api/v1/users/me", headers=headers)
    assert closed.status_code == 403
    exported = client.get("/api/v1/users/me/export", headers=_auth(admin, "admin@example.com", "Admin"))
    assert exported.status_code == 200
    assert exported.json()["profile"]["email"] == "admin@example.com"
    assert "Cycle logs" in exported.json()["not_included"][0]


def test_admin_routes_reject_members(client: TestClient):
    member = uuid4()
    admin = uuid4()
    client.get("/api/v1/users/me", headers=_auth(member, "member@example.com", "Member"))
    client.get("/api/v1/users/me", headers=_auth(admin, "admin@example.com", "Admin"))
    with Session(account_engine()) as db:
        db.add(UserRole(id=str(uuid4()), user_id=str(admin), role="admin", created_at=datetime.now(UTC)))
        db.commit()
    denied = client.get("/api/v1/admin/users", headers=_auth(member, "member@example.com", "Member"))
    assert denied.status_code == 403
    allowed = client.get("/api/v1/admin/users", headers=_auth(admin, "admin@example.com", "Admin"))
    assert allowed.status_code == 200
    assert {row["id"] for row in allowed.json()} == {str(member), str(admin)}
    audit_denied = client.get("/api/v1/admin/audit", headers=_auth(member, "member@example.com", "Member"))
    assert audit_denied.status_code == 403
    audit = client.get("/api/v1/admin/audit", headers=_auth(admin, "admin@example.com", "Admin"))
    assert audit.status_code == 200
    assert settings.supabase_jwt_secret not in json.dumps(audit.json())
