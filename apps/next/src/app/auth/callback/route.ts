import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth/redirect";

const otpTypes = new Set(["signup", "email", "recovery", "invite", "magiclink", "email_change"]);

function failureRedirect(origin: string, reason: string) {
  console.error(`auth callback: ${reason}`);
  const target = new URL("/login", origin);
  target.searchParams.set("error", /verifier/i.test(reason) ? "verifier" : "link");
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const providerError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (providerError) return failureRedirect(url.origin, providerError);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return failureRedirect(url.origin, "supabase is not configured");

  const cookieStore = await cookies();
  const pending: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pending.push({ name, value, options });
          try {
            cookieStore.set(name, value, options);
          } catch {
            // The redirect response carries the session cookies.
          }
        });
      },
    },
  });

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  let errorMessage: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    errorMessage = error?.message ?? null;
  } else if (tokenHash && type && otpTypes.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email" | "recovery" | "invite" | "magiclink" | "email_change",
    });
    errorMessage = error?.message ?? null;
  } else {
    errorMessage = "the link did not include a code";
  }

  if (errorMessage) return failureRedirect(url.origin, errorMessage);

  const response = NextResponse.redirect(new URL(next, url.origin));
  pending.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
