from pathlib import Path


def test_phase3_migration_locks_health_tables():
    sql = Path(__file__).resolve().parents[3].joinpath("supabase/migrations/20261125100000_phase3_tracking.sql").read_text(encoding="utf-8").lower()
    for table in ("cycle_logs", "symptom_logs", "wellness_logs", "reminders"):
        assert f"alter table public.{table} enable row level security" in sql
        assert f"auth.uid() = user_id" in sql
    assert "references auth.users" in sql
    assert "symptom cycle must belong to the same user" in sql
    assert "password" not in sql
