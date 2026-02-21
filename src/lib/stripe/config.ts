import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("STRIPE_SECRET_KEY is required in production");
}

export const stripe = secret
  ? new Stripe(secret, { apiVersion: "2024-11-20.acacia" })
  : null;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO ?? "";
export const STRIPE_PRICE_BUSINESS = process.env.STRIPE_PRICE_BUSINESS ?? "";
export const STRIPE_PRICE_PRO_USD = process.env.STRIPE_PRICE_PRO_USD ?? "";
export const STRIPE_PRICE_BUSINESS_USD = process.env.STRIPE_PRICE_BUSINESS_USD ?? "";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
