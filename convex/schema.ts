import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  activities: defineTable({
    userId: v.string(),
    name: v.string(),
    category: v.string(),
    categoryColor: v.string(),
    categoryIcon: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(), // duration in seconds
    date: v.string(), // YYYY-MM-DD
    year: v.number(),
    month: v.number(), // 1 - 12
    day: v.number(), // 1 - 31
    notes: v.optional(v.string()),
  })
    .index("by_userId_and_date", ["userId", "date"])
    .index("by_userId_and_year_month", ["userId", "year", "month"])
    .index("by_userId_and_year", ["userId", "year"])
    .index("by_userId_and_category", ["userId", "category"])
    .index("by_userId_and_startTime", ["userId", "startTime"]),

  activeSessions: defineTable({
    userId: v.string(),
    activityName: v.string(),
    category: v.string(),
    categoryColor: v.string(),
    categoryIcon: v.string(),
    startedAt: v.number(),
    isPaused: v.boolean(),
    pausedAt: v.optional(v.number()),
    accumulatedSeconds: v.number(),
  }).index("by_userId", ["userId"]),

  userActivityMemory: defineTable({
    userId: v.string(),
    activityName: v.string(),
    category: v.string(),
    categoryColor: v.string(),
    categoryIcon: v.string(),
    lastUsedAt: v.number(),
    frequency: v.number(),
  })
    .index("by_userId_and_activityName", ["userId", "activityName"])
    .index("by_userId_and_lastUsedAt", ["userId", "lastUsedAt"]),

  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    pictureUrl: v.optional(v.string()),
    lastSeenAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_email", ["email"]),
});
