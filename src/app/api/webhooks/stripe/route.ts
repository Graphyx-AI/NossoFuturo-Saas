import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/config";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" })
  : null;

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

export async function POST(request: NextRequest) {
  if (!stripe || !supabaseAdmin || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook não configurado" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspace_id;
        const plan = session.metadata?.plan;
        const subscriptionId = session.subscription as string | null;

        if (!workspaceId || !subscriptionId) break;

        await supabaseAdmin
          .from("workspaces")
          .update({
            plan: "pro",
            stripe_subscription_id: subscriptionId,
            plan_updated_at: new Date().toISOString(),
          })
          .eq("id", workspaceId);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;
        if (!subscriptionId) break;

        const { data: ws } = await supabaseAdmin
          .from("workspaces")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (ws) {
          await supabaseAdmin
            .from("workspaces")
            .update({ plan_updated_at: new Date().toISOString() })
            .eq("id", ws.id);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = sub.metadata?.workspace_id;
        const status = sub.status;

        if (!workspaceId) break;

        if (status === "active") {
          await supabaseAdmin
            .from("workspaces")
            .update({
              plan: "pro",
              plan_updated_at: new Date().toISOString(),
            })
            .eq("id", workspaceId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = sub.metadata?.workspace_id;

        if (!workspaceId) break;

        await supabaseAdmin
          .from("workspaces")
          .update({
            plan: "pro",
            stripe_subscription_id: null,
            plan_updated_at: new Date().toISOString(),
          })
          .eq("id", workspaceId);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[Stripe Webhook]", event.type, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
