import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe wymaga surowego (nieparsowanego) body do weryfikacji podpisu -
// dlatego czytamy request.text(), a nie request.json().
export async function POST(request) {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      console.log('Opłacono subskrypcję Shortowni:', invoice.customer_email || invoice.customer);
      // TODO: automatyczna wysyłka dostępu do grupy (np. mail z linkiem do Discorda/kanału)
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      console.log('Subskrypcja anulowana:', sub.id);
      // TODO: odebranie dostępu do grupy
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log('Nieudana płatność subskrypcji:', invoice.customer_email || invoice.customer);
      break;
    }
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      if (pi.metadata && pi.metadata.source === 'shortownia-site') {
        console.log('Opłacono produkt jednorazowy:', pi.receipt_email, pi.metadata.priceId);
        // TODO: automatyczna wysyłka ebooka/dostępu do kursu na maila
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      if (pi.metadata && pi.metadata.source === 'shortownia-site') {
        console.log('Nieudana płatność jednorazowa:', pi.receipt_email, pi.metadata.priceId);
      }
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
