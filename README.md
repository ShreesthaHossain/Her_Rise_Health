# HerRise Health

Capstone project, Department of Software Engineering, Daffodil International University.

The app runs locally on SQLite. `infra/docker-compose.yml` is ready for PostgreSQL when Docker is installed.

## API

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

`GET /health` returns `{"status": "ok"}`.

## Web (current product)

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173. This Vite app has the working accounts, library, log, care list, and guided ask tool.

## Web (Phase 1 Next.js foundation)

```bash
cd apps/next
npm install
npm run dev
```

Open http://localhost:3000. The public site and dashboard shell are here. Sign-in uses Supabase Auth. Without the keys below, the forms stay closed and do not invent a session.

Copy `apps/next/.env.example` to `apps/next/.env.local`.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Use the publishable key, not the service-role key. In the Supabase dashboard, allow `http://localhost:3000/auth/callback` as a redirect URL.

## Phase 2 accounts

The Vite app keeps its own cookie login and SQLite health log. Phase 2 accounts live in Supabase and are a separate store.

1. Create a Supabase project.
2. Run `supabase/migrations/20261122160000_phase2_accounts.sql` in the SQL editor, or with `supabase db push`. The API does not apply this file on startup.
3. Copy `apps/api/.env.example` into `apps/api/.env` and set `SUPABASE_URL`, `SUPABASE_JWKS_URL`, `SUPABASE_JWT_ISSUER`, and `ACCOUNT_DATABASE_URL`.
4. The issuer is usually `https://<project>.supabase.co/auth/v1`. The JWKS URL is `https://<project>.supabase.co/auth/v1/.well-known/jwks.json`.
5. Set `ACCOUNT_DATABASE_URL` to the Supabase Postgres URI. That connection can bypass row level security, so every profile route also checks the verified user id.
6. Put `SUPABASE_SERVICE_ROLE_KEY` only in the API environment when an operator should be able to finish account deletion. The browser never receives it.

There is no default administrator. After the first user exists, grant admin in SQL:

```sql
insert into public.user_roles (user_id, role)
values ('<auth user uuid>', 'admin');
```

The account export includes the profile, preferences, consent history, and deletion request. It does not include cycle logs or symptom notes from the Vite database. A deletion request stays `requested` until the admin completion route deletes the Auth user and the owned account rows.

Row level security is defined in the migration. Two-user checks for the API are in `apps/api/tests/test_phase2.py`. A live Supabase project is still required before a real person can register.
