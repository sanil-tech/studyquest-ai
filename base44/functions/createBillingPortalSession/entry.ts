import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@17.0.0';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const userEmail = body.email;
    const origin = body.origin;

    if (!userEmail || !origin) {
      return Response.json({ error: 'Missing email or origin' }, { status: 400 });
    }

    const users = await db.entities.User.filter({ email: userEmail }).catch(() => []);
    const user = users?.[0];

    if (!user) {
      return Response.json({ error: 'Pengguna tidak dijumpai.' }, { status: 404 });
    }

    if (user.subscription_tier !== 'premium') {
      return Response.json({ error: 'Tiada langganan aktif untuk diuruskan.' }, { status: 400 });
    }

    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));

    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId = customers.data[0]?.id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { user_id: user.id, base44_app_id: Deno.env.get('BASE44_APP_ID') },
      });
      customerId = customer.id;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/parent/billing`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createBillingPortalSession error:', error);
    return Response.json({ error: error.message || 'Gagal mencipta sesi portal bil.' }, { status: 500 });
  }
}