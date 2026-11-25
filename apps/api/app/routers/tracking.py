from datetime import date

from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import Response as RawResponse
from sqlalchemy.orm import Session

from app.account_db import get_account_db
from app.dependencies.auth import Identity, get_identity
from app.schemas_tracking import (
    CyclePatch,
    CycleWrite,
    ReminderPatch,
    ReminderWrite,
    ReportRequest,
    SymptomPatch,
    SymptomWrite,
    WellnessPatch,
    WellnessWrite,
)
from app.services import tracking_service as tracking

router = APIRouter(tags=["tracking"])


def _private(response: Response) -> None:
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"


@router.get("/cycles")
def read_cycles(
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    _private(response)
    return tracking.list_cycles(db, identity.user_id, limit, offset)


@router.post("/cycles", status_code=201)
def add_cycle(
    body: CycleWrite,
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.create_cycle(db, identity.user_id, body)


@router.delete("/cycles/{cycle_id}", status_code=204)
def remove_cycle(
    cycle_id: str,
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> Response:
    _private(response)
    tracking.delete_cycle(db, identity.user_id, cycle_id)
    return Response(status_code=204)


@router.get("/symptoms")
def read_symptoms(
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str | None = None,
    start: date | None = None,
    end: date | None = None,
    q: str | None = None,
    sort: str = "recorded_date",
    direction: str = "desc",
) -> dict:
    _private(response)
    return tracking.list_symptoms(
        db,
        identity.user_id,
        limit=limit,
        offset=offset,
        category=category,
        start=start,
        end=end,
        query=q,
        sort=sort if sort in {"recorded_date", "severity"} else "recorded_date",
        direction=direction if direction in {"asc", "desc"} else "desc",
    )


@router.get("/cycles/summary")
def cycle_summary(
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.cycle_summary(db, identity.user_id)


@router.get("/cycles/{cycle_id}")
def read_cycle(
    cycle_id: str,
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.cycle_out(tracking._own_cycle(db, identity.user_id, cycle_id))


@router.patch("/cycles/{cycle_id}")
def patch_cycle(
    cycle_id: str,
    body: CyclePatch,
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.update_cycle(db, identity.user_id, cycle_id, body)


@router.post("/symptoms", status_code=201)
def post_symptom(
    body: SymptomWrite,
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.create_symptom(db, identity.user_id, body)


@router.get("/symptoms/trends")
def symptom_trends(
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.symptom_trends(db, identity.user_id)


@router.patch("/symptoms/{symptom_id}")
def patch_symptom(
    symptom_id: str,
    body: SymptomPatch,
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.update_symptom(db, identity.user_id, symptom_id, body)


@router.delete("/symptoms/{symptom_id}", status_code=204)
def remove_symptom(
    symptom_id: str,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> Response:
    tracking.delete_symptom(db, identity.user_id, symptom_id)
    return Response(status_code=204, headers={"Cache-Control": "no-store"})


@router.get("/wellness")
def read_wellness(
    response: Response,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.list_wellness(db, identity.user_id, limit, offset, start, end)


@router.post("/wellness", status_code=201)
def post_wellness(
    body: WellnessWrite,
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.create_wellness(db, identity.user_id, body)


@router.get("/wellness/summary")
def read_wellness_summary(
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.wellness_summary(db, identity.user_id)


@router.patch("/wellness/{wellness_id}")
def patch_wellness(
    wellness_id: str,
    body: WellnessPatch,
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.update_wellness(db, identity.user_id, wellness_id, body)


@router.delete("/wellness/{wellness_id}", status_code=204)
def remove_wellness(
    wellness_id: str,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> Response:
    tracking.delete_wellness(db, identity.user_id, wellness_id)
    return Response(status_code=204, headers={"Cache-Control": "no-store"})


@router.get("/reminders")
def read_reminders(
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.list_reminders(db, identity.user_id)


@router.post("/reminders", status_code=201)
def post_reminder(
    body: ReminderWrite,
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.create_reminder(db, identity.user_id, body)


@router.patch("/reminders/{reminder_id}")
def patch_reminder(
    reminder_id: str,
    body: ReminderPatch,
    response: Response,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    return tracking.update_reminder(db, identity.user_id, reminder_id, body)


@router.delete("/reminders/{reminder_id}", status_code=204)
def remove_reminder(
    reminder_id: str,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> Response:
    tracking.delete_reminder(db, identity.user_id, reminder_id)
    return Response(status_code=204, headers={"Cache-Control": "no-store"})


@router.get("/reports/summary")
def read_report(
    response: Response,
    kind: str = "combined",
    range_days: int | None = None,
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> dict:
    _private(response)
    body = ReportRequest.model_validate({"kind": kind, "range_days": range_days, "start": start, "end": end})
    return tracking.build_report(db, identity.user_id, body)


@router.post("/reports/export")
def export_report(
    body: ReportRequest,
    db: Session = Depends(get_account_db),
    identity: Identity = Depends(get_identity),
) -> RawResponse:
    report = tracking.build_report(db, identity.user_id, body)
    headers = {"Cache-Control": "no-store", "Pragma": "no-cache"}
    if body.format == "pdf":
        headers["Content-Disposition"] = 'attachment; filename="herrise-tracking.pdf"'
        return RawResponse(content=tracking.report_pdf(report), media_type="application/pdf", headers=headers)
    headers["Content-Disposition"] = 'attachment; filename="herrise-tracking.csv"'
    return RawResponse(content=tracking.report_csv(report), media_type="text/csv; charset=utf-8", headers=headers)
