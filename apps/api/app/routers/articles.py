from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models import Article
from app.schemas import ArticleListItem, ArticleOut, SourceOut

router = APIRouter(prefix="/articles", tags=["articles"])


def _published():
    return select(Article).where(Article.status == "published")


@router.get("")
def list_articles(q: str = "", topic: str = "", db: Session = Depends(get_db)) -> list[ArticleListItem]:
    stmt = _published()
    if topic:
        stmt = stmt.where(Article.topic == topic)
    if q.strip():
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                Article.title_bn.ilike(like),
                Article.title_en.ilike(like),
            )
        )
    rows = db.scalars(stmt.order_by(Article.title_en)).all()
    return [
        ArticleListItem(slug=row.slug, title_bn=row.title_bn, title_en=row.title_en, topic=row.topic)
        for row in rows
    ]


@router.get("/{slug}")
def get_article(slug: str, db: Session = Depends(get_db)) -> ArticleOut:
    row = db.scalar(
        _published().where(Article.slug == slug).options(selectinload(Article.sources))
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return ArticleOut(
        slug=row.slug,
        title_bn=row.title_bn,
        title_en=row.title_en,
        body_bn=row.body_bn,
        body_en=row.body_en,
        topic=row.topic,
        sources=[SourceOut(citation=item.citation, url=item.url) for item in row.sources],
    )
