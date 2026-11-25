from datetime import UTC, date, datetime, timedelta
from uuid import uuid4
from zoneinfo import ZoneInfo

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.supabase_jwt import problem
from app.models_tracking import CycleLog, Reminder, SymptomLog, WellnessLog
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
from app.services.cycle_math import ranges_overlap, reminder_applies, summarize_cycles

DHAKA = ZoneInfo("Asia/Dhaka")
SAFETY_NOTICE = {
    "clinician_reviewed": False,
    "message": (
        "If a symptom is severe, persistent, worsening, or worrying, contact a clinician or a hospital. "
        "This journal describes what you wrote. It does not triage symptoms and it does not detect PCOS or any other condition."
    ),
}


def dhaka_today() -> date:
    return datetime.now(DHAKA).date()


def _now() -> datetime:
    return datetime.now(UTC)


def _iso(value: date | datetime | None) -> str | None:
    return value.isoformat() if value is not None else None


def _page(limit: int, offset: int) -> tuple[int, int]:
    return max(1, min(limit, 100)), max(0, offset)


def _own_cycle(db: Session, user_id: str, cycle_id: str) -> CycleLog:
    row = db.scalar(select(CycleLog).where(CycleLog.id == cycle_id, CycleLog.user_id == user_id))
    if row is None:
        raise problem(404, "not_found", "Record not found")
    return row


def _reject_overlap(db: Session, user_id: str, start: date, end: date | None, ignore_id: str | None) -> None:
    rows = db.scalars(select(CycleLog).where(CycleLog.user_id == user_id)).all()
    for row in rows:
        if ignore_id and row.id == ignore_id:
            continue
        if row.period_start == start:
            raise problem(409, "duplicate_start", "A period with this start date is already saved.")
        if ranges_overlap(start, end, row.period_start, row.period_end):
            raise problem(409, "overlap", "This period overlaps a record already saved on this account.")


def cycle_out(row: CycleLog) -> dict:
    return {
        "id": row.id,
        "period_start": row.period_start.isoformat(),
        "period_end": _iso(row.period_end),
        "flow_level": row.flow_level,
        "pain_level": row.pain_level,
        "notes": row.notes,
        "created_at": _iso(row.created_at),
        "updated_at": _iso(row.updated_at),
    }


def list_cycles(db: Session, user_id: str, limit: int, offset: int) -> dict:
    limit, offset = _page(limit, offset)
    rows = db.scalars(
        select(CycleLog).where(CycleLog.user_id == user_id).order_by(CycleLog.period_start.desc())
    ).all()
    page = rows[offset : offset + limit]
    return {"items": [cycle_out(row) for row in page], "limit": limit, "offset": offset, "total": len(rows)}


def create_cycle(db: Session, user_id: str, body: CycleWrite) -> dict:
    _reject_overlap(db, user_id, body.period_start, body.period_end, None)
    now = _now()
    row = CycleLog(
        id=str(uuid4()),
        user_id=user_id,
        period_start=body.period_start,
        period_end=body.period_end,
        flow_level=body.flow_level,
        pain_level=body.pain_level,
        notes=body.notes,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return cycle_out(row)


def update_cycle(db: Session, user_id: str, cycle_id: str, body: CyclePatch) -> dict:
    row = _own_cycle(db, user_id, cycle_id)
    start = body.period_start or row.period_start
    end = row.period_end if body.period_end is None else body.period_end
    if end is not None and end < start:
        raise problem(422, "invalid_dates", "End date is before the start date")
    _reject_overlap(db, user_id, start, end, row.id)
    row.period_start = start
    row.period_end = end
    if body.flow_level is not None:
        row.flow_level = body.flow_level
    if body.pain_level is not None:
        row.pain_level = body.pain_level
    if body.notes is not None:
        row.notes = body.notes
    row.updated_at = _now()
    db.commit()
    db.refresh(row)
    return cycle_out(row)


def delete_cycle(db: Session, user_id: str, cycle_id: str) -> None:
    row = _own_cycle(db, user_id, cycle_id)
    linked = db.scalars(select(SymptomLog).where(SymptomLog.user_id == user_id, SymptomLog.cycle_log_id == row.id)).all()
    for symptom in linked:
        symptom.cycle_log_id = None
        symptom.updated_at = _now()
    db.delete(row)
    db.commit()


def cycle_summary(db: Session, user_id: str, today: date | None = None) -> dict:
    rows = db.scalars(select(CycleLog).where(CycleLog.user_id == user_id)).all()
    summary = summarize_cycles([(row.period_start, row.period_end) for row in rows], today or dhaka_today())
    summary["disclaimer"] = (
        "Counts use only periods saved on this account. Estimates are not a diagnosis, "
        "a fertility reading, or contraception advice."
    )
    return summary


def _own_symptom(db: Session, user_id: str, symptom_id: str) -> SymptomLog:
    row = db.scalar(select(SymptomLog).where(SymptomLog.id == symptom_id, SymptomLog.user_id == user_id))
    if row is None:
        raise problem(404, "not_found", "Record not found")
    return row


def _same_user_cycle(db: Session, user_id: str, cycle_id: str | None) -> None:
    if not cycle_id:
        return
    if db.scalar(select(CycleLog.id).where(CycleLog.id == cycle_id, CycleLog.user_id == user_id)) is None:
        raise problem(422, "foreign_cycle", "That period record is not on this account.")


def symptom_out(row: SymptomLog) -> dict:
    return {
        "id": row.id,
        "recorded_date": row.recorded_date.isoformat(),
        "category": row.category,
        "severity": row.severity,
        "duration_minutes": row.duration_minutes,
        "notes": row.notes,
        "cycle_log_id": row.cycle_log_id,
        "created_at": _iso(row.created_at),
        "updated_at": _iso(row.updated_at),
    }


def list_symptoms(
    db: Session,
    user_id: str,
    *,
    limit: int,
    offset: int,
    category: str | None,
    start: date | None,
    end: date | None,
    query: str | None,
    sort: str,
    direction: str,
) -> dict:
    limit, offset = _page(limit, offset)
    stmt = select(SymptomLog).where(SymptomLog.user_id == user_id)
    if category:
        stmt = stmt.where(SymptomLog.category == category)
    if start:
        stmt = stmt.where(SymptomLog.recorded_date >= start)
    if end:
        stmt = stmt.where(SymptomLog.recorded_date <= end)
    if query and query.strip():
        stmt = stmt.where(SymptomLog.notes.ilike(f"%{query.strip()}%"))
    column = SymptomLog.severity if sort == "severity" else SymptomLog.recorded_date
    stmt = stmt.order_by(column.asc() if direction == "asc" else column.desc())
    rows = db.scalars(stmt).all()
    page = rows[offset : offset + limit]
    return {"items": [symptom_out(row) for row in page], "limit": limit, "offset": offset, "total": len(rows)}


def create_symptom(db: Session, user_id: str, body: SymptomWrite) -> dict:
    _same_user_cycle(db, user_id, body.cycle_log_id)
    now = _now()
    row = SymptomLog(
        id=str(uuid4()),
        user_id=user_id,
        recorded_date=body.recorded_date,
        category=body.category,
        severity=body.severity,
        duration_minutes=body.duration_minutes,
        notes=body.notes,
        cycle_log_id=body.cycle_log_id,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return symptom_out(row)


def update_symptom(db: Session, user_id: str, symptom_id: str, body: SymptomPatch) -> dict:
    row = _own_symptom(db, user_id, symptom_id)
    if body.cycle_log_id is not None:
        _same_user_cycle(db, user_id, body.cycle_log_id)
        row.cycle_log_id = body.cycle_log_id
    if body.recorded_date is not None:
        row.recorded_date = body.recorded_date
    if body.category is not None:
        row.category = body.category
    if body.severity is not None:
        row.severity = body.severity
    if body.duration_minutes is not None:
        row.duration_minutes = body.duration_minutes
    if body.notes is not None:
        row.notes = body.notes
    row.updated_at = _now()
    db.commit()
    db.refresh(row)
    return symptom_out(row)


def delete_symptom(db: Session, user_id: str, symptom_id: str) -> None:
    db.delete(_own_symptom(db, user_id, symptom_id))
    db.commit()


def symptom_trends(db: Session, user_id: str) -> dict:
    rows = db.scalars(
        select(SymptomLog).where(SymptomLog.user_id == user_id).order_by(SymptomLog.recorded_date.asc())
    ).all()
    counts: dict[str, int] = {}
    for row in rows:
        counts[row.category] = counts.get(row.category, 0) + 1
    average = round(sum(row.severity for row in rows) / len(rows), 1) if rows else None
    return {
        "total": len(rows),
        "average_severity": average,
        "frequency": [{"category": key, "count": value} for key, value in sorted(counts.items(), key=lambda item: -item[1])],
        "points": [
            {"recorded_date": row.recorded_date.isoformat(), "category": row.category, "severity": row.severity}
            for row in rows
        ],
        "safety": SAFETY_NOTICE,
    }


def _own_wellness(db: Session, user_id: str, wellness_id: str) -> WellnessLog:
    row = db.scalar(select(WellnessLog).where(WellnessLog.id == wellness_id, WellnessLog.user_id == user_id))
    if row is None:
        raise problem(404, "not_found", "Record not found")
    return row


def wellness_out(row: WellnessLog) -> dict:
    return {
        "id": row.id,
        "recorded_date": row.recorded_date.isoformat(),
        "mood": row.mood,
        "sleep_hours": row.sleep_hours,
        "sleep_quality": row.sleep_quality,
        "stress_level": row.stress_level,
        "energy_level": row.energy_level,
        "notes": row.notes,
        "created_at": _iso(row.created_at),
        "updated_at": _iso(row.updated_at),
    }


def list_wellness(db: Session, user_id: str, limit: int, offset: int, start: date | None, end: date | None) -> dict:
    limit, offset = _page(limit, offset)
    stmt = select(WellnessLog).where(WellnessLog.user_id == user_id)
    if start:
        stmt = stmt.where(WellnessLog.recorded_date >= start)
    if end:
        stmt = stmt.where(WellnessLog.recorded_date <= end)
    rows = db.scalars(stmt.order_by(WellnessLog.recorded_date.desc())).all()
    page = rows[offset : offset + limit]
    return {"items": [wellness_out(row) for row in page], "limit": limit, "offset": offset, "total": len(rows)}


def create_wellness(db: Session, user_id: str, body: WellnessWrite) -> dict:
    existing = db.scalar(
        select(WellnessLog).where(WellnessLog.user_id == user_id, WellnessLog.recorded_date == body.recorded_date)
    )
    if existing is not None:
        raise problem(409, "duplicate_day", "A check-in for this date is already saved. Edit that entry.")
    now = _now()
    row = WellnessLog(
        id=str(uuid4()),
        user_id=user_id,
        recorded_date=body.recorded_date,
        mood=body.mood,
        sleep_hours=body.sleep_hours,
        sleep_quality=body.sleep_quality,
        stress_level=body.stress_level,
        energy_level=body.energy_level,
        notes=body.notes,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return wellness_out(row)


def update_wellness(db: Session, user_id: str, wellness_id: str, body: WellnessPatch) -> dict:
    row = _own_wellness(db, user_id, wellness_id)
    if body.recorded_date is not None and body.recorded_date != row.recorded_date:
        clash = db.scalar(
            select(WellnessLog).where(
                WellnessLog.user_id == user_id,
                WellnessLog.recorded_date == body.recorded_date,
                WellnessLog.id != row.id,
            )
        )
        if clash is not None:
            raise problem(409, "duplicate_day", "A check-in for this date is already saved.")
        row.recorded_date = body.recorded_date
    for field in ("mood", "sleep_hours", "sleep_quality", "stress_level", "energy_level", "notes"):
        value = getattr(body, field)
        if value is not None:
            setattr(row, field, value)
    row.updated_at = _now()
    db.commit()
    db.refresh(row)
    return wellness_out(row)


def delete_wellness(db: Session, user_id: str, wellness_id: str) -> None:
    db.delete(_own_wellness(db, user_id, wellness_id))
    db.commit()


def wellness_summary(db: Session, user_id: str) -> dict:
    rows = db.scalars(
        select(WellnessLog).where(WellnessLog.user_id == user_id).order_by(WellnessLog.recorded_date.asc())
    ).all()
    recent = rows[-14:]
    sleep = [row.sleep_hours for row in recent if row.sleep_hours is not None]
    return {
        "total": len(rows),
        "points": [wellness_out(row) for row in recent],
        "average_sleep_hours": round(sum(sleep) / len(sleep), 1) if sleep else None,
        "disclaimer": "These are the check-ins you saved. They are not a mood disorder score or a diagnosis.",
    }


def reminder_out(row: Reminder, today: date) -> dict:
    schedule = row.schedule_config or {}
    return {
        "id": row.id,
        "title": row.title,
        "reminder_type": row.reminder_type,
        "schedule_config": schedule,
        "enabled": row.enabled,
        "on_todays_list": bool(row.enabled and reminder_applies(schedule, today)),
        "delivery": "in_app",
        "delivery_note": "Shown in the app only. HerRise does not email or push this reminder.",
        "created_at": _iso(row.created_at),
        "updated_at": _iso(row.updated_at),
    }


def list_reminders(db: Session, user_id: str, today: date | None = None) -> dict:
    current = today or dhaka_today()
    rows = db.scalars(select(Reminder).where(Reminder.user_id == user_id).order_by(Reminder.created_at.desc())).all()
    return {"items": [reminder_out(row, current) for row in rows], "timezone": "Asia/Dhaka"}


def create_reminder(db: Session, user_id: str, body: ReminderWrite) -> dict:
    now = _now()
    row = Reminder(
        id=str(uuid4()),
        user_id=user_id,
        title=body.title.strip(),
        reminder_type=body.reminder_type,
        schedule_config=body.schedule_config.model_dump(),
        enabled=body.enabled,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return reminder_out(row, dhaka_today())


def update_reminder(db: Session, user_id: str, reminder_id: str, body: ReminderPatch) -> dict:
    row = db.scalar(select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user_id))
    if row is None:
        raise problem(404, "not_found", "Record not found")
    if body.title is not None:
        row.title = body.title.strip()
    if body.reminder_type is not None:
        row.reminder_type = body.reminder_type
    if body.schedule_config is not None:
        row.schedule_config = body.schedule_config.model_dump()
    if body.enabled is not None:
        row.enabled = body.enabled
    row.updated_at = _now()
    db.commit()
    db.refresh(row)
    return reminder_out(row, dhaka_today())


def delete_reminder(db: Session, user_id: str, reminder_id: str) -> None:
    row = db.scalar(select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user_id))
    if row is None:
        raise problem(404, "not_found", "Record not found")
    db.delete(row)
    db.commit()


def report_window(body: ReportRequest, today: date | None = None) -> tuple[date, date]:
    current = today or dhaka_today()
    if body.range_days:
        return current - timedelta(days=body.range_days - 1), current
    assert body.start is not None and body.end is not None
    return body.start, body.end


def build_report(db: Session, user_id: str, body: ReportRequest) -> dict:
    start, end = report_window(body)
    cycles = []
    symptoms = []
    wellness = []
    if body.kind in ("cycle", "combined"):
        cycles = db.scalars(
            select(CycleLog)
            .where(CycleLog.user_id == user_id, CycleLog.period_start <= end)
            .where(or_(CycleLog.period_end.is_(None), CycleLog.period_end >= start))
            .order_by(CycleLog.period_start.asc())
        ).all()
        cycles = [row for row in cycles if row.period_start >= start or (row.period_end or row.period_start) >= start]
    if body.kind in ("symptom", "combined"):
        symptoms = db.scalars(
            select(SymptomLog)
            .where(SymptomLog.user_id == user_id, SymptomLog.recorded_date >= start, SymptomLog.recorded_date <= end)
            .order_by(SymptomLog.recorded_date.asc())
        ).all()
    if body.kind in ("wellness", "combined"):
        wellness = db.scalars(
            select(WellnessLog)
            .where(WellnessLog.user_id == user_id, WellnessLog.recorded_date >= start, WellnessLog.recorded_date <= end)
            .order_by(WellnessLog.recorded_date.asc())
        ).all()
    return {
        "kind": body.kind,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "timezone": "Asia/Dhaka",
        "cycles": [cycle_out(row) for row in cycles],
        "symptoms": [symptom_out(row) for row in symptoms],
        "wellness": [wellness_out(row) for row in wellness],
        "cycle_summary": summarize_cycles([(row.period_start, row.period_end) for row in cycles], end) if cycles else None,
        "limitations": (
            "This summary lists records you saved in the selected dates. "
            "It is educational tracking, not a diagnosis or a clinical interpretation."
        ),
    }


def report_csv(report: dict) -> str:
    lines = ["section,date,detail"]
    for row in report["cycles"]:
        lines.append(f"period,{row['period_start']},flow {row['flow_level']}; pain {row['pain_level']}")
    for row in report["symptoms"]:
        lines.append(f"symptom,{row['recorded_date']},{row['category']}; severity {row['severity']}")
    for row in report["wellness"]:
        lines.append(f"wellness,{row['recorded_date']},mood {row['mood']}; stress {row['stress_level']}")
    lines.append(f"note,{report['start']},{report['limitations']}")
    return "\n".join(lines) + "\n"


def report_pdf(report: dict) -> bytes:
    lines = [
        "HerRise Health tracking summary",
        f"{report['start']} to {report['end']} (Asia/Dhaka)",
        report["limitations"],
        f"Period records: {len(report['cycles'])}",
        f"Symptom records: {len(report['symptoms'])}",
        f"Wellness records: {len(report['wellness'])}",
    ]
    for row in report["cycles"][:40]:
        lines.append(f"Period {row['period_start']} flow {row['flow_level']} pain {row['pain_level']}")
    for row in report["symptoms"][:40]:
        lines.append(f"Symptom {row['recorded_date']} {row['category']} severity {row['severity']}")
    for row in report["wellness"][:40]:
        lines.append(f"Check-in {row['recorded_date']} mood {row['mood']}")
    safe = []
    for line in lines:
        text = line.encode("latin-1", "replace").decode("latin-1").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        safe.append(text[:110])
    commands = ["BT /F1 11 Tf 48 800 Td 14 TL"]
    for line in safe:
        commands.append(f"({line}) '")
    commands.append("ET")
    stream = "\n".join(commands).encode("latin-1")
    objects = [
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
        b"2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n",
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
        b"4 0 obj << /Length " + str(len(stream)).encode() + b" >> stream\n" + stream + b"\nendstream endobj\n",
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    ]
    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for item in objects:
        offsets.append(len(output))
        output.extend(item)
    xref = len(output)
    output.extend(f"xref\n0 {len(offsets)}\n".encode())
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode())
    output.extend(f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode())
    return bytes(output)
