from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Facility
from app.schemas import FacilityOut

router = APIRouter(prefix="/facilities", tags=["facilities"])


@router.get("")
def list_facilities(
    district: str = "", facility_type: str = "", db: Session = Depends(get_db)
) -> list[FacilityOut]:
    stmt = select(Facility)
    if district.strip():
        stmt = stmt.where(Facility.district.ilike(district.strip()))
    if facility_type.strip():
        stmt = stmt.where(Facility.facility_type == facility_type.strip())
    rows = db.scalars(stmt.order_by(Facility.name)).all()
    return [
        FacilityOut(
            id=row.id,
            name=row.name,
            facility_type=row.facility_type,
            district=row.district,
            address=row.address,
            phone=row.phone,
            source=row.source,
            verified_at=row.verified_at,
        )
        for row in rows
    ]
