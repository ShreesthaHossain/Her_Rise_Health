from datetime import date

from app.services.cycle_math import cycle_lengths, ranges_overlap, reminder_applies, summarize_cycles


def test_cycle_length_is_the_gap_between_starts():
    lengths = cycle_lengths([date(2026, 1, 1), date(2026, 1, 29), date(2026, 3, 2)])
    assert lengths == [28, 32]


def test_duplicate_starts_do_not_create_a_zero_day_cycle():
    assert cycle_lengths([date(2026, 1, 1), date(2026, 1, 1), date(2026, 1, 29)]) == [28]


def test_estimate_waits_for_three_gaps():
    summary = summarize_cycles([(date(2026, 1, 1), date(2026, 1, 5)), (date(2026, 1, 29), date(2026, 2, 2))], date(2026, 2, 10))
    assert summary["prediction"] is None
    assert summary["current_cycle_day"] == 13
    assert summary["average_cycle_length"] == 28
    assert summary["average_period_duration"] == 5


def test_estimate_is_a_window_not_a_single_day():
    spans = [
        (date(2026, 1, 1), date(2026, 1, 4)),
        (date(2026, 1, 29), date(2026, 2, 1)),
        (date(2026, 2, 26), date(2026, 3, 1)),
        (date(2026, 3, 28), date(2026, 3, 31)),
    ]
    summary = summarize_cycles(spans, date(2026, 4, 2))
    assert summary["prediction"]["based_on_cycles"] == 3
    assert summary["prediction"]["earliest"] <= summary["prediction"]["latest"]
    assert "not a recorded period" in summary["prediction"]["label"]


def test_overlap_detects_shared_days_and_ignores_a_gap():
    assert ranges_overlap(date(2026, 1, 1), date(2026, 1, 5), date(2026, 1, 5), date(2026, 1, 6))
    assert not ranges_overlap(date(2026, 1, 1), date(2026, 1, 4), date(2026, 1, 5), date(2026, 1, 8))


def test_weekly_reminder_uses_the_weekday_only():
    schedule = {"frequency": "weekly", "weekday": 0, "timezone": "Asia/Dhaka", "time": "09:00"}
    assert reminder_applies(schedule, date(2026, 11, 23))
    assert not reminder_applies(schedule, date(2026, 11, 24))
    assert reminder_applies({"frequency": "daily", "timezone": "Asia/Dhaka", "time": "09:00"}, date(2026, 11, 24))
