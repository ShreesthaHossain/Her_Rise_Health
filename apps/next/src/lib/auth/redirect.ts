export function safeNext(value: string | null, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("://") || value.includes("\\")) return fallback;
  return value;
}

export function isProtectedPath(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname === "/onboarding";
}

export function isCredentialPath(pathname: string) {
  return pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
}
