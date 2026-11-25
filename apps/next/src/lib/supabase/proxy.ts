import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isCredentialPath, isProtectedPath, safeNext } from "@/lib/auth/redirect";

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

function redirectTo(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

async function onboardingState(token: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  try {
    const response = await fetch(`${base}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return "unknown" as const;
    const body = (await response.json()) as { onboarding_completed?: boolean };
    return body.onboarding_completed ? ("complete" as const) : ("incomplete" as const);
  } catch {
    return "unknown" as const;
  }
}

export async function updateSession(request: NextRequest) {
  // The email link is exchanged in the route handler. Refreshing the session
  // here deletes the one-time sign-up cookie before that exchange can read it.
  if (request.nextUrl.pathname === "/auth/callback") {
    return NextResponse.next({ request });
  }

  if (!configured()) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(
        redirectTo(request, "/login", { error: "config", next: request.nextUrl.pathname }),
      );
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const pathname = request.nextUrl.pathname;

  if (!user && isProtectedPath(pathname)) {
    return NextResponse.redirect(redirectTo(request, "/login", { next: pathname }));
  }

  if (user && isCredentialPath(pathname)) {
    return NextResponse.redirect(redirectTo(request, safeNext(request.nextUrl.searchParams.get("next"))));
  }

  if (user && (pathname.startsWith("/dashboard") || pathname === "/onboarding")) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const state = token ? await onboardingState(token) : "unknown";
    if (pathname.startsWith("/dashboard") && state === "incomplete") {
      return NextResponse.redirect(redirectTo(request, "/onboarding"));
    }
    if (pathname === "/onboarding" && state === "complete") {
      return NextResponse.redirect(redirectTo(request, "/dashboard"));
    }
  }

  return response;
}
