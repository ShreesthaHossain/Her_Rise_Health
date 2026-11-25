from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from fastapi.testclient import TestClient

import app.models_tracking  # noqa: F401
from app.account_db import account_engine
from app.core.config import settings
from app.main import app
from app.models_account import AccountBase


def _token(user_id) -> str:
    payload = {
        "sub": str(user_id),
        "email": "owner@example.com",
        "iss": settings.supabase_jwt_issuer,
        "aud": "authenticated",
        "exp": datetime.now(UTC) + timedelta(minutes=10),
        "user_metadata": {"display_name": "Owner"},
    }
    return jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")


def _auth(user_id) -> dict:
    return {"Authorization": f"Bearer {_token(user_id)}"}


def _cycle(start: str, end: str | None = None) -> dict:
    body = {"period_start": start, "flow_level": "medium", "pain_level": 3}
    if end:
        body["period_end"] = end
    return body


def test_tracking_is_private_and_validated():
    engine = account_engine()
    AccountBase.metadata.drop_all(bind=engine)
    AccountBase.metadata.create_all(bind=engine)
    owner = uuid4()
    other = uuid4()
    with TestClient(app) as client:
        assert client.get("/api/v1/wellness").status_code == 401
        assert client.post("/api/v1/reports/export", json={"kind": "combined", "range_days": 7}).status_code == 401
        invalid = client.post("/api/v1/cycles", json={"period_start": "2026-11-05", "period_end": "2026-11-01", "flow_level": "heavy", "pain_level": 2}, headers=_auth(owner))
        assert invalid.status_code == 422
        pain = client.post("/api/v1/cycles", json={"period_start": "2026-11-01", "flow_level": "light", "pain_level": 11}, headers=_auth(owner))
        assert pain.status_code == 422

        first = client.post("/api/v1/cycles", json=_cycle("2026-01-01", "2026-01-05"), headers=_auth(owner))
        assert first.status_code == 201
        cycle_id = first.json()["id"]
        assert client.post("/api/v1/cycles", json=_cycle("2026-01-01", "2026-01-04"), headers=_auth(owner)).status_code == 409
        assert client.post("/api/v1/cycles", json=_cycle("2026-01-04", "2026-01-08"), headers=_auth(owner)).status_code == 409
        assert client.post("/api/v1/cycles", json=_cycle("2026-01-29", "2026-02-02"), headers=_auth(owner)).status_code == 201
        assert client.post("/api/v1/cycles", json=_cycle("2026-02-26", "2026-03-02"), headers=_auth(owner)).status_code == 201
        assert client.post("/api/v1/cycles", json=_cycle("2026-03-26", "2026-03-30"), headers=_auth(owner)).status_code == 201

        hidden = client.get("/api/v1/cycles", headers=_auth(other))
        assert hidden.status_code == 200
        assert hidden.json()["items"] == []
        assert client.get(f"/api/v1/cycles/{cycle_id}", headers=_auth(other)).status_code == 404
        edited = client.patch(f"/api/v1/cycles/{cycle_id}", json={"notes": "cramps in the morning", "pain_level": 4}, headers=_auth(owner))
        assert edited.status_code == 200
        assert edited.json()["notes"] == "cramps in the morning"
        summary = client.get("/api/v1/cycles/summary", headers=_auth(owner))
        assert summary.headers["cache-control"] == "no-store"
        assert summary.json()["prediction"]["based_on_cycles"] == 3
        assert summary.json()["record_count"] == 4

        foreign = client.post(
            "/api/v1/symptoms",
            json={"recorded_date": "2026-01-02", "category": "headache", "severity": 5, "cycle_log_id": cycle_id},
            headers=_auth(other),
        )
        assert foreign.status_code == 422
        symptom = client.post(
            "/api/v1/symptoms",
            json={"recorded_date": "2026-01-02", "category": "headache", "severity": 6, "notes": "left side", "cycle_log_id": cycle_id},
            headers=_auth(owner),
        )
        assert symptom.status_code == 201
        symptom_id = symptom.json()["id"]
        assert client.patch(f"/api/v1/symptoms/{symptom_id}", json={"severity": 9}, headers=_auth(other)).status_code == 404
        trends = client.get("/api/v1/symptoms/trends", headers=_auth(owner)).json()
        assert trends["frequency"][0]["category"] == "headache"
        assert trends["safety"]["clinician_reviewed"] is False

        checkin = client.post(
            "/api/v1/wellness",
            json={"recorded_date": "2026-04-02", "mood": "neutral", "sleep_hours": 7.5, "stress_level": 2, "energy_level": 3},
            headers=_auth(owner),
        )
        assert checkin.status_code == 201
        assert client.post(
            "/api/v1/wellness",
            json={"recorded_date": "2026-04-02", "mood": "low", "stress_level": 4, "energy_level": 2},
            headers=_auth(owner),
        ).status_code == 409
        assert client.delete(f"/api/v1/wellness/{checkin.json()['id']}", headers=_auth(other)).status_code == 404

        reminder = client.post(
            "/api/v1/reminders",
            json={
                "title": "Evening check-in",
                "reminder_type": "wellness",
                "schedule_config": {"frequency": "daily", "time": "20:00", "timezone": "Asia/Dhaka"},
            },
            headers=_auth(owner),
        )
        assert reminder.status_code == 201
        assert reminder.json()["delivery"] == "in_app"
        assert "email" in reminder.json()["delivery_note"]
        paused = client.patch(f"/api/v1/reminders/{reminder.json()['id']}", json={"enabled": False}, headers=_auth(owner))
        assert paused.json()["on_todays_list"] is False

        report = client.post("/api/v1/reports/export", json={"kind": "combined", "start": "2026-01-01", "end": "2026-04-30", "format": "csv"}, headers=_auth(owner))
        assert report.status_code == 200
        assert "text/csv" in report.headers["content-type"]
        assert "period,2026-01-01" in report.text
        other_report = client.post("/api/v1/reports/export", json={"kind": "cycle", "start": "2026-01-01", "end": "2026-04-30", "format": "csv"}, headers=_auth(other))
        assert "period," not in other_report.text
        pdf = client.post("/api/v1/reports/export", json={"kind": "combined", "range_days": 90, "format": "pdf"}, headers=_auth(owner))
        assert pdf.content.startswith(b"%PDF")

        assert client.delete(f"/api/v1/cycles/{cycle_id}", headers=_auth(owner)).status_code == 204
        assert client.get(f"/api/v1/cycles/{cycle_id}", headers=_auth(owner)).status_code == 404
    AccountBase.metadata.drop_all(bind=engine)
