import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const STAT_KEYS = [
  "vigor",
  "endurance",
  "charisma",
  "arcane",
  "mind",
  "intelligence",
  "wisdom",
  "dexterity",
] as const;

function getYesterdayDateStr(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3) return "";
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Get all stats for a user with streak and daily completion state
 */
export const getUserStats = query({
  args: {
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    if (!args.userId) return null;

    const existingDocs = await ctx.db
      .query("userStats")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const existingMap = new Map(existingDocs.map((doc) => [doc.statKey, doc]));
    const yesterdayStr = getYesterdayDateStr(args.date);

    const stats = STAT_KEYS.map((statKey) => {
      const existing = existingMap.get(statKey);
      const xp = existing?.xp ?? 0;
      const lastCompletedDate = existing?.lastCompletedDate;
      const isCompletedToday = lastCompletedDate === args.date;

      // Active streak calculation:
      // If completed today or yesterday, streak is alive.
      // If last completed before yesterday, current streak has lapsed to 0.
      let currentStreak = existing?.streak ?? 0;
      if (lastCompletedDate && lastCompletedDate !== args.date && lastCompletedDate !== yesterdayStr) {
        currentStreak = 0;
      }

      return {
        statKey,
        xp,
        level: existing?.level ?? 0,
        streak: currentStreak,
        longestStreak: existing?.longestStreak ?? 0,
        lastCompletedDate,
        totalCompletions: existing?.totalCompletions ?? 0,
        isCompletedToday,
      };
    });

    // Pick least experienced stat that has not been completed today
    const uncompleted = stats.filter((s) => !s.isCompletedToday);
    let dailySuggestedStatKey: string | null = null;

    if (uncompleted.length > 0) {
      // Sort ascending by XP (lowest first)
      const sorted = [...uncompleted].sort((a, b) => a.xp - b.xp);
      dailySuggestedStatKey = sorted[0].statKey;
    }

    const totalXp = stats.reduce((sum, s) => sum + s.xp, 0);
    const completedTodayCount = stats.filter((s) => s.isCompletedToday).length;

    return {
      stats,
      dailySuggestedStatKey,
      totalXp,
      completedTodayCount,
      totalStatsCount: STAT_KEYS.length,
      allCompletedToday: completedTodayCount === STAT_KEYS.length,
    };
  },
});

/**
 * Mark a stat daily action as complete and award XP + streak
 */
export const completeStatAction = mutation({
  args: {
    userId: v.string(),
    statKey: v.string(),
    date: v.string(), // YYYY-MM-DD
    actionTitle: v.optional(v.string()),
    xpReward: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) throw new Error("User ID is required");
    if (!STAT_KEYS.includes(args.statKey as (typeof STAT_KEYS)[number])) {
      throw new Error(`Invalid stat key: ${args.statKey}`);
    }

    const xpToAdd = args.xpReward ?? 50;
    const title = args.actionTitle || "Daily Attribute Fortification";

    const existing = await ctx.db
      .query("userStats")
      .withIndex("by_userId_and_statKey", (q) =>
        q.eq("userId", args.userId).eq("statKey", args.statKey)
      )
      .first();

    // Prevent duplicate completion on the exact same calendar date
    if (existing && existing.lastCompletedDate === args.date) {
      return {
        success: false,
        alreadyCompleted: true,
        message: "This stat is already fortified for today!",
        statKey: args.statKey,
        xpGained: 0,
        newXp: existing.xp,
        newStreak: existing.streak,
      };
    }

    const yesterdayStr = getYesterdayDateStr(args.date);
    let newStreak = 1;

    if (existing) {
      if (existing.lastCompletedDate === yesterdayStr) {
        newStreak = existing.streak + 1;
      } else {
        newStreak = 1;
      }
    }

    const newXp = (existing?.xp ?? 0) + xpToAdd;
    // Calculate stat level (starts at 0, higher levels require more XP, unlimited)
    let calculatedLevel = 0;
    let accumulated = 0;
    while (true) {
      const span = 50 + calculatedLevel * 20;
      if (newXp < accumulated + span) break;
      accumulated += span;
      calculatedLevel += 1;
    }

    const longestStreak = Math.max(existing?.longestStreak ?? 0, newStreak);
    const totalCompletions = (existing?.totalCompletions ?? 0) + 1;

    if (existing) {
      await ctx.db.patch(existing._id, {
        xp: newXp,
        level: calculatedLevel,
        streak: newStreak,
        longestStreak,
        lastCompletedDate: args.date,
        totalCompletions,
      });
    } else {
      await ctx.db.insert("userStats", {
        userId: args.userId,
        statKey: args.statKey,
        xp: newXp,
        level: calculatedLevel,
        streak: newStreak,
        longestStreak,
        lastCompletedDate: args.date,
        totalCompletions,
      });
    }

    // Record audit completion log
    await ctx.db.insert("statCompletions", {
      userId: args.userId,
      statKey: args.statKey,
      date: args.date,
      xpGained: xpToAdd,
      actionTitle: title,
      completedAt: Date.now(),
    });

    return {
      success: true,
      alreadyCompleted: false,
      message: `+${xpToAdd} XP fortified!`,
      statKey: args.statKey,
      xpGained: xpToAdd,
      newXp,
      newLevel: calculatedLevel,
      newStreak,
    };
  },
});

/**
 * Get recent stat completion history for the user
 */
export const getRecentStatCompletions = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return [];
    const maxItems = args.limit || 15;

    const completions = await ctx.db
      .query("statCompletions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(maxItems);

    return completions;
  },
});
