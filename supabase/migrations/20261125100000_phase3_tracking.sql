-- HerRise Health Phase 3 private tracking tables.
-- Apply in the Supabase SQL editor after the Phase 2 account migration.
-- The API does not run this file on startup.

create table if not exists public.cycle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start date not null,
  period_end date,
  flow_level text not null,
  pain_level integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cycle_logs_flow_check check (flow_level in ('light', 'medium', 'heavy')),
  constraint cycle_logs_pain_check check (pain_level between 0 and 10),
  constraint cycle_logs_end_check check (period_end is null or period_end >= period_start),
  constraint cycle_logs_one_start unique (user_id, period_start)
);

create index if not exists cycle_logs_user_idx on public.cycle_logs (user_id, period_start desc);

create table if not exists public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recorded_date date not null,
  category text not null,
  severity integer not null,
  duration_minutes integer,
  notes text,
  cycle_log_id uuid references public.cycle_logs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint symptom_logs_severity_check check (severity between 1 and 10),
  constraint symptom_logs_duration_check check (duration_minutes is null or duration_minutes >= 0),
  constraint symptom_logs_category_check check (
    category in (
      'menstrual_cramps',
      'headache',
      'fatigue',
      'abdominal_discomfort',
      'nausea',
      'mood_changes',
      'sleep',
      'other'
    )
  )
);

create index if not exists symptom_logs_user_idx on public.symptom_logs (user_id, recorded_date desc);

create table if not exists public.wellness_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recorded_date date not null,
  mood text not null,
  sleep_hours numeric(4, 1),
  sleep_quality integer,
  stress_level integer not null,
  energy_level integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wellness_logs_mood_check check (mood in ('very_low', 'low', 'neutral', 'good', 'very_good')),
  constraint wellness_logs_sleep_check check (sleep_hours is null or (sleep_hours >= 0 and sleep_hours <= 24)),
  constraint wellness_logs_quality_check check (sleep_quality is null or sleep_quality between 1 and 5),
  constraint wellness_logs_stress_check check (stress_level between 1 and 5),
  constraint wellness_logs_energy_check check (energy_level between 1 and 5),
  constraint wellness_logs_one_day unique (user_id, recorded_date)
);

create index if not exists wellness_logs_user_idx on public.wellness_logs (user_id, recorded_date desc);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  reminder_type text not null,
  schedule_config jsonb not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminders_type_check check (reminder_type in ('period', 'wellness', 'symptom', 'custom')),
  constraint reminders_title_check check (char_length(title) between 1 and 80)
);

create index if not exists reminders_user_idx on public.reminders (user_id);

create or replace function public.symptom_cycle_same_owner()
returns trigger
language plpgsql
as $$
begin
  if new.cycle_log_id is not null then
    if not exists (
      select 1 from public.cycle_logs
      where id = new.cycle_log_id and user_id = new.user_id
    ) then
      raise exception 'symptom cycle must belong to the same user';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists symptom_logs_same_owner on public.symptom_logs;
create trigger symptom_logs_same_owner
before insert or update on public.symptom_logs
for each row execute function public.symptom_cycle_same_owner();

drop trigger if exists cycle_logs_set_updated_at on public.cycle_logs;
create trigger cycle_logs_set_updated_at
before update on public.cycle_logs
for each row execute function public.set_updated_at();

drop trigger if exists symptom_logs_set_updated_at on public.symptom_logs;
create trigger symptom_logs_set_updated_at
before update on public.symptom_logs
for each row execute function public.set_updated_at();

drop trigger if exists wellness_logs_set_updated_at on public.wellness_logs;
create trigger wellness_logs_set_updated_at
before update on public.wellness_logs
for each row execute function public.set_updated_at();

drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at
before update on public.reminders
for each row execute function public.set_updated_at();

alter table public.cycle_logs enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.wellness_logs enable row level security;
alter table public.reminders enable row level security;

revoke all on public.cycle_logs from anon, authenticated;
revoke all on public.symptom_logs from anon, authenticated;
revoke all on public.wellness_logs from anon, authenticated;
revoke all on public.reminders from anon, authenticated;

grant select, insert, update, delete on public.cycle_logs to authenticated;
grant select, insert, update, delete on public.symptom_logs to authenticated;
grant select, insert, update, delete on public.wellness_logs to authenticated;
grant select, insert, update, delete on public.reminders to authenticated;

drop policy if exists cycle_logs_own on public.cycle_logs;
create policy cycle_logs_own on public.cycle_logs
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists symptom_logs_own on public.symptom_logs;
create policy symptom_logs_own on public.symptom_logs
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists wellness_logs_own on public.wellness_logs;
create policy wellness_logs_own on public.wellness_logs
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists reminders_own on public.reminders;
create policy reminders_own on public.reminders
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
