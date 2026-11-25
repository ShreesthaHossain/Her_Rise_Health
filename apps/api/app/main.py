from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import account, admin, consents, preferences, users

app = FastAPI(title="HerRise Health API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = FastAPI()
api.include_router(users.router)
api.include_router(preferences.router)
api.include_router(consents.router)
api.include_router(account.router)
api.include_router(admin.router)
app.mount("/api/v1", api)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
