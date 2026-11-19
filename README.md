# HerRise Health

Capstone project, Department of Software Engineering, Daffodil International University.

## Layout

- `apps/web` — React app (not started)
- `apps/api` — FastAPI
- `infra` — Docker and local runtime files
- `docs` — team documents

## API health check

From `apps/api`, with the dependencies installed:

```bash
uvicorn app.main:app --reload --port 8000
```

`GET /health` returns `{"status": "ok"}`.
