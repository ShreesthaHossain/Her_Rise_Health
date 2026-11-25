from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import ConsentRecord, User, WarningRule
from app.schemas import ChatIn, ChatOut

router = APIRouter(prefix="/chat", tags=["chat"])


def match_warning(db: Session, text: str) -> WarningRule | None:
    lowered = text.casefold()
    rules = db.scalars(select(WarningRule)).all()
    for rule in rules:
        for phrase in rule.phrases():
            if phrase.casefold() in lowered:
                return rule
    return None


@router.post("")
def chat(
    body: ChatIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> ChatOut:
    consent = db.scalar(
        select(ConsentRecord).where(
            ConsentRecord.user_id == user.id, ConsentRecord.purpose == "ai_assist"
        )
    )
    if consent is None:
        raise HTTPException(status_code=403, detail="Accept the assistant consent before asking")
    rule = match_warning(db, body.message)
    if rule is None:
        return ChatOut(
            kind="unavailable",
            message_bn="সহকারী এখন শুধু জরুরি বাক্য ও ওষুধের অনুরোধ চিনতে পারে। লাইব্রেরির নিবন্ধ পড়ুন।",
            message_en="The assistant currently recognizes urgent wording and medicine requests only. Read an article in the library.",
        )
    kind = "escalation" if rule.code == "urgent_care" else "refusal"
    return ChatOut(kind=kind, message_bn=rule.message_bn, message_en=rule.message_en)
