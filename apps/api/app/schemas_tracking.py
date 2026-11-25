from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator

Flow = Literal["light", "medium", "heavy"]
SymptomCategory = Literal[
    "menstrual_cramps",
    "headache",
    "fatigue",
    "abdominal_discomfort",
    "nausea",
    "mood_changes",
    "sleep",
    "other",
]
Mood = Literal["very_low", "low", "neutral", "good", "very_good"]
ReminderType = Literal["period", "wellness", "symptom", "custom"]
ReportKind = Literal["cycle", "symptom", "wellness", "combined"]
ReportFormat = Literal["csv", "pdf"]


class CycleWrite(BaseModel):
    period_start: date
    period_end: date | None = None
    flow_level: Flow
    pain_level: int = Field(ge=0, le=10)
    notes: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def end_on_or_after_start(self):
        if self.period_end is not None and self.period_end < self.period_start:
            raise ValueError("End date is before the start date")
        return self


class CyclePatch(BaseModel):
    period_start: date | None = None
    period_end: date | None = None
    flow_level: Flow | None = None
    pain_level: int | None = Field(default=None, ge=0, le=10)
    notes: str | None = Field(default=None, max_length=2000)


class SymptomWrite(BaseModel):
    recorded_date: date
    category: SymptomCategory
    severity: int = Field(ge=1, le=10)
    duration_minutes: int | None = Field(default=None, ge=0, le=7 * 24 * 60)
    notes: str | None = Field(default=None, max_length=2000)
    cycle_log_id: str | None = None


class SymptomPatch(BaseModel):
    recorded_date: date | None = None
    category: SymptomCategory | None = None
    severity: int | None = Field(default=None, ge=1, le=10)
    duration_minutes: int | None = Field(default=None, ge=0, le=7 * 24 * 60)
    notes: str | None = Field(default=None, max_length=2000)
    cycle_log_id: str | None = None


class WellnessWrite(BaseModel):
    recorded_date: date
    mood: Mood
    sleep_hours: float | None = Field(default=None, ge=0, le=24)
    sleep_quality: int | None = Field(default=None, ge=1, le=5)
    stress_level: int = Field(ge=1, le=5)
    energy_level: int = Field(ge=1, le=5)
    notes: str | None = Field(default=None, max_length=2000)


class WellnessPatch(BaseModel):
    recorded_date: date | None = None
    mood: Mood | None = None
    sleep_hours: float | None = Field(default=None, ge=0, le=24)
    sleep_quality: int | None = Field(default=None, ge=1, le=5)
    stress_level: int | None = Field(default=None, ge=1, le=5)
    energy_level: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = Field(default=None, max_length=2000)


class ScheduleConfig(BaseModel):
    frequency: Literal["daily", "weekly"]
    time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    weekday: int | None = Field(default=None, ge=0, le=6)
    timezone: Literal["Asia/Dhaka"] = "Asia/Dhaka"

    @model_validator(mode="after")
    def weekly_day(self):
        if self.frequency == "weekly" and self.weekday is None:
            raise ValueError("Choose a weekday for a weekly reminder")
        return self


class ReminderWrite(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    reminder_type: ReminderType
    schedule_config: ScheduleConfig
    enabled: bool = True


class ReminderPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=80)
    reminder_type: ReminderType | None = None
    schedule_config: ScheduleConfig | None = None
    enabled: bool | None = None


class ReportRequest(BaseModel):
    kind: ReportKind = "combined"
    range_days: Literal[7, 30, 90] | None = None
    start: date | None = None
    end: date | None = None
    format: ReportFormat = "csv"

    @model_validator(mode="after")
    def has_a_range(self):
        if self.range_days is None and (self.start is None or self.end is None):
            raise ValueError("Choose a preset range or a start and end date")
        if self.start is not None and self.end is not None and self.end < self.start:
            raise ValueError("End date is before the start date")
        return self
