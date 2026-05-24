import Stripe from 'stripe';
import logger from '../utils/logger.js';
import { supabase } from '../server.js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PRICE_ID = process.env.STRIPE_PRICE_ID;

export function stripeEnabled() {
  return Boolean(stripe && PRICE_ID);
}

async function getUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createCheckoutSession(userId, email) {
  if (!stripeEnabled()) {
    throw new Error('Stripe is not configured');
  }

  const user = await getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }

  let customerId = user.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId: String(userId) },
    });
    customerId = customer.id;
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    customer_email: email,
    payment_method_types: ['card'],
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/?billing=success`,
    cancel_url: `${process.env.FRONTEND_URL}/?billing=canceled`,
    metadata: { userId: String(userId) },
    subscription_data: {
      trial_period_days: 0,
      metadata: { userId: String(userId) },
    },
  });

  return session;
}

export async function activateSubscription(userId, periodEnd, subscriptionId, customerId) {
  const updates = {
    plan_status: 'active',
    current_period_end: periodEnd ? periodEnd.toISOString() : null,
    stripe_subscription_id: subscriptionId,
  };

  if (customerId) {
    updates.stripe_customer_id = customerId;
  }

  await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  logger.info(`Subscription activated for user ${userId}`);
}

export async function deactivateSubscription(userId) {
  await supabase
    .from('users')
    .update({
      plan_status: 'inactive',
      stripe_subscription_id: null,
    })
    .eq('id', userId);

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

      const { data: user } = await supabase
        .from('users')
        .select('email, name, current_period_end')
        .eq('id', userId)
        .single();

      if (user) {
        const { sendSubscriptionActivatedEmail } = await import('./notifications.js');
        await sendSubscriptionActivatedEmail(user);
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
        await supabase
          .from('users')
          .update({ plan_status: sub.status === 'canceled' ? 'canceled' : 'inactive' })
          .eq('id', userId);
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
          await supabase
            .from('users')
            .update({ plan_status: 'inactive' })
            .eq('id', userId);
        }
      }
      break;
    }
    default:
      logger.info(`Unhandled Stripe event: ${event.type}`);
  }

  return event;
}
