import json
from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import TypeDecorator

from app.models_account import AccountBase


class JsonValue(TypeDecorator):
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        payload = value if isinstance(value, dict) else {}
        if dialect.name == "postgresql":
            return payload
        return json.dumps(payload)

    def process_result_value(self, value, dialect):
        if isinstance(value, dict):
            return value
        if isinstance(value, str) and value:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        return {}


class CycleLog(AccountBase):
    __tablename__ = "cycle_logs"
    __table_args__ = (UniqueConstraint("user_id", "period_start", name="cycle_logs_one_start"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    flow_level: Mapped[str] = mapped_column(String(16))
    pain_level: Mapped[int] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SymptomLog(AccountBase):
    __tablename__ = "symptom_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    recorded_date: Mapped[date] = mapped_column(Date, index=True)
    category: Mapped[str] = mapped_column(String(40))
    severity: Mapped[int] = mapped_column(Integer)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cycle_log_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WellnessLog(AccountBase):
    __tablename__ = "wellness_logs"
    __table_args__ = (UniqueConstraint("user_id", "recorded_date", name="wellness_logs_one_day"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    recorded_date: Mapped[date] = mapped_column(Date)
    mood: Mapped[str] = mapped_column(String(16))
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_quality: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stress_level: Mapped[int] = mapped_column(Integer)
    energy_level: Mapped[int] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Reminder(AccountBase):
    __tablename__ = "reminders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    title: Mapped[str] = mapped_column(String(80))
    reminder_type: Mapped[str] = mapped_column(String(24))
    schedule_config: Mapped[dict] = mapped_column(JsonValue)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
