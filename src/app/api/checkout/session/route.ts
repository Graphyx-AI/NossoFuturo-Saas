import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  stripe,
  STRIPE_PRICE_PRO,
  STRIPE_PRICE_PRO_USD,
  APP_URL,
} from "@/lib/stripe/config";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe não configurado." },
      { status: 500 }
    );
  }

  let body: {
    country: string;
    workspaceId?: string;
    successUrl?: string;
    cancelUrl?: string;
    locale?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const { country, workspaceId, successUrl, cancelUrl, locale = "pt-BR" } = body;

  if (!country || typeof country !== "string") {
    return NextResponse.json(
      { error: "O parâmetro 'country' é obrigatório." },
      { status: 400 }
    );
  }

  const isBR = country.toUpperCase() === "BR";
  const priceId = isBR ? STRIPE_PRICE_PRO : STRIPE_PRICE_PRO_USD;

  if (!priceId) {
    return NextResponse.json(
      {
        error: isBR
          ? "Preços em BRL não configurados."
          : "Preços em USD não configurados.",
      },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 }
    );
  }

  let customerId: string | null = null;

  if (workspaceId) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, owner_id, stripe_customer_id")
      .eq("id", workspaceId)
      .single();

    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Workspace não encontrado ou sem permissão." },
        { status: 403 }
      );
    }

    customerId = workspace.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: (user.user_metadata?.full_name as string) ?? undefined,
        metadata: { workspace_id: workspaceId },
      });
      customerId = customer.id;
      await supabase
        .from("workspaces")
        .update({ stripe_customer_id: customerId })
        .eq("id", workspaceId);
    }
  }

  const basePath = `${APP_URL.replace(/\/$/, "")}/${locale}/dashboard/settings`;
  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl ?? `${basePath}?checkout=success`,
    cancel_url: cancelUrl ?? `${basePath}?checkout=cancelled`,
    metadata: workspaceId ? { workspace_id: workspaceId, plan: "pro" } : { plan: "pro" },
    subscription_data: {
      trial_period_days: 2,
      metadata: workspaceId ? { workspace_id: workspaceId, plan: "pro" } : { plan: "pro" },
    },
    locale: (isBR ? "pt-BR" : (locale.startsWith("es") ? "es" : "en")) as "pt-BR" | "es" | "en",
  };

  if (customerId) {
    sessionParams.customer = customerId;
  } else {
    sessionParams.customer_email = user.email ?? undefined;
  }

  if (isBR) {
    sessionParams.payment_method_types = ["pix", "card"];
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: "Erro ao criar sessão de checkout." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar checkout.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
