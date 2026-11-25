from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.supabase_jwt import problem

_engine = None
_session_factory = None


def _require_url() -> str:
    if not settings.account_database_url:
        raise problem(503, "database_unconfigured", "ACCOUNT_DATABASE_URL is not set.")
    return settings.account_database_url


def account_engine():
    global _engine, _session_factory
    url = _require_url()
    if _engine is None:
        connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
        _engine = create_engine(url, connect_args=connect_args)
        if url.startswith("sqlite"):

            @event.listens_for(_engine, "connect")
            def _enable_fk(dbapi_connection, _record) -> None:
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()

        _session_factory = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
    return _engine


def open_account_session() -> Session:
    account_engine()
    return _session_factory()


def get_account_db() -> Generator[Session, None, None]:
    db = open_account_session()
    try:
        yield db
    finally:
        db.close()
