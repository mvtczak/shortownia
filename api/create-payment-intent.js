import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Tylko te jednorazowe produkty mogą być kupione przez ten endpoint -
// kwota zawsze pobierana z samego Stripe'a (price.unit_amount), nigdy od klienta.
const ALLOWED_PRICES = new Set([
  'price_1UFtDnCYqOnrJwGYRj36lVAW', // Ebook: Hook w 2 sekundy - 37 zł
  'price_1UFtDyCYqOnrJwGYjifMmgA4', // Kurs Shortownia - Podstawa - 97 zł
  'price_1UFtE0CYqOnrJwGYwgQkR2FB', // Kurs Shortownia - Standard - 197 zł
  'price_1UFtE2CYqOnrJwGYAxzBm3p2', // Kurs Shortownia - Pro - 397 zł
]);

export async function POST(request) {
  try {
    const body = await request.json();
    const priceId = body && body.priceId;
    const email = body && body.email;

    if (!priceId || !ALLOWED_PRICES.has(priceId)) {
      return Response.json({ error: 'Nieprawidłowy produkt.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json({ error: 'Podaj poprawny adres e-mail.' }, { status: 400 });
    }

    const price = await stripe.prices.retrieve(priceId);
    if (!price || !price.active || price.type !== 'one_time') {
      return Response.json({ error: 'Ten produkt jest chwilowo niedostępny.' }, { status: 400 });
    }

    // znajdź istniejącego klienta po mailu albo utwórz nowego
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0] || (await stripe.customers.create({ email }));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      customer: customer.id,
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      metadata: { source: 'shortownia-site', priceId },
    });

    return Response.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error('create-payment-intent error', err);
    return Response.json(
      { error: 'Coś poszło nie tak. Spróbuj ponownie za chwilę.' },
      { status: 500 }
    );
  }
}
