import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { assertSupabaseConfigIsSafe } from "@/lib/supabase/config";

function getPathWithoutLocale(pathname: string): { path: string; locale: string | null } {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && routing.locales.includes(first as (typeof routing.locales)[number])) {
    return {
      path: "/" + segments.slice(1).join("/"),
      locale: first,
    };
  }
  return { path: pathname, locale: null };
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.next({ request });
  }

  assertSupabaseConfigIsSafe(url, key);

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const { path, locale } = getPathWithoutLocale(pathname);
  const prefix = locale ? `/${locale}` : "";
  const hasOnboardCookie = request.cookies.get("nf_onboard")?.value === "1";

  if (!user && path.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}/login`;
    return NextResponse.redirect(url);
  }

  if (!user && path.startsWith("/onboarding")) {
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}/login`;
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (path === "/" ||
      path === "" ||
      path.startsWith("/login") ||
      path.startsWith("/register") ||
      path.startsWith("/forgot-password"))
  ) {
    let onboardingComplete = hasOnboardCookie;
    if (!hasOnboardCookie) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", user.id)
        .single();
      onboardingComplete = !!profile?.onboarding_completed_at;
      if (onboardingComplete) {
        response.cookies.set("nf_onboard", "1", {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: false,
          sameSite: "lax",
        });
      }
    }
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}${onboardingComplete ? "/dashboard" : "/onboarding"}`;
    return NextResponse.redirect(url);
  }

  if (user && path.startsWith("/onboarding")) {
    let onboardingComplete = hasOnboardCookie;
    if (!hasOnboardCookie) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", user.id)
        .single();
      onboardingComplete = !!profile?.onboarding_completed_at;
    }
    if (onboardingComplete) {
      const url = request.nextUrl.clone();
      url.pathname = `${prefix}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  // Bloqueia uso do app sem assinatura Pro: redireciona para settings para assinar
  if (user && path.startsWith("/dashboard") && !path.startsWith("/dashboard/settings")) {
    let workspaceId = request.cookies.get("workspace_id")?.value;
    if (!workspaceId) {
      const { data: members } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .not("accepted_at", "is", null)
        .limit(1);
      workspaceId = members?.[0]?.workspace_id;
    }
    if (workspaceId) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("plan, stripe_subscription_id")
        .eq("id", workspaceId)
        .single();
      if (ws && !ws.stripe_subscription_id) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = `${prefix}/dashboard/settings`;
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}
