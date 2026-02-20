import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const signature = headers().get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 400 });
  }

  const rawBody = await request.text();

  return NextResponse.json({
    received: true,
    note: 'Webhook endpoint ativo. Validação criptográfica e atualização de assinatura devem ser implementadas com SDK Stripe ou verificação HMAC manual.',
    size: rawBody.length
  });
}
