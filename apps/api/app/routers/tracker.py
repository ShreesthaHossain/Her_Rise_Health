from datetime import date
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import MenstrualLog, SymptomEntry, User
from app.schemas import CycleIn, CycleOut, SymptomOut
from app.schemas_tracking import CycleWrite
from app.services.tracking_access import open_bearer

router = APIRouter(tags=["tracker"])


def _own_cycle(db: Session, user: User, cycle_id: str) -> MenstrualLog:
    row = db.scalar(
        select(MenstrualLog).where(MenstrualLog.id == cycle_id, MenstrualLog.user_id == user.id)
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Log not found")
    return row


@router.get("/cycles")
def list_cycles(
    request: Request,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    opened = open_bearer(request)
    if opened is not None:
        identity, account = opened
        try:
            from app.services.tracking_service import list_cycles as phase3_list

            return phase3_list(account, identity.user_id, limit, offset)
        finally:
            account.close()
    user = get_current_user(request, db)
    rows = db.scalars(
        select(MenstrualLog).where(MenstrualLog.user_id == user.id).order_by(MenstrualLog.start_date.desc())
    ).all()
    return [
        CycleOut(id=row.id, start_date=row.start_date, end_date=row.end_date, flow=row.flow, note=row.note)
        for row in rows
    ]


@router.post("/cycles", status_code=201)
async def create_cycle(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    opened = open_bearer(request)
    if opened is not None:
        identity, account = opened
        try:
            try:
                phase_body = CycleWrite.model_validate(payload)
            except ValidationError as exc:
                raise RequestValidationError(exc.errors()) from None
            from app.services.tracking_service import create_cycle as phase3_create

            return phase3_create(account, identity.user_id, phase_body)
        finally:
            account.close()
    try:
        body = CycleIn.model_validate(payload)
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from None
    user = get_current_user(request, db)
    if body.end_date and body.end_date < body.start_date:
        raise HTTPException(status_code=422, detail="End date is before the start date")
    if (body.symptom_code is None) != (body.severity is None):
        raise HTTPException(status_code=422, detail="Symptom code and severity are saved together")
    row = MenstrualLog(
        id=str(uuid4()),
        user_id=user.id,
        start_date=body.start_date,
        end_date=body.end_date,
        flow=body.flow,
        note=body.note,
    )
    db.add(row)
    if body.symptom_code and body.severity:
        db.add(
            SymptomEntry(
                id=str(uuid4()),
                user_id=user.id,
                logged_on=body.start_date,
                code=body.symptom_code,
                severity=body.severity,
                note=body.note,
            )
        )
    db.commit()
    return CycleOut(id=row.id, start_date=row.start_date, end_date=row.end_date, flow=row.flow, note=row.note)


@router.delete("/cycles/{cycle_id}", status_code=204)
def delete_cycle(cycle_id: str, request: Request, db: Session = Depends(get_db)) -> Response:
    opened = open_bearer(request)
    if opened is not None:
        identity, account = opened
        try:
            from app.services.tracking_service import delete_cycle as phase3_delete

            phase3_delete(account, identity.user_id, cycle_id)
            return Response(status_code=204, headers={"Cache-Control": "no-store"})
        finally:
            account.close()
    user = get_current_user(request, db)
    row = _own_cycle(db, user, cycle_id)
    db.delete(row)
    db.commit()
    return Response(status_code=204)


@router.get("/symptoms")
def list_symptoms(
    request: Request,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str | None = None,
    start: date | None = None,
    end: date | None = None,
    q: str | None = None,
    sort: str = "recorded_date",
    direction: str = "desc",
):
    opened = open_bearer(request)
    if opened is not None:
        identity, account = opened
        try:
            from app.services.tracking_service import list_symptoms as phase3_symptoms

            return phase3_symptoms(
                account,
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
        finally:
            account.close()
    user = get_current_user(request, db)
    rows = db.scalars(
        select(SymptomEntry).where(SymptomEntry.user_id == user.id).order_by(SymptomEntry.logged_on.desc())
    ).all()
    return [
        SymptomOut(id=row.id, logged_on=row.logged_on, code=row.code, severity=row.severity, note=row.note)
        for row in rows
    ]
