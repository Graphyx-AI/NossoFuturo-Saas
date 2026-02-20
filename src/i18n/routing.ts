import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-BR", "pt-PT", "en", "es"],
  defaultLocale: "pt-BR",
  localePrefix: "always",
});
