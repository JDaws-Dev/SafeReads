import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

const FREE_ANALYSIS_LIMIT = 3;

/**
 * Check whether a user can run an analysis.
 * Free users get 3 analyses; subscribed users get unlimited.
 */
export const checkAccess = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

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
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

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
 * Increment the analysis count for a user after a successful analysis.
 */
export const incrementAnalysisCount = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      analysisCount: (user.analysisCount ?? 0) + 1,
    });
  },
});

/**
 * Update subscription status fields from Stripe webhook.
 * Looks up user by stripeCustomerId.
 */
export const updateSubscription = internalMutation({
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
 * Store the Stripe customer ID on a user record.
 * Called after creating a Stripe customer during checkout.
 */
export const setStripeCustomerId = internalMutation({
  args: {
    clerkId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      stripeCustomerId: args.stripeCustomerId,
    });
  },
});
