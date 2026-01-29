import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Admin emails - add your email here
const ADMIN_EMAILS = ["jedaws@gmail.com", "jeremiah@getsafereads.com"];

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const user = await ctx.db.get(userId);
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error("Not authorized");
  }
  return user;
}

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

    const verdictCounts = {
      safe: analyses.filter(a => a.verdict === "safe").length,
      caution: analyses.filter(a => a.verdict === "caution").length,
      warning: analyses.filter(a => a.verdict === "warning").length,
      no_verdict: analyses.filter(a => a.verdict === "no_verdict").length,
    };

    return {
      userCount: users.length,
      activeSubscribers,
      bookCount: books.length,
      analysisCount: analyses.length,
      totalUserAnalyses: totalAnalysisCount,
      kidCount: kids.length,
      conversationCount: conversations.length,
      verdictCounts,
    };
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").order("desc").take(100);

    return users.map(user => ({
      _id: user._id,
      _creationTime: user._creationTime,
      name: user.name,
      email: user.email,
      image: user.image,
      subscriptionStatus: user.subscriptionStatus,
      analysisCount: user.analysisCount || 0,
      onboardingComplete: user.onboardingComplete,
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
