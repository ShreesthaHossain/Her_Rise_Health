-- HerRise Health Phase 2 accounts.
-- Apply this file in the Supabase SQL editor, or with the Supabase CLI:
--   supabase db push
-- Do not run it against the local SQLite file used by the Vite app.
-- It expects Supabase auth.users and is not executed by the API on startup.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  preferred_language text not null default 'bn',
  timezone text not null default 'Asia/Dhaka',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_language_check check (preferred_language in ('bn', 'en')),
  constraint profiles_timezone_check check (timezone in ('Asia/Dhaka', 'UTC')),
  constraint profiles_display_name_length check (char_length(display_name) <= 80)
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  theme text not null default 'light',
  notifications_enabled boolean not null default false,
  health_interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_theme_check check (theme in ('light', 'dark')),
  constraint user_preferences_interests_check check (
    health_interests <@ array[
      'menstrual_health',
      'general_wellness',
      'nutrition',
      'mental_wellness',
      'reproductive_education'
    ]::text[]
  )
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  consent_type text not null,
  policy_version text not null,
  consent_status text not null,
  recorded_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  constraint consent_type_check check (
    consent_type in ('terms', 'medical_disclaimer', 'optional_processing', 'age_eligibility')
  ),
  constraint consent_status_check check (consent_status in ('granted', 'withdrawn')),
  constraint consent_withdrawal_check check (
    (consent_status = 'granted' and withdrawn_at is null)
    or (consent_status = 'withdrawn' and withdrawn_at is not null)
  )
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint user_roles_role_check check (role in ('member', 'admin')),
  constraint user_roles_unique unique (user_id, role)
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  request_status text not null default 'requested',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint deletion_status_check check (
    request_status in ('requested', 'processing', 'completed', 'rejected')
  ),
  constraint deletion_completed_check check (
    (request_status = 'completed' and completed_at is not null)
    or (request_status <> 'completed' and completed_at is null)
  )
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  resource_type text not null,
  resource_id text,
  created_at timestamptz not null default now()
);

create index if not exists consent_records_user_idx on public.consent_records (user_id, recorded_at desc);
create index if not exists deletion_requests_user_idx on public.account_deletion_requests (user_id, requested_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists user_roles_user_idx on public.user_roles (user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists preferences_set_updated_at on public.user_preferences;
create trigger preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

create or replace function public.protect_profile_identity()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profile identity cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_identity on public.profiles;
create trigger profiles_protect_identity
before update on public.profiles
for each row execute function public.protect_profile_identity();

create or replace function public.prevent_consent_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'consent history is append-only';
end;
$$;

drop trigger if exists consent_records_append_only on public.consent_records;
create trigger consent_records_append_only
before update on public.consent_records
for each row execute function public.prevent_consent_update();

create or replace function public.prevent_role_self_assign()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    raise exception 'users cannot assign roles';
  end if;
  return new;
end;
$$;

drop trigger if exists user_roles_no_self_assign on public.user_roles;
create trigger user_roles_no_self_assign
before insert or update on public.user_roles
for each row execute function public.prevent_role_self_assign();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80)
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'member')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.consent_records enable row level security;
alter table public.user_roles enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.user_preferences from anon, authenticated;
revoke all on public.consent_records from anon, authenticated;
revoke all on public.user_roles from anon, authenticated;
revoke all on public.account_deletion_requests from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.user_preferences to authenticated;
grant select, insert on public.consent_records to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert on public.account_deletion_requests to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists preferences_select_own on public.user_preferences;
create policy preferences_select_own on public.user_preferences
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists preferences_insert_own on public.user_preferences;
create policy preferences_insert_own on public.user_preferences
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists preferences_update_own on public.user_preferences;
create policy preferences_update_own on public.user_preferences
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists consents_select_own on public.consent_records;
create policy consents_select_own on public.consent_records
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists consents_insert_own on public.consent_records;
create policy consents_insert_own on public.consent_records
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists roles_select_own on public.user_roles;
create policy roles_select_own on public.user_roles
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists deletions_select_own on public.account_deletion_requests;
create policy deletions_select_own on public.account_deletion_requests
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists deletions_insert_own on public.account_deletion_requests;
create policy deletions_insert_own on public.account_deletion_requests
for insert to authenticated
with check (auth.uid() = user_id and request_status = 'requested');
