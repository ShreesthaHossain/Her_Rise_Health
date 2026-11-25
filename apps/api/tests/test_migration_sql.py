from pathlib import Path


def migration() -> str:
    root = Path(__file__).resolve().parents[3]
    return (root / "supabase" / "migrations" / "20261122160000_phase2_accounts.sql").read_text(encoding="utf-8")


def test_migration_locks_down_private_tables():
    sql = migration().lower()
    assert "password" not in sql
    for table in (
        "profiles",
        "user_preferences",
        "consent_records",
        "user_roles",
        "account_deletion_requests",
        "audit_logs",
    ):
        assert f"alter table public.{table} enable row level security" in sql
    assert "auth.uid() = id" in sql
    assert "auth.uid() = user_id" in sql
    assert "consent history is append-only" in sql
    assert "users cannot assign roles" in sql
    assert "on delete cascade" in sql
    assert "on conflict (id) do nothing" in sql
    assert "references auth.users" in sql
    assert "revoke all on public.audit_logs" in sql
