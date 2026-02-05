import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Admin emails - add your email here
const ADMIN_EMAILS = ["jedaws@gmail.com", "jeremiah@getsafereads.com"];

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const user = await ctx.db.get(userId);
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error("Not authorized");
  }
  return user;
}

/**
 * Admin mutation to manually activate a user's subscription.
 */
export const activateSubscription = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();

    if (!user) {
      throw new Error(`User not found: ${args.email}`);
    }

    // Set subscription to active for 1 year
    const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;

    await ctx.db.patch(user._id, {
      subscriptionStatus: "active",
      subscriptionCurrentPeriodEnd: oneYearFromNow,
    });

    return { success: true, userId: user._id };
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const books = await ctx.db.query("books").collect();
    const analyses = await ctx.db.query("analyses").collect();
    const kids = await ctx.db.query("kids").collect();
    const conversations = await ctx.db.query("conversations").collect();

    const activeSubscribers = users.filter(u => u.subscriptionStatus === "active").length;
    const totalAnalysisCount = users.reduce((sum, u) => sum + (u.analysisCount || 0), 0);
    const usersWithAnalyses = users.filter(u => (u.analysisCount || 0) > 0).length;
    const onboardedUsers = users.filter(u => u.onboardingComplete).length;

    const verdictCounts = {
      safe: analyses.filter(a => a.verdict === "safe").length,
      caution: analyses.filter(a => a.verdict === "caution").length,
      warning: analyses.filter(a => a.verdict === "warning").length,
      no_verdict: analyses.filter(a => a.verdict === "no_verdict").length,
    };

    // Calculate 7-day and 30-day user counts based on creation time
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const usersLast7Days = users.filter(u => u._creationTime > sevenDaysAgo).length;
    const usersLast30Days = users.filter(u => u._creationTime > thirtyDaysAgo).length;

    return {
      userCount: users.length,
      activeSubscribers,
      bookCount: books.length,
      analysisCount: analyses.length,
      totalUserAnalyses: totalAnalysisCount,
      kidCount: kids.length,
      conversationCount: conversations.length,
      verdictCounts,
      // New engagement metrics
      usersWithAnalyses,
      onboardedUsers,
      avgAnalysesPerUser: users.length > 0 ? totalAnalysisCount / users.length : 0,
      avgKidsPerUser: users.length > 0 ? kids.length / users.length : 0,
      usersLast7Days,
      usersLast30Days,
    };
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").order("desc").take(100);
    const kids = await ctx.db.query("kids").collect();

    // Create a map of userId to kids count
    const kidsCountByUser = new Map<string, number>();
    for (const kid of kids) {
      const count = kidsCountByUser.get(kid.userId) || 0;
      kidsCountByUser.set(kid.userId, count + 1);
    }

    return users.map(user => ({
      _id: user._id,
      _creationTime: user._creationTime,
      name: user.name,
      email: user.email,
      image: user.image,
      subscriptionStatus: user.subscriptionStatus,
      analysisCount: user.analysisCount || 0,
      onboardingComplete: user.onboardingComplete,
      kidsCount: kidsCountByUser.get(user._id) || 0,
    }));
  },
});

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const user = await ctx.db.get(userId);
    if (!user?.email) return false;

    return ADMIN_EMAILS.includes(user.email);
  },
});
