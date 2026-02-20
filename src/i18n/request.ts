import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const messageLoaders: Record<(typeof routing.locales)[number], () => Promise<{ default: Record<string, unknown> }>> = {
  "pt-BR": () => import("../../messages/pt-BR.json"),
  "pt-PT": () => import("../../messages/pt-PT.json"),
  en: () => import("../../messages/en.json"),
  es: () => import("../../messages/es.json"),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const loader = messageLoaders[locale as (typeof routing.locales)[number]];
  const messages = loader ? (await loader()).default : (await messageLoaders[routing.defaultLocale]()).default;

  return {
    locale,
    messages,
  };
});
