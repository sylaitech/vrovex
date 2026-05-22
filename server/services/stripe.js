import Stripe from 'stripe';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PRICE_ID = process.env.STRIPE_PRICE_ID;

export function stripeEnabled() {
  return Boolean(stripe && PRICE_ID);
}

export async function createCheckoutSession(userId, email) {
  if (!stripeEnabled()) {
    throw new Error('Stripe is not configured');
  }

  const user = await User.findById(userId);
  let customerId = user?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId: String(userId) },
    });
    customerId = customer.id;
    await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/?billing=success`,
    cancel_url: `${process.env.FRONTEND_URL}/?billing=canceled`,
    metadata: { userId: String(userId) },
    subscription_data: {
      metadata: { userId: String(userId) },
    },
  });

  return session;
}

export async function activateSubscription(userId, periodEnd, subscriptionId, customerId) {
  await User.findByIdAndUpdate(userId, {
    planStatus: 'active',
    currentPeriodEnd: periodEnd,
    stripeSubscriptionId: subscriptionId,
    ...(customerId ? { stripeCustomerId: customerId } : {}),
  });
  logger.info(`Subscription activated for user ${userId}`);
}

export async function deactivateSubscription(userId) {
  await User.findByIdAndUpdate(userId, {
    planStatus: 'inactive',
    stripeSubscriptionId: null,
  });
  logger.info(`Subscription deactivated for user ${userId}`);
}

export async function handleStripeWebhook(rawBody, signature) {
  if (!stripe) throw new Error('Stripe not configured');

  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (!userId) break;
      const subId = session.subscription;
      let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        periodEnd = new Date(sub.current_period_end * 1000);
        await activateSubscription(userId, periodEnd, sub.id, session.customer);
      } else {
        await activateSubscription(userId, periodEnd, null, session.customer);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const userId = sub.metadata?.userId;
      if (!userId) break;
      if (sub.status === 'active' || sub.status === 'trialing') {
        await activateSubscription(
          userId,
          new Date(sub.current_period_end * 1000),
          sub.id,
          sub.customer
        );
      } else if (['canceled', 'unpaid', 'past_due'].includes(sub.status)) {
        await User.findByIdAndUpdate(userId, {
          planStatus: sub.status === 'canceled' ? 'canceled' : 'inactive',
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const userId = sub.metadata?.userId;
      if (userId) await deactivateSubscription(userId);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        const userId = sub.metadata?.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, { planStatus: 'inactive' });
        }
      }
      break;
    }
    default:
      logger.info(`Unhandled Stripe event: ${event.type}`);
  }

  return event;
}
