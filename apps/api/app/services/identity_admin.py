import httpx

from app.core.config import settings


def delete_auth_user(user_id: str) -> bool:
    """Delete the Supabase Auth user with the server-only service role key.

    Returns False when that key is not configured. The key is never returned
    to the browser.
    """
    if not settings.supabase_service_role_key or not settings.supabase_url:
        return False
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users/{user_id}"
    response = httpx.delete(
        url,
        headers={
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "apikey": settings.supabase_service_role_key,
        },
        timeout=10,
    )
    return response.status_code in (200, 204)
