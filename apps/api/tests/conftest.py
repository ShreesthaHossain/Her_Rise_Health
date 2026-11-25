import os
from pathlib import Path

os.environ.setdefault("SECRET_KEY", "test-secret-key-with-32-bytes-min")
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite:///" + str(Path(__file__).resolve().parent / "test_herrise.db"),
)
os.environ.setdefault(
    "ACCOUNT_DATABASE_URL",
    "sqlite:///" + str(Path(__file__).resolve().parent / "test_accounts.db"),
)
os.environ["SUPABASE_JWKS_URL"] = ""
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-supabase-jwt-secret-32bytes-min!")
os.environ.setdefault("SUPABASE_JWT_ISSUER", "http://127.0.0.1:54321/auth/v1")
os.environ.setdefault("SUPABASE_JWT_AUDIENCE", "authenticated")
os.environ.setdefault("APP_ENV", "test")
