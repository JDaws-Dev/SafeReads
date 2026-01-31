import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/** List recent searches for a user, newest first. */
export const listByUser = query({
  args: {
    userId: v.id("users"),
    count: v.optional(v.number()),
  },
  handler: async (ctx, { userId, count }) => {
    const limit = count ?? 20;
    return await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

/** Record a search. Deduplicates by removing any existing entry with the same query. */
export const record = mutation({
  args: {
    userId: v.id("users"),
    query: v.string(),
    resultCount: v.number(),
  },
  handler: async (ctx, { userId, query: searchQuery, resultCount }) => {
    // Find and delete any existing entry with the same query (case-insensitive)
    const allUserSearches = await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const normalizedQuery = searchQuery.toLowerCase();
    const duplicates = allUserSearches.filter(
      (entry) => entry.query.toLowerCase() === normalizedQuery
    );

    await Promise.all(duplicates.map((entry) => ctx.db.delete(entry._id)));

    // Insert fresh entry (brings it to top of recent searches)
    return await ctx.db.insert("searchHistory", {
      userId,
      query: searchQuery,
      resultCount,
    });
  },
});

/** Clear all search history for a user. */
export const clearAll = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const entries = await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    await Promise.all(entries.map((entry) => ctx.db.delete(entry._id)));
  },
});
