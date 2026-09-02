import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DEFAULT_CATEGORIES, OTHER_CATEGORY } from "./categories";
import { classifyTextLocally } from "./classify";

/**
 * Get active stopwatch session for a user (if any)
 */
export const getActiveSession = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return null;
    const session = await ctx.db
      .query("activeSessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return session;
  },
});

/**
 * Returns the Convex server's current Unix-ms timestamp.
 * The `requestedAt` arg is a cache-buster: callers pass Date.now() once at
 * component mount so each page load gets a fresh server-time reading instead
 * of a stale cached result.
 */
export const getServerTime = query({
  args: { requestedAt: v.number() },
  handler: async (): Promise<number> => {
    return Date.now();
  },
});

/**
 * Start or replace an active stopwatch session
 */
export const startActiveSession = mutation({
  args: {
    userId: v.string(),
    activityName: v.string(),
    category: v.optional(v.string()),
    categoryColor: v.optional(v.string()),
    categoryIcon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trimmedName = args.activityName.trim();
    if (!trimmedName) throw new Error("Activity name cannot be empty");

    // Remove any existing active session for this user
    const existingSessions = await ctx.db
      .query("activeSessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of existingSessions) {
      await ctx.db.delete(session._id);
    }

    let category = args.category;
    let color = args.categoryColor;
    let icon = args.categoryIcon;

    if (!category || !color || !icon) {
      // Check memory first
      const mem = await ctx.db
        .query("userActivityMemory")
        .withIndex("by_userId_and_activityName", (q) =>
          q.eq("userId", args.userId).eq("activityName", trimmedName)
        )
        .first();

      if (mem) {
        category = mem.category;
        color = mem.categoryColor;
        icon = mem.categoryIcon;
      } else {
        const classified = classifyTextLocally(trimmedName);
        category = classified.category;
        color = classified.categoryColor;
        icon = classified.categoryIcon;
      }
    }

    const now = Date.now();
    const sessionId = await ctx.db.insert("activeSessions", {
      userId: args.userId,
      activityName: trimmedName,
      category,
      categoryColor: color,
      categoryIcon: icon,
      startedAt: now,
      isPaused: false,
      pausedAt: undefined,
      accumulatedSeconds: 0,
    });

    return sessionId;
  },
});

/**
 * Pause the active stopwatch session
 */
export const pauseActiveSession = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeSessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!session || session.isPaused) return;

    const now = Date.now();
    const elapsedSinceStarted = Math.floor((now - session.startedAt) / 1000);
    const newAccumulated = session.accumulatedSeconds + Math.max(0, elapsedSinceStarted);

    await ctx.db.patch(session._id, {
      isPaused: true,
      pausedAt: now,
      accumulatedSeconds: newAccumulated,
    });
  },
});

/**
 * Resume the active stopwatch session
 */
export const resumeActiveSession = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeSessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!session || !session.isPaused) return;

    const now = Date.now();
    await ctx.db.patch(session._id, {
      isPaused: false,
      startedAt: now,
      pausedAt: undefined,
    });
  },
});

/**
 * Stop the active session, save it into activities table, and remember it in userActivityMemory
 */
export const stopAndSaveActiveSession = mutation({
  args: {
    userId: v.string(),
    notes: v.optional(v.string()),
    finalCategory: v.optional(v.string()),
    finalCategoryColor: v.optional(v.string()),
    finalCategoryIcon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeSessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!session) return null;

    const now = Date.now();
    let totalSeconds = session.accumulatedSeconds;
    if (!session.isPaused) {
      const elapsed = Math.floor((now - session.startedAt) / 1000);
      totalSeconds += Math.max(0, elapsed);
    }

    // Even short sessions get logged with minimum 1 second if stopped
    totalSeconds = Math.max(1, totalSeconds);

    const category = args.finalCategory || session.category;
    const categoryColor = args.finalCategoryColor || session.categoryColor;
    const categoryIcon = args.finalCategoryIcon || session.categoryIcon;

    const startTime = now - totalSeconds * 1000;
    const startDate = new Date(startTime);
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1; // 1-12
    const day = startDate.getDate();
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Insert logged activity
    const activityId = await ctx.db.insert("activities", {
      userId: args.userId,
      name: session.activityName,
      category,
      categoryColor,
      categoryIcon,
      startTime,
      endTime: now,
      duration: totalSeconds,
      date: dateStr,
      year,
      month,
      day,
      notes: args.notes,
    });

    // Update user memory
    const existingMemory = await ctx.db
      .query("userActivityMemory")
      .withIndex("by_userId_and_activityName", (q) =>
        q.eq("userId", args.userId).eq("activityName", session.activityName)
      )
      .first();

    if (existingMemory) {
      await ctx.db.patch(existingMemory._id, {
        category,
        categoryColor,
        categoryIcon,
        lastUsedAt: now,
        frequency: existingMemory.frequency + 1,
      });
    } else {
      await ctx.db.insert("userActivityMemory", {
        userId: args.userId,
        activityName: session.activityName,
        category,
        categoryColor,
        categoryIcon,
        lastUsedAt: now,
        frequency: 1,
      });
    }

    // Delete active session
    await ctx.db.delete(session._id);

    return activityId;
  },
});

/**
 * Discard / Cancel the active stopwatch session without saving
 */
export const discardActiveSession = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeSessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

/**
 * Log a manual activity (e.g. past activity entered by user)
 */
export const logManualActivity = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    category: v.string(),
    categoryColor: v.string(),
    categoryIcon: v.string(),
    durationSeconds: v.number(),
    dateStr: v.string(), // "YYYY-MM-DD"
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Activity name cannot be empty");
    if (args.durationSeconds <= 0) throw new Error("Duration must be positive");

    const parts = args.dateStr.split("-").map(Number);
    const year = parts[0] || new Date().getFullYear();
    const month = parts[1] || new Date().getMonth() + 1;
    const day = parts[2] || new Date().getDate();

    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
    const endTime = dateObj.getTime();
    const startTime = endTime - args.durationSeconds * 1000;
    const now = Date.now();

    const activityId = await ctx.db.insert("activities", {
      userId: args.userId,
      name: trimmed,
      category: args.category,
      categoryColor: args.categoryColor,
      categoryIcon: args.categoryIcon,
      startTime,
      endTime,
      duration: args.durationSeconds,
      date: args.dateStr,
      year,
      month,
      day,
      notes: args.notes,
    });

    // Update memory
    const existingMemory = await ctx.db
      .query("userActivityMemory")
      .withIndex("by_userId_and_activityName", (q) =>
        q.eq("userId", args.userId).eq("activityName", trimmed)
      )
      .first();

    if (existingMemory) {
      await ctx.db.patch(existingMemory._id, {
        category: args.category,
        categoryColor: args.categoryColor,
        categoryIcon: args.categoryIcon,
        lastUsedAt: now,
        frequency: existingMemory.frequency + 1,
      });
    } else {
      await ctx.db.insert("userActivityMemory", {
        userId: args.userId,
        activityName: trimmed,
        category: args.category,
        categoryColor: args.categoryColor,
        categoryIcon: args.categoryIcon,
        lastUsedAt: now,
        frequency: 1,
      });
    }

    return activityId;
  },
});

/**
 * Delete a logged activity
 */
export const deleteActivity = mutation({
  args: {
    activityId: v.id("activities"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) return;
    if (activity.userId !== args.userId) {
      throw new Error("Unauthorized to delete this activity");
    }
    await ctx.db.delete(args.activityId);
  },
});

/**
 * Update an existing activity's name, category, or notes
 */
export const updateActivity = mutation({
  args: {
    activityId: v.id("activities"),
    userId: v.string(),
    name: v.string(),
    category: v.string(),
    categoryColor: v.string(),
    categoryIcon: v.string(),
    durationSeconds: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");
    if (activity.userId !== args.userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.activityId, {
      name: args.name.trim(),
      category: args.category,
      categoryColor: args.categoryColor,
      categoryIcon: args.categoryIcon,
      duration: args.durationSeconds,
      notes: args.notes,
    });
  },
});

/**
 * Get recent distinct activities for autocomplete and quick-select chips
 */
export const getRecentActivities = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return [];
    const maxItems = args.limit ?? 12;

    const memories = await ctx.db
      .query("userActivityMemory")
      .withIndex("by_userId_and_lastUsedAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(maxItems);

    return memories.map((m) => ({
      name: m.activityName,
      category: m.category,
      categoryColor: m.categoryColor,
      categoryIcon: m.categoryIcon,
      frequency: m.frequency,
      lastUsedAt: m.lastUsedAt,
    }));
  },
});

/**
 * List activities for a user with optional date filter or recent list
 */
export const listActivities = query({
  args: {
    userId: v.string(),
    date: v.optional(v.string()), // "YYYY-MM-DD"
    year: v.optional(v.number()),
    month: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return [];
    const maxItems = args.limit ?? 100;

    let items;
    if (args.date) {
      items = await ctx.db
        .query("activities")
        .withIndex("by_userId_and_date", (q) =>
          q.eq("userId", args.userId).eq("date", args.date!)
        )
        .order("desc")
        .take(maxItems);
    } else if (args.year !== undefined && args.month !== undefined) {
      items = await ctx.db
        .query("activities")
        .withIndex("by_userId_and_year_month", (q) =>
          q.eq("userId", args.userId).eq("year", args.year!).eq("month", args.month!)
        )
        .order("desc")
        .take(maxItems);
    } else if (args.year !== undefined) {
      items = await ctx.db
        .query("activities")
        .withIndex("by_userId_and_year", (q) =>
          q.eq("userId", args.userId).eq("year", args.year!)
        )
        .order("desc")
        .take(maxItems);
    } else {
      items = await ctx.db
        .query("activities")
        .withIndex("by_userId_and_startTime", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(maxItems);
    }

    return items;
  },
});

/**
 * Get aggregated statistics & category breakdown for Pie Chart
 * Supports timeframe: "daily" (requires date), "monthly" (requires year + month), "yearly" (requires year), or "all"
 */
export const getCategoryStats = query({
  args: {
    userId: v.string(),
    timeframe: v.union(
      v.literal("daily"),
      v.literal("monthly"),
      v.literal("yearly"),
      v.literal("all")
    ),
    date: v.optional(v.string()), // YYYY-MM-DD
    year: v.optional(v.number()),
    month: v.optional(v.number()), // 1-12
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return {
        totalSeconds: 0,
        totalHours: 0,
        activityCount: 0,
        topCategory: null,
        categories: [],
      };
    }

    let records = [];
    if (args.timeframe === "daily" && args.date) {
      records = await ctx.db
        .query("activities")
        .withIndex("by_userId_and_date", (q) =>
          q.eq("userId", args.userId).eq("date", args.date!)
        )
        .take(500);
    } else if (args.timeframe === "monthly" && args.year && args.month) {
      records = await ctx.db
        .query("activities")
        .withIndex("by_userId_and_year_month", (q) =>
          q.eq("userId", args.userId).eq("year", args.year!).eq("month", args.month!)
        )
        .take(1000);
    } else if (args.timeframe === "yearly" && args.year) {
      records = await ctx.db
        .query("activities")
        .withIndex("by_userId_and_year", (q) =>
          q.eq("userId", args.userId).eq("year", args.year!)
        )
        .take(3000);
    } else {
      records = await ctx.db
        .query("activities")
        .withIndex("by_userId_and_startTime", (q) => q.eq("userId", args.userId))
        .take(3000);
    }

    // Aggregate by category
    let totalSeconds = 0;
    const catMap = new Map<
      string,
      {
        name: string;
        color: string;
        icon: string;
        seconds: number;
        count: number;
        activities: { name: string; seconds: number }[];
      }
    >();

    for (const item of records) {
      totalSeconds += item.duration;
      const key = item.category || OTHER_CATEGORY.name;
      const existing = catMap.get(key) || {
        name: key,
        color: item.categoryColor || OTHER_CATEGORY.color,
        icon: item.categoryIcon || OTHER_CATEGORY.icon,
        seconds: 0,
        count: 0,
        activities: [],
      };

      existing.seconds += item.duration;
      existing.count += 1;

      const actMatch = existing.activities.find((a) => a.name === item.name);
      if (actMatch) {
        actMatch.seconds += item.duration;
      } else {
        existing.activities.push({ name: item.name, seconds: item.duration });
      }

      catMap.set(key, existing);
    }

    const categories = Array.from(catMap.values())
      .map((cat) => ({
        ...cat,
        hours: Number((cat.seconds / 3600).toFixed(2)),
        percentage: totalSeconds > 0 ? Number(((cat.seconds / totalSeconds) * 100).toFixed(1)) : 0,
        activities: cat.activities.sort((a, b) => b.seconds - a.seconds),
      }))
      .sort((a, b) => b.seconds - a.seconds);

    const totalHours = Number((totalSeconds / 3600).toFixed(2));
    const topCategory = categories.length > 0 ? categories[0] : null;

    return {
      totalSeconds,
      totalHours,
      activityCount: records.length,
      topCategory: topCategory
        ? {
            name: topCategory.name,
            hours: topCategory.hours,
            percentage: topCategory.percentage,
            color: topCategory.color,
          }
        : null,
      categories,
    };
  },
});
