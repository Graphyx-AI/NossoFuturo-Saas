import { NextResponse } from 'next/server';
import { hasSupabaseSessionCookie } from '@/lib/serverAuth';

export async function POST() {
  if (!hasSupabaseSessionCookie()) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  return NextResponse.json({ error: 'Portal de billing requer stripe_customer_id. Vincule o cliente Stripe e implemente a chamada /v1/billing_portal/sessions.' }, { status: 501 });
}
