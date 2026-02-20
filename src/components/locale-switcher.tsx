"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common.locales");

  function handleChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale as (typeof routing.locales)[number] });
  }

  return (
    <div className="relative group">
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none min-h-[44px] min-w-[44px] sm:min-w-[140px] pl-10 sm:pl-10 pr-8 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer border-0 focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
        aria-label={t("label")}
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
      <Globe
        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
        aria-hidden
      />
      <span
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
        aria-hidden
      >
        ▼
      </span>
    </div>
  );
}
