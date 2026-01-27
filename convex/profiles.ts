import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const sensitivityArgs = {
  violence: v.number(),
  language: v.number(),
  sexualContent: v.number(),
  substanceUse: v.number(),
  darkThemes: v.number(),
  religiousSensitivity: v.number(),
};

/**
 * Get the user's profile (single profile per user).
 */
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Create or update the user's profile.
 * Auto-creates on first save; updates on subsequent saves.
 */
export const upsert = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    ...sensitivityArgs,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const fields = {
      name: args.name,
      violence: args.violence,
      language: args.language,
      sexualContent: args.sexualContent,
      substanceUse: args.substanceUse,
      darkThemes: args.darkThemes,
      religiousSensitivity: args.religiousSensitivity,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    } else {
      return await ctx.db.insert("profiles", {
        userId: args.userId,
        isDefault: true,
        ...fields,
      });
    }
  },
});
