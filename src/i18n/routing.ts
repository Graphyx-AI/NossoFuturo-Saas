import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: [
    "pt-BR",
    "pt-PT",
    "en",
    "es",
    "fr",
    "de",
    "it",
    "da-DK",
    "nb-NO",
    "sv-SE",
    "en-CA",
    "he-IL",
    "en-GB",
    "de-DE",
    "en-SG",
    "de-CH",
    "zh-CN",
    "zh-HK",
  ],
  defaultLocale: "pt-BR",
  localePrefix: "always",
});

// Locales currently reviewed for UI quality.
export const uiLocales = ["pt-BR", "pt-PT", "en", "es"] as const;
