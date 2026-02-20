import { type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

function parseAcceptLanguage(headerValue: string | null): string[] {
  if (!headerValue) return [];

  return headerValue
    .split(",")
    .map((part) => {
      const [tag, qSegment] = part.trim().split(";q=");
      const q = qSegment ? parseFloat(qSegment) : 1;
      return { tag: tag?.toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((item) => !!item.tag && item.q > 0)
    .sort((a, b) => b.q - a.q)
    .map((item) => item.tag as string);
}

function pickLocaleFromAcceptLanguage(headerValue: string | null) {
  const accepted = parseAcceptLanguage(headerValue);
  if (!accepted.length) return routing.defaultLocale;

  const locales = routing.locales;
  const exactMatchMap = new Map(locales.map((locale) => [locale.toLowerCase(), locale]));

  for (const tag of accepted) {
    const exact = exactMatchMap.get(tag);
    if (exact) return exact;
  }

  for (const tag of accepted) {
    const [language, region] = tag.split("-");

    if (language === "pt") {
      if (region === "pt") return "pt-PT";
      return "pt-BR";
    }

    if (language === "zh") {
      if (region === "hk") return "zh-HK";
      return "zh-CN";
    }

    const byLanguage = locales.find((locale) => locale.toLowerCase() === language);
    if (byLanguage) return byLanguage;
  }

  return routing.defaultLocale;
}

export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);

  if (sessionResponse.status >= 300 && sessionResponse.status < 400) {
    return sessionResponse;
  }

  const intlResponse = handleI18nRouting(request);

  if (!request.cookies.get("NEXT_LOCALE")) {
    const preferred = pickLocaleFromAcceptLanguage(request.headers.get("accept-language"));
    intlResponse.cookies.set("NEXT_LOCALE", preferred, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  sessionResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
