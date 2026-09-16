export interface DailyActionSuggestion {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  tag: string;
}

export interface StatDefinition {
  key: string;
  name: string;
  shortName: string;
  subtitle: string;
  scaling: string;
  effect: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  glowColor: string;
  iconName: string;
  archetypeTitle: string;
  suggestedActions: DailyActionSuggestion[];
}

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

export type StatKey = (typeof STAT_KEYS)[number];

export const STATS_CATALOG: Record<StatKey, StatDefinition> = {
  vigor: {
    key: "vigor",
    name: "Vigor",
    shortName: "VIG",
    subtitle: "Physical Health & Stamina",
    scaling: "Sleep quality, cardiovascular endurance, joint longevity.",
    effect:
      "Expands your maximum HP pool and daily stamina bar. High Vigor lets you survive heavy burnouts and tank sudden physical stressors without getting staggered.",
    color: "#EF4444",
    badgeBg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    borderColor: "border-rose-500/30 hover:border-rose-500/60",
    glowColor: "rgba(239, 68, 68, 0.25)",
    iconName: "Heart",
    archetypeTitle: "Ironclad Vanguard",
    suggestedActions: [
      {
        id: "vig_sleep",
        title: "Log 7.5+ Hours of Restful Sleep",
        description: "Wind down 45 minutes before bedtime without screens for optimal recovery.",
        xpReward: 50,
        tag: "Recovery",
      },
      {
        id: "vig_cardio",
        title: "25-Minute Zone 2 Cardio or Brisk Walk",
        description: "Build steady aerobic base and boost cardiovascular endurance.",
        xpReward: 50,
        tag: "Cardio",
      },
      {
        id: "vig_mobility",
        title: "15-Minute Joint Longevity & Hip Mobility",
        description: "Unstick your joints and counteract prolonged sitting posture.",
        xpReward: 50,
        tag: "Mobility",
      },
      {
        id: "vig_fresh_air",
        title: "Morning Sun & 20-Minute Outdoor Stride",
        description: "Set your circadian rhythm and kickstart morning vitality.",
        xpReward: 50,
        tag: "Vitality",
      },
    ],
  },
  endurance: {
    key: "endurance",
    name: "Endurance",
    shortName: "END",
    subtitle: "Energy & Work Capacity",
    scaling: "Nutrition, hydration, daily physical movement.",
    effect:
      "Determines how many actions you can execute before entering a high-fatigue state. High Endurance keeps your stamina recovery rate fast throughout long workdays.",
    color: "#10B981",
    badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
    glowColor: "rgba(16, 185, 129, 0.25)",
    iconName: "Zap",
    archetypeTitle: "Colossus of Stamina",
    suggestedActions: [
      {
        id: "end_hydration",
        title: "Hit 2.5L Clean Water & Electrolytes",
        description: "Keep cognitive energy high and prevent midday dehydration dips.",
        xpReward: 50,
        tag: "Hydration",
      },
      {
        id: "end_steps",
        title: "Reach 8,000+ Active Daily Steps",
        description: "Maintain non-exercise activity thermogenesis and sustained stamina.",
        xpReward: 50,
        tag: "Activity",
      },
      {
        id: "end_clean_fuel",
        title: "Eat Whole Foods with Zero Sugar Crashes",
        description: "Fuel high-workload sessions with clean proteins and slow carbs.",
        xpReward: 50,
        tag: "Nutrition",
      },
      {
        id: "end_pacing",
        title: "Work with 5-Minute Active Recovery Breaks",
        description: "Reset mental stamina every 50 minutes of continuous exertion.",
        xpReward: 50,
        tag: "Pacing",
      },
    ],
  },
  charisma: {
    key: "charisma",
    name: "Charisma / Synergy",
    shortName: "CHA",
    subtitle: "Social Intelligence & Network",
    scaling: "Active listening, empathy, public speaking, reputation.",
    effect:
      "Summons co-op allies for tough boss fights. Unlocks hidden NPC dialogue options, opens locked doors, and decreases vendor prices across all market zones.",
    color: "#F59E0B",
    badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    borderColor: "border-amber-500/30 hover:border-amber-500/60",
    glowColor: "rgba(245, 158, 11, 0.25)",
    iconName: "Users",
    archetypeTitle: "Master Emissary",
    suggestedActions: [
      {
        id: "cha_appreciation",
        title: "Send a Genuine Note of Gratitude or Praise",
        description: "Strengthen an ally relationship with specific, heartfelt acknowledgment.",
        xpReward: 50,
        tag: "Connection",
      },
      {
        id: "cha_listening",
        title: "Practice 100% Active Listening Without Interrupting",
        description: "Focus completely on the speaker's perspective during all discussions today.",
        xpReward: 50,
        tag: "Empathy",
      },
      {
        id: "cha_connect",
        title: "Connect Two People in Your Network",
        description: "Create mutual value by introducing two peers who can help one another.",
        xpReward: 50,
        tag: "Synergy",
      },
      {
        id: "cha_voice",
        title: "Speak Up with Clear Constructive Input",
        description: "Contribute a well-reasoned viewpoint in a team discussion or group setting.",
        xpReward: 50,
        tag: "Influence",
      },
    ],
  },
  arcane: {
    key: "arcane",
    name: "Arcane",
    shortName: "ARC",
    subtitle: "Wealth & Resource Generation",
    scaling: "Financial literacy, strategic investments, asset management.",
    effect:
      'Increases your "Runes Drop Rate." Higher Arcane gives you better item discovery (spotting rare opportunities) and funds high-tier gear and upgrades without exhausting your base stats.',
    color: "#EAB308",
    badgeBg: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    borderColor: "border-yellow-500/30 hover:border-yellow-500/60",
    glowColor: "rgba(234, 179, 8, 0.25)",
    iconName: "Coins",
    archetypeTitle: "High Runelord",
    suggestedActions: [
      {
        id: "arc_expenses",
        title: "Audit Today's Expenses & Financial Log",
        description: "Review cash flow, eliminate unnecessary leaks, and inspect your balance.",
        xpReward: 50,
        tag: "Audit",
      },
      {
        id: "arc_learn",
        title: "Study 1 Deep Financial Article or Model",
        description: "Level up your understanding of asset allocation, compounding, or market mechanics.",
        xpReward: 50,
        tag: "Literacy",
      },
      {
        id: "arc_save",
        title: "Execute Scheduled Savings or Investment Transfer",
        description: "Automatically compound your rune reserves before spending discretionary funds.",
        xpReward: 50,
        tag: "Compound",
      },
      {
        id: "arc_opportunity",
        title: "Identify 1 High-ROI Upskill or Equipment Upgrade",
        description: "Spot tools, books, or courses that yield disproportionate future returns.",
        xpReward: 50,
        tag: "Opportunity",
      },
    ],
  },
  mind: {
    key: "mind",
    name: "Mind / Focus",
    shortName: "MND",
    subtitle: "Mental Health & Emotional Control",
    scaling: "Therapy, meditation, stress management, clear boundaries.",
    effect:
      "Your Focus Pool (FP) for emotional regulation and deep concentration. Upgrading Mind reduces the chance of getting inflicted with status effects like Anxiety or Rage.",
    color: "#38BDF8",
    badgeBg: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    borderColor: "border-sky-500/30 hover:border-sky-500/60",
    glowColor: "rgba(56, 189, 248, 0.25)",
    iconName: "Brain",
    archetypeTitle: "Zen Arbiter",
    suggestedActions: [
      {
        id: "mnd_meditation",
        title: "10-Minute Mindfulness or Breathwork Session",
        description: "Quiet mental chatter and restore equilibrium to your autonomic nervous system.",
        xpReward: 50,
        tag: "Meditation",
      },
      {
        id: "mnd_boundary",
        title: "Enforce 1 Strict Digital Boundary",
        description: "No smartphone checks during early morning or during sacred focus hours.",
        xpReward: 50,
        tag: "Boundaries",
      },
      {
        id: "mnd_journal",
        title: "5-Minute Brain Dump / Emotional Journaling",
        description: "Externalize mental clutter onto paper to dissolve lingering anxieties.",
        xpReward: 50,
        tag: "Clarity",
      },
      {
        id: "mnd_sigh",
        title: "Practice 3 Deep Physiological Sighs Under Pressure",
        description: "Double inhale through the nose followed by long slow exhale to disarm stress.",
        xpReward: 50,
        tag: "De-stress",
      },
    ],
  },
  intelligence: {
    key: "intelligence",
    name: "Intelligence",
    shortName: "INT",
    subtitle: "Technical Skill & Mental Models",
    scaling: "Reading, specialized training, formal education, hard skills.",
    effect:
      "Unlocks complex skill trees (coding, analysis, design, engineering). High Intelligence lets you cast high-impact spells—solving hard problems in hours instead of days.",
    color: "#6366F1",
    badgeBg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    borderColor: "border-indigo-500/30 hover:border-indigo-500/60",
    glowColor: "rgba(99, 102, 241, 0.25)",
    iconName: "BookOpen",
    archetypeTitle: "Grand Archmage",
    suggestedActions: [
      {
        id: "int_reading",
        title: "Read 20 Pages of a Hard Technical Book",
        description: "Absorb deep principles and expand your conceptual vocabulary.",
        xpReward: 50,
        tag: "Reading",
      },
      {
        id: "int_coding",
        title: "45-Minute Deep Skill Practice Session",
        description: "Deliberately build a challenging component, algorithm, or craft exercise.",
        xpReward: 50,
        tag: "Hard Skills",
      },
      {
        id: "int_model",
        title: "Study & Document 1 Mental Model",
        description: "Analyze first principles, second-order thinking, or inversion in your notes.",
        xpReward: 50,
        tag: "Mental Models",
      },
      {
        id: "int_teach",
        title: "Explain a Complex Concept in Simple Words",
        description: "Feynman technique: explain a challenging idea as if teaching a beginner.",
        xpReward: 50,
        tag: "Mastery",
      },
    ],
  },
  wisdom: {
    key: "wisdom",
    name: "Wisdom / Faith",
    shortName: "WIS",
    subtitle: "Perspective, Purpose & Ethics",
    scaling: "Self-reflection, mentorship, core values, spiritual or philosophical practice.",
    effect:
      'Increases your resistance to Despair and Existential Dread. Keeps you on a consistent path when the game gets absurdly difficult, preventing you from quitting entirely ("going Hollow").',
    color: "#A855F7",
    badgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    borderColor: "border-purple-500/30 hover:border-purple-500/60",
    glowColor: "rgba(168, 85, 247, 0.25)",
    iconName: "Eye",
    archetypeTitle: "Ascended Oracle",
    suggestedActions: [
      {
        id: "wis_stoic",
        title: "Evening Stoic / Philosophical Reflection",
        description: "Reflect on what was within your control today and what was not.",
        xpReward: 50,
        tag: "Reflection",
      },
      {
        id: "wis_silence",
        title: "20 Minutes of Absolute Silence Without Media",
        description: "Unplug completely from incoming inputs to hear your internal compass.",
        xpReward: 50,
        tag: "Stillness",
      },
      {
        id: "wis_values",
        title: "Align Today's Priority with Core Mission",
        description: "Ensure your main effort connects directly to your long-term life purpose.",
        xpReward: 50,
        tag: "Purpose",
      },
      {
        id: "wis_mentorship",
        title: "Seek or Offer Perspective to a Fellow Pilgrim",
        description: "Share wisdom or ask an experienced elder for guidance on a crossroads.",
        xpReward: 50,
        tag: "Guidance",
      },
    ],
  },
  dexterity: {
    key: "dexterity",
    name: "Dexterity",
    shortName: "DEX",
    subtitle: "Adaptability & Executive Function",
    scaling: "Time management, organization, quick decision-making, hand-eye coordination.",
    effect:
      "Cast speed for daily tasks. Decreases time spent stuck in transition phases (procrastination) and lets you dodge incoming distractions smoothly.",
    color: "#14B8A6",
    badgeBg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    borderColor: "border-teal-500/30 hover:border-teal-500/60",
    glowColor: "rgba(20, 184, 166, 0.25)",
    iconName: "Target",
    archetypeTitle: "Tempest Striker",
    suggestedActions: [
      {
        id: "dex_timebox",
        title: "Timebox the Day with 3 Priority MITs",
        description: "Outline the 3 Most Important Tasks with dedicated non-negotiable blocks.",
        xpReward: 50,
        tag: "Planning",
      },
      {
        id: "dex_speed",
        title: "Apply the 2-Minute Rule to Friction Tasks",
        description: "Instantly knock out lingering small errands without letting them fester.",
        xpReward: 50,
        tag: "Execution",
      },
      {
        id: "dex_pomodoro",
        title: "2 Clean Pomodoros with Zero Tab Switching",
        description: "Sharpen your focus blade with 50 minutes of pure distraction-free flow.",
        xpReward: 50,
        tag: "Focus Flow",
      },
      {
        id: "dex_declutter",
        title: "Clear Physical Desk & Digital Desktop",
        description: "Frictionless environment eliminates transition friction and cognitive drag.",
        xpReward: 50,
        tag: "Workspace",
      },
    ],
  },
};

/**
 * Individual Stat Level Formula (starts at 0, unlimited):
 * Level 0: 0 - 49 XP (50 XP span)
 * Level 1: 50 - 119 XP (70 XP span)
 * Level 2: 120 - 209 XP (90 XP span)
 * Higher levels require progressively more XP (+20 XP per level). Unlimited progression.
 */
export function getLevelAndProgress(xp: number) {
  if (xp <= 0) {
    return {
      level: 0,
      currentLevelXp: 0,
      xpForNextLevel: 50,
      percent: 0,
    };
  }

  let level = 0;
  let accumulated = 0;

  while (true) {
    const span = 50 + level * 20;
    if (xp < accumulated + span) {
      const currentLevelXp = xp - accumulated;
      const percent = Math.min(100, Math.round((currentLevelXp / span) * 100));
      return {
        level,
        currentLevelXp,
        xpForNextLevel: span,
        percent,
      };
    }
    accumulated += span;
    level += 1;
  }
}

/**
 * Total Character Level Formula (from 0 to 200 and unlimited):
 * Higher level requires progressively more XP.
 * Level 0: 0 - 49 XP (50 XP span)
 * Level 1: 50 - 114 XP (65 XP span)
 * Level 2: 115 - 194 XP (80 XP span)
 * ...
 * Level 200: ~308,500 total XP
 * Unlimited: Continues beyond 200 (Level 201, 202, ...) with no hard ceiling.
 */
export function getTotalLevelAndProgress(totalXp: number) {
  if (totalXp <= 0) {
    return {
      level: 0,
      currentLevelXp: 0,
      xpForNextLevel: 50,
      percent: 0,
      isBeyond200: false,
    };
  }

  let level = 0;
  let accumulated = 0;

  while (true) {
    // Each level requires progressively more XP
    const span = 50 + level * 15;
    if (totalXp < accumulated + span) {
      const currentLevelXp = totalXp - accumulated;
      const percent = Math.min(100, Math.round((currentLevelXp / span) * 100));
      return {
        level,
        currentLevelXp,
        xpForNextLevel: span,
        percent,
        isBeyond200: level >= 200,
      };
    }
    accumulated += span;
    level += 1;
  }
}

export function getTierMilestone(level: number): {
  tierName: string;
  badgeColor: string;
  isMaxTier: boolean;
} {
  if (level >= 200) {
    return {
      tierName: "Transcendent Legend",
      badgeColor: "from-amber-400 via-rose-500 to-purple-500 text-white",
      isMaxTier: true,
    };
  }
  if (level >= 150) {
    return {
      tierName: "Grandmaster Ascendant",
      badgeColor: "from-purple-500 to-indigo-500 text-white",
      isMaxTier: false,
    };
  }
  if (level >= 100) {
    return {
      tierName: "Master Sovereign",
      badgeColor: "from-indigo-500 to-sky-500 text-white",
      isMaxTier: false,
    };
  }
  if (level >= 50) {
    return {
      tierName: "Heroic Paragon",
      badgeColor: "from-sky-500 to-emerald-500 text-white",
      isMaxTier: false,
    };
  }
  if (level >= 20) {
    return {
      tierName: "Adept Pioneer",
      badgeColor: "from-emerald-500 to-teal-500 text-white",
      isMaxTier: false,
    };
  }
  return {
    tierName: "Novice Aspirant",
    badgeColor: "from-blue-500 to-slate-600 text-white",
    isMaxTier: false,
  };
}

/**
 * Compute overall character title based on dominant stats and total level
 */
export function getCharacterArchetype(stats: { statKey: string; xp: number }[]): {
  title: string;
  highestStat: string;
  totalXp: number;
  totalLevel: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  percent: number;
  tierName: string;
  isBeyond200: boolean;
} {
  const totalXp = stats.reduce((acc, s) => acc + (s.xp || 0), 0);
  const { level: totalLevel, currentLevelXp, xpForNextLevel, percent, isBeyond200 } =
    getTotalLevelAndProgress(totalXp);
  const { tierName } = getTierMilestone(totalLevel);

  if (totalXp === 0) {
    return {
      title: "Tarnished Aspirant",
      highestStat: "vigor",
      totalXp: 0,
      totalLevel: 0,
      currentLevelXp: 0,
      xpForNextLevel: 50,
      percent: 0,
      tierName: "Novice Aspirant",
      isBeyond200: false,
    };
  }

  // Find stat with highest XP
  let highestStat = "vigor";
  let maxExp = -1;

  for (const s of stats) {
    if (s.xp > maxExp) {
      maxExp = s.xp;
      highestStat = s.statKey;
    }
  }

  const def = STATS_CATALOG[highestStat as StatKey];
  return {
    title: def ? def.archetypeTitle : "Grand Adventurer",
    highestStat,
    totalXp,
    totalLevel,
    currentLevelXp,
    xpForNextLevel,
    percent,
    tierName,
    isBeyond200,
  };
}
