"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/ConvexClientProvider";
import { getTodayDateString } from "@/lib/utils";
import {
  STATS_CATALOG,
  StatKey,
  STAT_KEYS,
  getLevelAndProgress,
  getCharacterArchetype,
  DailyActionSuggestion,
} from "@/lib/statsData";
import confetti from "canvas-confetti";
import {
  Heart,
  Zap,
  Users,
  Coins,
  Brain,
  BookOpen,
  Eye,
  Target,
  Flame,
  Shield,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trophy,
  Loader2,
  ArrowRight,
  HelpCircle,
  Clock,
  Circle,
  Crown,
} from "lucide-react";

const STAT_ICONS: Record<string, React.ElementType> = {
  Heart,
  Zap,
  Users,
  Coins,
  Brain,
  BookOpen,
  Eye,
  Target,
};

export function CharacterStatsView() {
  const { user } = useAuth();
  const userId = user?.tokenIdentifier || "";
  const today = getTodayDateString();

  // Queries & Mutations
  const statsData = useQuery(api.stats.getUserStats, { userId, date: today });
  const recentHistory = useQuery(api.stats.getRecentStatCompletions, { userId, limit: 6 });
  const completeActionMutation = useMutation(api.stats.completeStatAction);

  // Local state
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, number>>({});
  const [expandedStats, setExpandedStats] = useState<Record<string, boolean>>({});
  const [completingKey, setCompletingKey] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<{
    message: string;
    statName: string;
    color: string;
  } | null>(null);

  if (!statsData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Accessing Character Sheet...</p>
      </div>
    );
  }

  // Calculate character archetype & stats
  const archetype = getCharacterArchetype(statsData.stats);
  const suggestedStatKey = statsData.dailySuggestedStatKey as StatKey | null;
  const suggestedStatDef = suggestedStatKey ? STATS_CATALOG[suggestedStatKey] : null;
  const suggestedStatRecord = suggestedStatKey
    ? statsData.stats.find((s) => s.statKey === suggestedStatKey)
    : null;

  // Active suggested action for the hero banner
  const activeSuggestedActionIndex = suggestedStatKey
    ? selectedSuggestions[suggestedStatKey] || 0
    : 0;
  const activeHeroAction: DailyActionSuggestion | null = suggestedStatDef
    ? suggestedStatDef.suggestedActions[activeSuggestedActionIndex % suggestedStatDef.suggestedActions.length]
    : null;

  // Complete action handler
  const handleCompleteStat = async (statKey: StatKey, action?: DailyActionSuggestion) => {
    if (completingKey) return;
    setCompletingKey(statKey);

    const statDef = STATS_CATALOG[statKey];
    const actionToLog =
      action?.title ||
      statDef.suggestedActions[0]?.title ||
      "Daily Fortification";
    const xpReward = action?.xpReward || 50;

    try {
      const res = await completeActionMutation({
        userId,
        statKey,
        date: today,
        actionTitle: actionToLog,
        xpReward,
      });

      if (res.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.65 },
          colors: [statDef.color, "#38BDF8", "#F59E0B", "#10B981"],
        });

        setLastNotification({
          message: `+${res.xpGained} XP! ${statDef.name} fortified (${res.newStreak} day streak 🔥)`,
          statName: statDef.name,
          color: statDef.color,
        });

        setTimeout(() => {
          setLastNotification(null);
        }, 5000);
      }
    } catch (err) {
      console.error("Failed to complete stat action:", err);
    } finally {
      setCompletingKey(null);
    }
  };

  const toggleStatExpand = (key: string) => {
    setExpandedStats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cycleSuggestion = (key: string, max: number) => {
    setSelectedSuggestions((prev) => ({
      ...prev,
      [key]: ((prev[key] || 0) + 1) % max,
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {lastNotification && (
        <div className="fixed top-20 right-4 z-50 animate-bounce bg-slate-900/95 border border-sky-400/40 text-white px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="text-sm font-medium">{lastNotification.message}</span>
        </div>
      )}

      {/* Hero Character Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#101A36]/90 border border-slate-700/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar & Character Identity */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              {user?.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt={user.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-sky-400/50 object-cover shadow-lg shadow-sky-500/20"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-2xl border-2 border-sky-400/50 shadow-lg shadow-sky-500/20">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "H"}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-full shadow border border-yellow-200/40 flex items-center gap-1">
                <Crown className="w-3 h-3 text-slate-950" />
                <span>LVL {archetype.totalLevel}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {user?.name || "The Tarnished"}
                </h1>
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-sky-400/30">
                  {archetype.title}
                </span>
                <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                  {archetype.tierName}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Life RPG Character Sheet • Level 0 to 200+ Unlimited Progression • Fortify stats daily
              </p>
            </div>
          </div>

          {/* Overall Stats Badges */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-between sm:justify-start border-t md:border-t-0 pt-4 md:pt-0 border-slate-800 flex-wrap">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-center min-w-[85px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Total Level
              </span>
              <span className="text-lg font-black text-amber-400 font-mono">
                LVL {archetype.totalLevel}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-center min-w-[85px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Total XP
              </span>
              <span className="text-lg font-black text-sky-400 font-mono">
                {statsData.totalXp}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-center min-w-[95px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Fortified Today
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {statsData.completedTodayCount} / {statsData.totalStatsCount}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-center min-w-[85px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Dominant Stat
              </span>
              <span className="text-sm font-bold text-indigo-400 capitalize">
                {archetype.highestStat}
              </span>
            </div>
          </div>
        </div>

        {/* Character Total Level & Daily Progress Bars */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-4">
          {/* Character Level Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Level {archetype.totalLevel}</span>
                <span className="text-slate-400 font-normal">
                  ({archetype.isBeyond200 ? "Ascended Beyond 200" : "0 to 200+ Unlimited Progression"})
                </span>
              </span>
              <span className="text-amber-300 font-bold">
                {archetype.currentLevelXp} / {archetype.xpForNextLevel} XP to LVL {archetype.totalLevel + 1} ({archetype.percent}%)
              </span>
            </div>
            <div className="w-full bg-slate-900/90 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${archetype.percent}%`,
                }}
              />
            </div>
          </div>

          {/* Daily Attribute Alignment Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">
                Daily Fortification Alignment ({statsData.completedTodayCount}/{statsData.totalStatsCount} attributes completed today)
              </span>
              <span className="text-sky-300 font-bold font-mono">
                {Math.round((statsData.completedTodayCount / statsData.totalStatsCount) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-900/90 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(statsData.completedTodayCount / statsData.totalStatsCount) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Heroic Suggestion Banner (Least Experienced Stat) */}
      {suggestedStatDef && suggestedStatRecord && activeHeroAction && (
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900/95 via-[#121c3b] to-slate-900/95 border-2 border-sky-400/40 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/40 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Daily Oracle Quest • Least Fortified Attribute
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Currently: {suggestedStatRecord.xp} XP (LVL {suggestedStatRecord.level})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border shadow"
                  style={{
                    backgroundColor: `${suggestedStatDef.color}20`,
                    borderColor: `${suggestedStatDef.color}50`,
                  }}
                >
                  {(() => {
                    const IconComp = STAT_ICONS[suggestedStatDef.iconName] || Shield;
                    return <IconComp className="w-5 h-5" style={{ color: suggestedStatDef.color }} />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Upgrade {suggestedStatDef.name}
                  </h3>
                  <p className="text-xs text-slate-400">{suggestedStatDef.subtitle}</p>
                </div>
              </div>

              {/* Action Suggestion Box */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 mt-2 max-w-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                    Recommended Action
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-sky-300 font-mono">
                    +{activeHeroAction.xpReward} XP
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-100">{activeHeroAction.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{activeHeroAction.description}</p>
              </div>
            </div>

            {/* CTA Button & Alternate Suggestion */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 w-full lg:w-auto">
              <button
                onClick={() => handleCompleteStat(suggestedStatDef.key as StatKey, activeHeroAction)}
                disabled={completingKey === suggestedStatDef.key}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {completingKey === suggestedStatDef.key ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fortifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Quest (+{activeHeroAction.xpReward} XP)</span>
                  </>
                )}
              </button>

              <button
                onClick={() =>
                  cycleSuggestion(
                    suggestedStatDef.key,
                    suggestedStatDef.suggestedActions.length
                  )
                }
                className="text-xs text-slate-400 hover:text-sky-300 transition-colors py-1 flex items-center justify-center gap-1"
              >
                <span>Different suggestion?</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Completed Today Banner */}
      {statsData.allCompletedToday && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border-2 border-emerald-500/40 p-6 text-center space-y-2 shadow-xl backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-400/40">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white">All 8 Attributes Fortified Today!</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            You have achieved complete character balance for today. Return tomorrow to maintain your streaks and ascend further!
          </p>
        </div>
      )}

      {/* Attribute Sheet Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <span>Character Attributes ({statsData.stats.length})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Track level progression, daily streaks, scaling sources, and active RPG effects
          </p>
        </div>
      </div>

      {/* 8 Stats Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {statsData.stats.map((stat) => {
          const def = STATS_CATALOG[stat.statKey as StatKey];
          if (!def) return null;

          const { level, currentLevelXp, xpForNextLevel, percent } =
            getLevelAndProgress(stat.xp);
          const isExpanded = !!expandedStats[stat.statKey];
          const IconComp = STAT_ICONS[def.iconName] || Shield;
          const isCompleting = completingKey === stat.statKey;
          const currentSuggestionIdx = selectedSuggestions[stat.statKey] || 0;
          const currentSuggestion =
            def.suggestedActions[currentSuggestionIdx % def.suggestedActions.length];

          return (
            <div
              key={stat.statKey}
              className={`rounded-2xl bg-[#0F1833]/90 border transition-all duration-300 backdrop-blur-md overflow-hidden ${
                stat.isCompletedToday
                  ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                  : def.borderColor
              }`}
            >
              {/* Card Header & Main Stats */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-md"
                      style={{
                        backgroundColor: `${def.color}18`,
                        borderColor: `${def.color}45`,
                      }}
                    >
                      <IconComp className="w-6 h-6" style={{ color: def.color }} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-base sm:text-lg text-white">
                          {def.name}
                        </h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {def.shortName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{def.subtitle}</p>
                    </div>
                  </div>

                  {/* Level & Streak Badges */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-sm font-black text-white px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700">
                      LVL {level}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400 font-mono">
                      <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{stat.streak}d streak</span>
                    </div>
                  </div>
                </div>

                {/* XP Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      XP: <strong className="text-white">{stat.xp}</strong>
                    </span>
                    <span className="text-slate-400">
                      Next: <span className="text-sky-300">{currentLevelXp} / {xpForNextLevel} XP</span> ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900/90 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: def.color,
                        width: `${percent}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Status & Quick Action Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  {stat.isCompletedToday ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fortified Today (+50 XP)</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCompleteStat(stat.statKey as StatKey, currentSuggestion)}
                      disabled={isCompleting}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all bg-blue-600/90 hover:bg-blue-600 border border-blue-500/40 shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {isCompleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Mark Done (+50 XP)</span>
                    </button>
                  )}

                  {/* Toggle details accordion */}
                  <button
                    onClick={() => toggleStatExpand(stat.statKey)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors p-1"
                  >
                    <span>{isExpanded ? "Hide Details" : "Scaling & Lore"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable Lore, Scaling & Action Suggestions */}
              {isExpanded && (
                <div className="bg-slate-950/70 border-t border-slate-800/90 p-5 space-y-4 text-xs">
                  {/* Scaling */}
                  <div className="space-y-1">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Zap className="w-3 h-3 text-sky-400" />
                      <span>Scaling</span>
                    </span>
                    <p className="text-slate-400 leading-relaxed">{def.scaling}</p>
                  </div>

                  {/* RPG Effect */}
                  <div className="space-y-1">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <span>In-Game Effect</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      {def.effect}
                    </p>
                  </div>

                  {/* Suggested Daily Habits */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                        Suggested Training Actions
                      </span>
                      <span className="text-[10px] text-slate-400">Click to complete</span>
                    </div>

                    <div className="space-y-1.5">
                      {def.suggestedActions.map((action) => (
                        <div
                          key={action.id}
                          className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-colors"
                        >
                          <div className="space-y-0.5 flex-1">
                            <p className="font-semibold text-slate-200">{action.title}</p>
                            <p className="text-[11px] text-slate-400">{action.description}</p>
                          </div>
                          {!stat.isCompletedToday && (
                            <button
                              onClick={() => handleCompleteStat(stat.statKey as StatKey, action)}
                              disabled={isCompleting}
                              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600/30 hover:bg-blue-600 text-sky-300 hover:text-white border border-blue-500/30 transition-all shrink-0 disabled:opacity-50"
                            >
                              Done
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Completion Logs */}
      {recentHistory && recentHistory.length > 0 && (
        <div className="rounded-2xl bg-[#0F1833]/80 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Recent Fortification Log</span>
            </h3>
            <span className="text-xs text-slate-400">Chronicle of upgrades</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentHistory.map((item) => {
              const def = STATS_CATALOG[item.statKey as StatKey];
              const dateStr = new Date(item.completedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={item._id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${def?.color || "#38BDF8"}15`,
                      borderColor: `${def?.color || "#38BDF8"}40`,
                    }}
                  >
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: def?.color || "#38BDF8" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">
                        {def?.name || item.statKey}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        +{item.xpGained} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.actionTitle}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">{dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
