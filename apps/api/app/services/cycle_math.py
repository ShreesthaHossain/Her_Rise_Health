from datetime import date, timedelta
from statistics import mean, pstdev

MIN_INTERVALS = 3


def unique_starts(starts: list[date]) -> list[date]:
    return sorted(set(starts))


def cycle_lengths(starts: list[date]) -> list[int]:
    ordered = unique_starts(starts)
    return [(ordered[index] - ordered[index - 1]).days for index in range(1, len(ordered))]


def period_durations(spans: list[tuple[date, date | None]]) -> list[int]:
    durations: list[int] = []
    for start, end in spans:
        if end is None or end < start:
            continue
        durations.append((end - start).days + 1)
    return durations


def ranges_overlap(start: date, end: date | None, other_start: date, other_end: date | None) -> bool:
    own_end = end or start
    their_end = other_end or other_start
    return start <= their_end and other_start <= own_end


def summarize_cycles(spans: list[tuple[date, date | None]], today: date) -> dict:
    starts = unique_starts([start for start, _end in spans])
    lengths = cycle_lengths(starts)
    durations = period_durations(spans)
    last = starts[-1] if starts else None
    current_day = (today - last).days + 1 if last is not None and today >= last else None
    prediction = None
    note = "An estimate needs at least three recorded gaps between period start dates."
    if len(lengths) >= MIN_INTERVALS and last is not None:
        average = mean(lengths)
        spread = max(lengths) - min(lengths)
        uncertainty = max(2, round(pstdev(lengths)) if len(lengths) > 1 else 2, round(spread / 2))
        center = last + timedelta(days=round(average))
        prediction = {
            "earliest": (center - timedelta(days=uncertainty)).isoformat(),
            "latest": (center + timedelta(days=uncertainty)).isoformat(),
            "uncertainty_days": uncertainty,
            "based_on_cycles": len(lengths),
            "label": (
                "Estimate based on recorded start dates. This is not a recorded period, "
                "a fertility prediction, or contraception advice."
            ),
        }
        note = None
    return {
        "record_count": len(starts),
        "current_cycle_day": current_day,
        "last_period_start": last.isoformat() if last else None,
        "average_cycle_length": round(mean(lengths), 1) if lengths else None,
        "average_period_duration": round(mean(durations), 1) if durations else None,
        "cycle_length_variation": (max(lengths) - min(lengths)) if lengths else None,
        "cycle_lengths": lengths,
        "prediction": prediction,
        "prediction_note": note,
    }


def reminder_applies(schedule: dict, today: date) -> bool:
    if schedule.get("timezone") != "Asia/Dhaka":
        return False
    if schedule.get("frequency") == "daily":
        return True
    if schedule.get("frequency") == "weekly":
        return today.weekday() == schedule.get("weekday")
    return False
