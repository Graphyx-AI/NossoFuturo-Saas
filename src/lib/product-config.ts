/**
 * Configuração central do produto — única fonte de verdade para copy e limites.
 * Não existe uso gratuito: é obrigatório assinar o Pro para usar o app.
 * Trial: 2 dias grátis para assinantes, depois o Stripe cobra automaticamente.
 *
 * Pro: Até 2 workspaces, até 5 membros.
 */
export const PRODUCT_CONFIG = {
  trialDays: 2,
  maxWorkspaces: 2,
  maxMembersPerWorkspace: 5,
  /** Preço Pro em BRL (R$/mês) */
  priceProMonthly: 9.9,
  /** Preço Pro em USD (US$/mês) */
  priceProMonthlyUSD: 10,
  hasPaymentIntegration: true,
} as const;

/** Locales que usam BRL (Brasil). Demais usam USD. */
export const BRL_LOCALES = ["pt-BR"] as const;

export function isBRLocale(locale: string): boolean {
  return BRL_LOCALES.includes(locale as (typeof BRL_LOCALES)[number]);
}

/** Retorna o preço mensal do Pro conforme locale. */
export function getPlanPrice(locale: string): { value: number; currency: "BRL" | "USD"; symbol: string } {
  const useBRL = isBRLocale(locale);
  return useBRL
    ? { value: PRODUCT_CONFIG.priceProMonthly, currency: "BRL", symbol: "R$" }
    : { value: PRODUCT_CONFIG.priceProMonthlyUSD, currency: "USD", symbol: "US$" };
}
