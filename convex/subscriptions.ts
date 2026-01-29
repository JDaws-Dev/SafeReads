import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const FREE_ANALYSIS_LIMIT = 3;

/**
 * Check whether the current user can run an analysis.
 * Free users get 3 analyses; subscribed users get unlimited.
 */
export const checkAccess = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { hasAccess: false, freeRemaining: 0, isSubscribed: false };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return { hasAccess: false, freeRemaining: 0, isSubscribed: false };
    }

    const analysisCount = user.analysisCount ?? 0;
    const isSubscribed = user.subscriptionStatus === "active";
    const freeRemaining = Math.max(0, FREE_ANALYSIS_LIMIT - analysisCount);
    const hasAccess = isSubscribed || analysisCount < FREE_ANALYSIS_LIMIT;

    return { hasAccess, freeRemaining, isSubscribed };
  },
});

/**
 * Get subscription details for the settings/account UI.
 */
export const getDetails = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        isSubscribed: false,
        status: null,
        currentPeriodEnd: null,
        analysisCount: 0,
        freeRemaining: FREE_ANALYSIS_LIMIT,
      };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return {
        isSubscribed: false,
        status: null,
        currentPeriodEnd: null,
        analysisCount: 0,
        freeRemaining: FREE_ANALYSIS_LIMIT,
      };
    }

    const analysisCount = user.analysisCount ?? 0;
    const isSubscribed = user.subscriptionStatus === "active";

    return {
      isSubscribed,
      status: user.subscriptionStatus ?? null,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd ?? null,
      analysisCount,
      freeRemaining: Math.max(0, FREE_ANALYSIS_LIMIT - analysisCount),
    };
  },
});

/**
 * Increment the analysis count for the current user after a successful analysis.
 */
export const incrementAnalysisCount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, {
      analysisCount: (user.analysisCount ?? 0) + 1,
    });
  },
});

/**
 * Update subscription status fields from Stripe webhook.
 * Looks up user by stripeCustomerId.
 */
export const updateSubscription = mutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("incomplete")
    ),
    subscriptionCurrentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .unique();

    if (!user) throw new Error("User not found for Stripe customer");

    await ctx.db.patch(user._id, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscriptionStatus: args.subscriptionStatus,
      subscriptionCurrentPeriodEnd: args.subscriptionCurrentPeriodEnd,
    });
  },
});

/**
 * Store the Stripe customer ID on the current user's record.
 * Called after creating a Stripe customer during checkout.
 */
export const setStripeCustomerId = mutation({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(userId, {
      stripeCustomerId: args.stripeCustomerId,
    });
  },
});
