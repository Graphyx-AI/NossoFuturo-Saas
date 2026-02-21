"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CreditCard, Loader2 } from "lucide-react";
import { createCheckoutSession, createBillingPortalSession } from "@/actions/billing";
import { getPlanPrice, PRODUCT_CONFIG } from "@/lib/product-config";

export function BillingCard({
  workspaceId,
  currentPlan,
  hasSubscription,
}: {
  workspaceId: string | null;
  currentPlan: "pro";
  hasSubscription: boolean;
}) {
  const t = useTranslations("billing");
  const locale = useLocale();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout() {
    if (!workspaceId) return;
    setLoading("pro");
    const result = await createCheckoutSession({
      workspaceId,
      locale,
    });
    setLoading(null);
    if (result.ok && result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    } else if (!result.ok) {
      console.error(result.error);
    }
  }

  async function handlePortal() {
    if (!workspaceId) return;
    setLoading("portal");
    const result = await createBillingPortalSession(workspaceId, undefined, locale);
    setLoading(null);
    if (result.ok && result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    } else if (!result.ok) {
      console.error(result.error);
    }
  }

  if (!workspaceId) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm text-muted-foreground">{t("selectWorkspace")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("currentPlan")}</p>
        <p className="text-lg font-bold text-foreground">
          {hasSubscription ? "Pro" : t("noSubscription")}
        </p>
      </div>

      {PRODUCT_CONFIG.hasPaymentIntegration && (
        <div className="flex flex-col sm:flex-row gap-2">
          {hasSubscription ? (
            <button
              type="button"
              onClick={handlePortal}
              disabled={!!loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70"
            >
              {loading === "portal" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CreditCard size={16} />
              )}
              {loading === "portal" ? t("opening") : t("managePlan")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!!loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-hero-gradient px-4 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70"
            >
              {loading === "pro" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              {loading === "pro"
                ? t("redirecting")
                : (() => {
                    const p = getPlanPrice(locale);
                    const formatted =
                      p.currency === "BRL"
                        ? p.value.toFixed(2).replace(".", ",")
                        : p.value.toFixed(2);
                    return `${t("pro")} — ${p.symbol} ${formatted}/mês + ${PRODUCT_CONFIG.trialDays} dias grátis`;
                  })()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
