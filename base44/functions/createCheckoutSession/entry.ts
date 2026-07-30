import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@17.0.0';
import { secrets } from 'base44:runtime';

const PRICE_ID = 'price_1TxowgCmmDVIXqexiwczCiDl';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const origin = body.origin;
    const userEmail = body.email;

    if (!origin || !userEmail) {
      return Response.json({ error: 'Missing origin or email' }, { status: 400 });
    }

    // Find user by email (do not use auth.me() — app may be public)
    const users = await db.entities.User.filter({ email: userEmail }).catch(() => []);
    const user = users?.[0];

    if (!user) {
      return Response.json({ error: 'Pengguna tidak dijumpai. Sila daftar dahulu.' }, { status: 404 });
    }

    if (user.subscription_tier === 'premium') {
      return Response.json({ error: 'Anda sudah punca langganan Premium.' }, { status: 400 });
    }

    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${origin}/premium?status=success`,
      cancel_url: `${origin}/premium?status=cancelled`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,
        user_email: user.email,
      },
      customer_email: user.email,
      subscription_data: {
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          user_id: user.id,
        },
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return Response.json({ error: error.message || 'Gagal mencipta sesi pembayaran.' }, { status: 500 });
  }
}