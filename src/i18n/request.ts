import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

type Messages = Record<string, unknown>;

const messageLoaders: Record<(typeof routing.locales)[number], () => Promise<{ default: Messages }>> = {
  "pt-BR": () => import("../../messages/pt-BR.json"),
  "pt-PT": () => import("../../messages/pt-PT.json"),
  en: () => import("../../messages/en.json"),
  es: () => import("../../messages/es.json"),
  fr: () => import("../../messages/fr.json"),
  de: () => import("../../messages/de.json"),
  it: () => import("../../messages/it.json"),
  "da-DK": () => import("../../messages/da-DK.json"),
  "nb-NO": () => import("../../messages/nb-NO.json"),
  "sv-SE": () => import("../../messages/sv-SE.json"),
  "en-CA": () => import("../../messages/en-CA.json"),
  "he-IL": () => import("../../messages/he-IL.json"),
  "en-GB": () => import("../../messages/en-GB.json"),
  "de-DE": () => import("../../messages/de-DE.json"),
  "en-SG": () => import("../../messages/en-SG.json"),
  "de-CH": () => import("../../messages/de-CH.json"),
  "zh-CN": () => import("../../messages/zh-CN.json"),
  "zh-HK": () => import("../../messages/zh-HK.json"),
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeMessages(base: Messages, overrides: Messages): Messages {
  const merged: Messages = { ...base };

  Object.entries(overrides).forEach(([key, value]) => {
    const baseValue = merged[key];
    if (isPlainObject(baseValue) && isPlainObject(value)) {
      merged[key] = mergeMessages(baseValue, value);
      return;
    }
    merged[key] = value;
  });

  return merged;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const baseMessages = (await messageLoaders[routing.defaultLocale]()).default;
  const loader = messageLoaders[locale as (typeof routing.locales)[number]];
  const localeMessages = loader ? (await loader()).default : {};
  const messages = locale === routing.defaultLocale
    ? baseMessages
    : mergeMessages(baseMessages, localeMessages);

  return {
    locale,
    messages,
  };
});
