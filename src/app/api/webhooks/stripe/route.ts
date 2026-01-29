import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    httpClient: Stripe.createFetchHttpClient(),
  });
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // Customer ID is already set in the checkout route before creating the session,
      // so we don't need to do anything here. The subscription events handle the rest.
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      const periodEnd =
        subscription.items.data[0]?.current_period_end ?? 0;

      await convex.mutation(api.subscriptions.updateSubscription, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: mapSubscriptionStatus(subscription.status),
        subscriptionCurrentPeriodEnd: periodEnd * 1000,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      const periodEnd =
        subscription.items.data[0]?.current_period_end ?? 0;

      await convex.mutation(api.subscriptions.updateSubscription, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: "canceled",
        subscriptionCurrentPeriodEnd: periodEnd * 1000,
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): "active" | "canceled" | "past_due" | "incomplete" {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    default:
      return "incomplete";
  }
}
