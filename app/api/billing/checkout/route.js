import { NextResponse } from 'next/server';
import { hasSupabaseSessionCookie } from '@/lib/serverAuth';

export async function POST() {
  try {
    if (!hasSupabaseSessionCookie()) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const priceId = process.env.STRIPE_PRICE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!priceId || !appUrl || !stripeKey) {
      return NextResponse.json({ error: 'Configuração de billing incompleta (STRIPE_PRICE_ID/NEXT_PUBLIC_APP_URL/STRIPE_SECRET_KEY).' }, { status: 500 });
    }

    const body = {
      mode: 'subscription',
      success_url: `${appUrl}/?billing=success`,
      cancel_url: `${appUrl}/?billing=cancelled`,
      line_items: [{ price: priceId, quantity: 1 }]
    };

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        mode: body.mode,
        success_url: body.success_url,
        cancel_url: body.cancel_url,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1'
      })
    });

    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.error?.message || 'Falha ao iniciar checkout.' }, { status: 500 });

    return NextResponse.json({ url: payload.url });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Falha ao iniciar checkout.' }, { status: 500 });
  }
}
