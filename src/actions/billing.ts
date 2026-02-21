"use server";

import { createClient } from "@/lib/supabase/server";
import {
  stripe,
  STRIPE_PRICE_PRO,
  STRIPE_PRICE_PRO_USD,
  APP_URL,
} from "@/lib/stripe/config";
import { isBRLocale } from "@/lib/product-config";
import type Stripe from "stripe";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const CreateCheckoutSchema = z.object({
  workspaceId: z.string().uuid(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  locale: z.string().optional(),
});

export type CreateCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

export async function createCheckoutSession(
  input: z.infer<typeof CreateCheckoutSchema>
): Promise<CreateCheckoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe não configurado. Entre em contato com o suporte." };
  }

  const parsed = CreateCheckoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }

  const { workspaceId, successUrl, cancelUrl, locale = "pt-BR" } = parsed.data;
  const useBRL = isBRLocale(locale);
  const priceId = useBRL ? STRIPE_PRICE_PRO : STRIPE_PRICE_PRO_USD;

  if (!priceId) {
    return {
      ok: false,
      error: useBRL
        ? "Preços em BRL não configurados."
        : "Preços em USD não configurados.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Não autenticado." };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, owner_id, stripe_customer_id")
    .eq("id", workspaceId)
    .single();

  if (!workspace || workspace.owner_id !== user.id) {
    return { ok: false, error: "Workspace não encontrado ou sem permissão." };
  }

  try {
    let customerId = workspace.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.user_metadata?.full_name ?? undefined,
        metadata: { workspace_id: workspaceId },
      });
      customerId = customer.id;
      await supabase
        .from("workspaces")
        .update({ stripe_customer_id: customerId })
        .eq("id", workspaceId);
    }

    const stripeLocale = locale as Stripe.Checkout.SessionCreateParams.Locale;
    const basePath = `${APP_URL.replace(/\/$/, "")}/${locale}/dashboard/settings`;
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${basePath}?checkout=success`,
      cancel_url: cancelUrl ?? `${basePath}?checkout=cancelled`,
      metadata: { workspace_id: workspaceId, plan: "pro" },
      subscription_data: {
        trial_period_days: 2,
        metadata: { workspace_id: workspaceId, plan: "pro" },
      },
      locale: stripeLocale,
    };

    if (useBRL) {
      sessionParams.payment_method_types = ["pix", "card"];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return { ok: false, error: "Erro ao criar sessão de checkout." };
    }

    revalidatePath("/dashboard/settings");
    return { ok: true, checkoutUrl: session.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar checkout.";
    return { ok: false, error: msg };
  }
}

export async function createBillingPortalSession(
  workspaceId: string,
  returnUrl?: string,
  locale?: string
): Promise<CreateCheckoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe não configurado." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Não autenticado." };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, owner_id, stripe_customer_id")
    .eq("id", workspaceId)
    .single();

  if (!workspace || workspace.owner_id !== user.id) {
    return { ok: false, error: "Workspace não encontrado ou sem permissão." };
  }

  if (!workspace.stripe_customer_id) {
    return { ok: false, error: "Nenhuma assinatura ativa para este workspace." };
  }

  const fallbackUrl =
    returnUrl ??
    `${APP_URL.replace(/\/$/, "")}/${locale ?? "pt-BR"}/dashboard/settings`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripe_customer_id,
      return_url: fallbackUrl,
    });

    if (!session.url) {
      return { ok: false, error: "Erro ao abrir portal de billing." };
    }

    return { ok: true, checkoutUrl: session.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao abrir portal.";
    return { ok: false, error: msg };
  }
}
