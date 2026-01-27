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
 * List all profiles for a user.
 */
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get a single profile by ID.
 */
export const getById = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});

/**
 * Get the default profile for a user.
 */
export const getDefault = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return profiles.find((p) => p.isDefault) ?? profiles[0] ?? null;
  },
});

/**
 * Create a new profile. If it's the user's first profile, mark it as default.
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    ...sensitivityArgs,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const isDefault = existing.length === 0;

    return await ctx.db.insert("profiles", {
      userId: args.userId,
      name: args.name,
      violence: args.violence,
      language: args.language,
      sexualContent: args.sexualContent,
      substanceUse: args.substanceUse,
      darkThemes: args.darkThemes,
      religiousSensitivity: args.religiousSensitivity,
      isDefault,
    });
  },
});

/**
 * Update an existing profile's name and sensitivity settings.
 */
export const update = mutation({
  args: {
    profileId: v.id("profiles"),
    name: v.string(),
    ...sensitivityArgs,
  },
  handler: async (ctx, args) => {
    const { profileId, ...fields } = args;
    await ctx.db.patch(profileId, fields);
  },
});

/**
 * Set a profile as the default for its user.
 * Unsets the current default first.
 */
export const setDefault = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");

    const siblings = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect();

    for (const sibling of siblings) {
      if (sibling.isDefault) {
        await ctx.db.patch(sibling._id, { isDefault: false });
      }
    }

    await ctx.db.patch(args.profileId, { isDefault: true });
  },
});

/**
 * Delete a profile. Cannot delete the last remaining profile.
 * If the deleted profile was default, the first remaining profile becomes default.
 */
export const remove = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");

    const siblings = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect();

    if (siblings.length <= 1) {
      throw new Error("Cannot delete your only profile");
    }

    await ctx.db.delete(args.profileId);

    if (profile.isDefault) {
      const remaining = siblings.find((s) => s._id !== args.profileId);
      if (remaining) {
        await ctx.db.patch(remaining._id, { isDefault: true });
      }
    }
  },
});
