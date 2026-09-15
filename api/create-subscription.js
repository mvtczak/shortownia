import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Tylko te trzy plany "Grupka Insiderów" mogą być kupione przez ten endpoint -
// blokuje to próby przepuszczenia dowolnego innego price_id przez to API.
const ALLOWED_PRICES = new Set([
  'price_1UFtEHCYqOnrJwGYZJoDLb5a', // miesiąc - 99 zł
  'price_1UFtNECYqOnrJwGYlxPIBbC9', // 3 miesiące - 267 zł
  'price_1UFtERCYqOnrJwGYa3JfeYVM', // rok - 790 zł
]);

export async function POST(request) {
  try {
    const body = await request.json();
    const priceId = body && body.priceId;
    const email = body && body.email;

    if (!priceId || !ALLOWED_PRICES.has(priceId)) {
      return Response.json({ error: 'Nieprawidłowy plan.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json({ error: 'Podaj poprawny adres e-mail.' }, { status: 400 });
    }

    // znajdź istniejącego klienta po mailu albo utwórz nowego
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0] || (await stripe.customers.create({ email }));

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      automatic_tax: { enabled: false },
      expand: ['latest_invoice.payment_intent'],
      metadata: { source: 'shortownia-site' },
    });

    const paymentIntent = subscription.latest_invoice.payment_intent;

    return Response.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error('create-subscription error', err);
    return Response.json(
      { error: 'Coś poszło nie tak. Spróbuj ponownie za chwilę.' },
      { status: 500 }
    );
  }
}
