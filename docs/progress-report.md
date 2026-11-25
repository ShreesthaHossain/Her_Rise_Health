# HerRise Health — team progress report

Department of Software Engineering, Daffodil International University  
Capstone project  
Date checked: 25 November 2026

| Name | ID | GitHub evidence so far |
|---|---|---|
| Shreestha Pallabi Hossain | 232-35-668 | One local commit: “Add the API skeleton and project folders.” |
| Md. Gaddafi | 232-35-678 | No commit yet |
| Md. Rafsan | 232-35-676 | No commit yet |

Mentor: Md. Mahedi Hassan  
Repository: https://github.com/ShreesthaHossain/Her_Rise_Health.git

This is the team status. It is not an individual contribution report. Each student still has to write that report in their own words, and each student still has to commit the module they will defend.

## What was checked on this machine

The FastAPI server is running at http://localhost:8000. The Vite site is running at http://localhost:5173. Both use the local SQLite file `apps/api/herrise.db`.

These calls succeeded:

- `GET /health` returned `ok`.
- A registration with a bad email and a short password was rejected with HTTP 422.
- A new account was created. Passwords are hashed with Argon2. The app does not contain a fixed login.
- The account can read the published article “Menstrual health: what to know” from the database.
- A Dhaka search returned 8 facility rows. Phone numbers are empty until the team verifies them.
- A cycle from 1 November 2026 to 5 November 2026, flow medium, was saved, and a pain symptom at severity 2 was saved for that same user.

Local demo account, created only in this SQLite file:

- Email: `demo.herrise.1795553294@example.com`
- Password: `CycleLog1`
- Name: Demo Member

The registration page at http://localhost:5173/register opened in Bangla and shows name, email, and password fields. The Next.js site is also running at http://localhost:3000, but the live demonstration should use the Vite site. The Next.js tracker, symptoms, assistant, and doctor pages are still placeholders.

## Live demonstration script

Use two terminals.

```powershell
cd apps\api
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

```powershell
cd apps\web
npm run dev
```

Open http://localhost:5173.

1. Open Register. Submit an email that is not an email, or a password shorter than 8 characters, and show the rejection.
2. Register a new name, email, and password of at least 8 characters. The form then opens the home page for that user.
3. Sign out, then sign in with the same email and password.
4. Open the library. Search for `menstrual`. Open “Menstrual health: what to know”. The text comes from SQLite.
5. Open the log. Save a start date, an end date, a flow level, and a symptom. Show the saved row. That row is a new database record.
6. Open the care list. Leave the district as Dhaka and show the hospital rows. Say that phone numbers are not filled in.

Do not demonstrate the Next.js dashboard modules named period tracker, symptoms, or AI assistant. Those screens say the working tools are still in the Vite app. Email verification on the Next.js site is also not finished.

## Where the three features live

| Feature | Screen | API | Database |
|---|---|---|---|
| Registration and login | `apps/web/src/pages/AuthPage.tsx` | `apps/api/app/routers/auth.py` | `users` in SQLite. Password hash is Argon2 in `apps/api/app/core/security.py` |
| Health library | `apps/web/src/pages/LibraryPages.tsx` | `apps/api/app/routers/articles.py` | `articles` and article sources |
| Cycle and symptom log | `apps/web/src/pages/RecordPages.tsx` | `apps/api/app/routers/tracker.py` | `menstrual_logs` and `symptom_entries`, limited to the signed-in user |
| Care list | `apps/web/src/pages/CarePages.tsx` | `apps/api/app/routers/facilities.py` | `facilities` |

The guided ask tool exists, but it only matches urgent phrases. It is not one of the three features to rely on in the demo.

## Suggested module ownership

The repository does not record who wrote each file. This split is for the commits and the individual reports. Change it if the team agrees on a different split. The person who owns a module has to be able to explain it.

**Shreestha Pallabi Hossain** owns accounts on the newer site: Supabase registration and login, `apps/next/src/app/auth/callback/route.ts`, profile, consent, and the FastAPI token check in `apps/api/app/core/supabase_jwt.py` and `apps/api/app/routers/users.py`. She also owns the existing skeleton commit.

**Md. Gaddafi** owns the health log: `apps/web/src/pages/RecordPages.tsx` and `apps/api/app/routers/tracker.py`.

**Md. Rafsan** owns the library and the care list: `apps/web/src/pages/LibraryPages.tsx`, `apps/web/src/pages/CarePages.tsx`, `apps/api/app/routers/articles.py`, and `apps/api/app/routers/facilities.py`.

## What is still required before marks can be given

These steps cannot be done by one person on behalf of the others.

1. Each student commits only the files for their module, from their own GitHub account.
2. Push `main` to https://github.com/ShreesthaHossain/Her_Rise_Health.git. The work checked above is not in that history yet. A commit that stays on this laptop does not count.
3. Each student brings a printed individual report with a cover page, and submits the same report on BLC. The report has to be their own wording. Copying another student’s report, or submitting this file unchanged, scores zero.
4. In each report, name the AI tools that were actually used. Cursor was used to draft parts of the Next.js site and the Supabase account API. Each student should paste a few prompts they themselves sent.

## Newer account work, not part of tomorrow’s three features

The Next.js site and `supabase/migrations/20261122160000_phase2_accounts.sql` add a second account system: Supabase Auth, profiles, consent history, and row-level security. Automated tests for those rules passed against a test database. A real email link has not completed sign-in, and the API’s Supabase database address does not connect from this computer yet. Keep that work out of the graded demonstration until those two checks pass.
