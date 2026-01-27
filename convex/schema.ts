import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  profiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    violence: v.number(),
    language: v.number(),
    sexualContent: v.number(),
    substanceUse: v.number(),
    darkThemes: v.number(),
    religiousSensitivity: v.number(),
    isDefault: v.boolean(),
  }).index("by_user", ["userId"]),

  books: defineTable({
    googleBooksId: v.optional(v.string()),
    openLibraryKey: v.optional(v.string()),
    title: v.string(),
    authors: v.array(v.string()),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    publishedDate: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    isbn10: v.optional(v.string()),
    isbn13: v.optional(v.string()),
  })
    .index("by_google_books_id", ["googleBooksId"])
    .index("by_isbn13", ["isbn13"]),

  analyses: defineTable({
    bookId: v.id("books"),
    profileHash: v.string(),
    verdict: v.union(
      v.literal("safe"),
      v.literal("caution"),
      v.literal("warning"),
      v.literal("no_verdict")
    ),
    ageRecommendation: v.optional(v.string()),
    summary: v.string(),
    contentFlags: v.array(
      v.object({
        category: v.string(),
        severity: v.union(
          v.literal("none"),
          v.literal("mild"),
          v.literal("moderate"),
          v.literal("heavy")
        ),
        details: v.string(),
      })
    ),
    reasoning: v.optional(v.string()),
  }).index("by_book_and_profile", ["bookId", "profileHash"]),
});
