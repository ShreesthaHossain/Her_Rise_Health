from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Language = Literal["bn", "en"]
Theme = Literal["light", "dark"]
Timezone = Literal["Asia/Dhaka", "UTC"]
Interest = Literal[
    "menstrual_health",
    "general_wellness",
    "nutrition",
    "mental_wellness",
    "reproductive_education",
]
ConsentType = Literal["terms", "medical_disclaimer", "optional_processing", "age_eligibility"]
ConsentStatus = Literal["granted", "withdrawn"]


class ProfilePatch(BaseModel):
    model_config = ConfigDict(extra="ignore")

    display_name: str | None = Field(default=None, min_length=1, max_length=80)
    preferred_language: Language | None = None
    timezone: Timezone | None = None
    onboarding_completed: bool | None = None


class ProfileOut(BaseModel):
    id: str
    email: EmailStr | None
    display_name: str
    preferred_language: Language
    timezone: str
    onboarding_completed: bool
    role: Literal["member", "admin"]


class PreferencePatch(BaseModel):
    model_config = ConfigDict(extra="ignore")

    theme: Theme | None = None
    notifications_enabled: bool | None = None
    health_interests: list[Interest] | None = None


class PreferenceOut(BaseModel):
    theme: Theme
    notifications_enabled: bool
    health_interests: list[str]


class ConsentIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    consent_type: ConsentType
    policy_version: str = Field(min_length=1, max_length=40)
    consent_status: ConsentStatus


class ConsentOut(BaseModel):
    id: str
    consent_type: str
    policy_version: str
    consent_status: str
    recorded_at: datetime
    withdrawn_at: datetime | None


class DeletionIn(BaseModel):
    confirmation_email: EmailStr


class DeletionOut(BaseModel):
    id: str | None
    request_status: str | None
    requested_at: datetime | None
    completed_at: datetime | None
    identity_deleted: bool = False
