import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { DEFAULT_CATEGORIES, OTHER_CATEGORY, CategoryDefinition } from "./categories";

/**
 * Pure heuristic classifier that quickly matches activity text against category taxonomy.
 */
export function classifyTextLocally(input: string): {
  category: string;
  categoryColor: string;
  categoryIcon: string;
  confidence: number;
} {
  const cleanInput = input.trim().toLowerCase();
  if (!cleanInput) {
    return {
      category: OTHER_CATEGORY.name,
      categoryColor: OTHER_CATEGORY.color,
      categoryIcon: OTHER_CATEGORY.icon,
      confidence: 0,
    };
  }

  // Exact or word-boundary matches get higher weight
  let bestCategory: CategoryDefinition = OTHER_CATEGORY;
  let highestScore = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    for (const keyword of cat.keywords) {
      const kw = keyword.toLowerCase();
      if (cleanInput === kw) {
        return {
          category: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          confidence: 0.99,
        };
      }

      // Check if input contains keyword as a phrase or word
      if (cleanInput.includes(kw)) {
        // Longer keyword matches give higher confidence
        const score = kw.length * 2 + (cleanInput.startsWith(kw) ? 5 : 0);
        if (score > highestScore) {
          highestScore = score;
          bestCategory = cat;
        }
      }

      // Check word token overlap
      const inputWords = cleanInput.split(/\s+/);
      const kwWords = kw.split(/\s+/);
      let overlap = 0;
      for (const w of inputWords) {
        if (w.length > 2 && kwWords.includes(w)) {
          overlap += w.length;
        }
      }
      if (overlap > 0 && overlap * 1.5 > highestScore) {
        highestScore = overlap * 1.5;
        bestCategory = cat;
      }
    }
  }

  return {
    category: bestCategory.name,
    categoryColor: bestCategory.color,
    categoryIcon: bestCategory.icon,
    confidence: highestScore > 0 ? Math.min(0.95, 0.5 + highestScore / 20) : 0.3,
  };
}

/**
 * Fast query to classify an activity text for a specific user,
 * taking into account their previous custom memory associations first.
 */
export const classify = query({
  args: {
    userId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.text.trim();
    if (!trimmed) {
      return {
        category: OTHER_CATEGORY.name,
        categoryColor: OTHER_CATEGORY.color,
        categoryIcon: OTHER_CATEGORY.icon,
        isCustomMemory: false,
      };
    }

    // 1. Check user's past memory for exact or case-insensitive match
    if (args.userId) {
      const existing = await ctx.db
        .query("userActivityMemory")
        .withIndex("by_userId_and_activityName", (q) =>
          q.eq("userId", args.userId).eq("activityName", trimmed)
        )
        .first();

      if (existing) {
        return {
          category: existing.category,
          categoryColor: existing.categoryColor,
          categoryIcon: existing.categoryIcon,
          isCustomMemory: true,
        };
      }

      // Fuzzy check against memory items
      const userMemories = await ctx.db
        .query("userActivityMemory")
        .withIndex("by_userId_and_lastUsedAt", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(50);

      const lowerText = trimmed.toLowerCase();
      const matchedMemory = userMemories.find(
        (m) => m.activityName.toLowerCase() === lowerText || lowerText.includes(m.activityName.toLowerCase())
      );

      if (matchedMemory) {
        return {
          category: matchedMemory.category,
          categoryColor: matchedMemory.categoryColor,
          categoryIcon: matchedMemory.categoryIcon,
          isCustomMemory: true,
        };
      }
    }

    // 2. Classify via taxonomy heuristics
    const result = classifyTextLocally(trimmed);
    return {
      ...result,
      isCustomMemory: false,
    };
  },
});

/**
 * Returns the list of all available categories
 */
export const getAvailableCategories = query({
  args: {},
  handler: async () => {
    return DEFAULT_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
    }));
  },
});
