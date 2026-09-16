"use client";

import React, { useState, useMemo } from "react";
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
  StatDefinition,
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
  Trophy,
  Loader2,
  ArrowRight,
  Clock,
  Crown,
  Shuffle,
  LayoutGrid,
  List,
  Info,
  X,
  Check,
  Award,
  ChevronLeft,
  ChevronRight,
  Dices,
  SlidersHorizontal,
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

type FilterType = "all" | "pending" | "completed";
type ViewMode = "carousel" | "grid" | "list";

export function CharacterStatsView() {
  const { user } = useAuth();
  const userId = user?.tokenIdentifier || "";
  const today = getTodayDateString();

  // Convex Queries & Mutations
  const statsData = useQuery(
    api.stats.getUserStats,
    userId ? { userId, date: today } : "skip"
  );
  const recentHistory = useQuery(
    api.stats.getRecentStatCompletions,
    userId ? { userId, limit: 6 } : "skip"
  );
  const completeActionMutation = useMutation(api.stats.completeStatAction);

  // Local state
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, number>>({});
  const [activeModalStat, setActiveModalStat] = useState<StatKey | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("carousel");
  const [completingKey, setCompletingKey] = useState<string | null>(null);
  const [highlightedStatKey, setHighlightedStatKey] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    statName: string;
    color: string;
  } | null>(null);

  // Character archetype & stats
  const archetype = useMemo(() => {
    if (!statsData?.stats) return null;
    return getCharacterArchetype(statsData.stats);
  }, [statsData?.stats]);

  // Suggested daily focus stat (lowest XP among uncompleted today)
  const suggestedStatKey = (statsData?.dailySuggestedStatKey as StatKey | null) || null;
  const suggestedStatDef = suggestedStatKey ? STATS_CATALOG[suggestedStatKey] : null;
  const suggestedStatRecord = suggestedStatKey
    ? statsData?.stats.find((s) => s.statKey === suggestedStatKey)
    : null;

  const activeSuggestedActionIndex = suggestedStatKey
    ? selectedSuggestions[suggestedStatKey] || 0
    : 0;

  const activeHeroAction: DailyActionSuggestion | null = suggestedStatDef
    ? suggestedStatDef.suggestedActions[
    activeSuggestedActionIndex % suggestedStatDef.suggestedActions.length
    ]
    : null;

  // Filtered stats list
  const filteredStats = useMemo(() => {
    if (!statsData?.stats) return [];
    if (filter === "pending") return statsData.stats.filter((s) => !s.isCompletedToday);
    if (filter === "completed") return statsData.stats.filter((s) => s.isCompletedToday);
    return statsData.stats;
  }, [statsData?.stats, filter]);

  // Handle stat completion
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
        confetti({
          particleCount: 60,
          spread: 75,
          origin: { y: 0.65 },
          colors: [statDef.color, "#38BDF8", "#F59E0B", "#10B981"],
        });

        setToastNotification({
          message: `+${res.xpGained} XP! ${statDef.name} Fortified (${res.newStreak}d streak 🔥)`,
          statName: statDef.name,
          color: statDef.color,
        });

        setTimeout(() => setToastNotification(null), 4500);
      }
    } catch (err) {
      console.error("Failed to complete stat action:", err);
    } finally {
      setCompletingKey(null);
    }
  };

  const cycleSuggestion = (key: string, max: number) => {
    setSelectedSuggestions((prev) => ({
      ...prev,
      [key]: ((prev[key] || 0) + 1) % max,
    }));
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = 335;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return;
    const cardElement = carouselRef.current.children[index] as HTMLElement;
    if (cardElement) {
      cardElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  };

  const spinCarousel = () => {
    if (isSpinning || !filteredStats.length) return;
    setIsSpinning(true);

    const pending = filteredStats.filter((s) => !s.isCompletedToday);
    const pool = pending.length > 0 ? pending : filteredStats;
    const targetStat = pool[Math.floor(Math.random() * pool.length)];
    const targetIdx = filteredStats.findIndex((s) => s.statKey === targetStat.statKey);

    let stepCount = 0;
    const totalSteps = 12 + Math.floor(Math.random() * 5);
    let interval = 75;

    const runStep = () => {
      stepCount++;
      const currentIdx = (targetIdx + stepCount) % filteredStats.length;
      scrollToCard(currentIdx);

      if (stepCount < totalSteps) {
        interval += 22;
        setTimeout(runStep, interval);
      } else {
        scrollToCard(targetIdx);
        setHighlightedStatKey(targetStat.statKey);
        setIsSpinning(false);
        const def = STATS_CATALOG[targetStat.statKey as StatKey];
        confetti({
          particleCount: 50,
          spread: 65,
          origin: { y: 0.7 },
          colors: [def?.color || "#38BDF8", "#F59E0B", "#10B981"],
        });
        setTimeout(() => setHighlightedStatKey(null), 4000);
      }
    };

    runStep();
  };

  // Skeleton / Loading State
  if (!statsData || !archetype) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-slate-800 rounded-lg" />
              <div className="h-4 w-64 bg-slate-800/60 rounded-lg" />
            </div>
            <div className="hidden sm:flex gap-3">
              <div className="h-12 w-24 bg-slate-800 rounded-xl" />
              <div className="h-12 w-24 bg-slate-800 rounded-xl" />
            </div>
          </div>
          <div className="h-3 w-full bg-slate-800/80 rounded-full" />
        </div>

        {/* Quest Skeleton */}
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-5 h-28" />

        {/* Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-5 h-44 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-20 bg-slate-800 rounded" />
                  <div className="h-3 w-12 bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="h-2 bg-slate-800 rounded-full" />
              <div className="h-9 bg-slate-800/70 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxStreak = Math.max(0, ...statsData.stats.map((s) => s.streak));
  const pendingCount = statsData.totalStatsCount - statsData.completedTodayCount;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-14 animate-fadeIn">
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 right-4 z-50 animate-bounce bg-slate-900/95 border border-sky-400/40 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="text-sm font-semibold">{toastNotification.message}</span>
        </div>
      )}

      {/* 1. Streamlined Hero Character Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e162e] via-[#101b38] to-[#0c1326] border border-slate-700/60 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Top row: Profile info & Quick Stat Pills */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            {/* User Identity */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {user?.pictureUrl ? (
                  <img
                    src={user.pictureUrl}
                    alt={user.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-sky-400/60 object-cover shadow-lg shadow-sky-500/20"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl border-2 border-sky-400/60 shadow-lg shadow-sky-500/20">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                  </div>
                )}
                <div className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow border border-yellow-100/60 flex items-center gap-0.5">
                  <Crown className="w-3 h-3 text-slate-950" />
                  <span>LVL {archetype.totalLevel}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {user?.name || "Adventurer"}
                  </h1>
                  <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-sky-400/30">
                    {archetype.title}
                  </span>
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                    {archetype.tierName}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Fortify stats daily to level up your real-world character
                </p>
              </div>
            </div>

            {/* 4 Metric Badges in unified strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl px-3 py-2 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Total XP
                </span>
                <span className="text-base font-black text-sky-400 font-mono">
                  {statsData.totalXp.toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl px-3 py-2 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Today
                </span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {statsData.completedTodayCount}/{statsData.totalStatsCount}
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl px-3 py-2 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Streak
                </span>
                <span className="text-base font-black text-amber-400 font-mono flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {maxStreak}d
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl px-3 py-2 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Dominant
                </span>
                <span className="text-xs font-bold text-indigo-300 capitalize truncate block">
                  {STATS_CATALOG[archetype.highestStat as StatKey]?.shortName || archetype.highestStat}
                </span>
              </div>
            </div>
          </div>

          {/* Unified Progress Visualizer: Level progress & 8-Segment alignment */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            {/* Level XP Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Level {archetype.totalLevel}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-400">Level {archetype.totalLevel + 1}</span>
                </span>
                <span className="text-amber-300 font-bold">
                  {archetype.currentLevelXp} / {archetype.xpForNextLevel} XP ({archetype.percent}%)
                </span>
              </div>
              <div className="w-full bg-slate-950/90 h-2 rounded-full overflow-hidden border border-slate-800/90">
                <div
                  className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${archetype.percent}%` }}
                />
              </div>
            </div>

            {/* 8-Segment Interactive Daily Alignment Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <span>Daily Fortification Alignment</span>
                  <span className="text-[11px] font-mono text-sky-400">
                    ({statsData.completedTodayCount}/{statsData.totalStatsCount} completed)
                  </span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {Math.round((statsData.completedTodayCount / statsData.totalStatsCount) * 100)}%
                </span>
              </div>

              {/* 8 Attribute Slots */}
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                {statsData.stats.map((st) => {
                  const def = STATS_CATALOG[st.statKey as StatKey];
                  const isDone = st.isCompletedToday;
                  const IconComp = STAT_ICONS[def.iconName] || Shield;

                  return (
                    <button
                      key={st.statKey}
                      onClick={() => setActiveModalStat(st.statKey as StatKey)}
                      title={`${def.name}: ${isDone ? "Fortified Today ✓" : "Pending"}`}
                      className={`group relative py-1.5 px-1 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${isDone
                        ? "bg-emerald-500/15 border-emerald-500/40 shadow-sm shadow-emerald-500/10 text-emerald-300"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300"
                        }`}
                    >
                      <IconComp
                        className="w-3.5 h-3.5 transition-transform group-hover:scale-110"
                        style={{ color: isDone ? def.color : undefined }}
                      />
                      <span className="text-[9px] font-bold uppercase tracking-wider font-mono">
                        {def.shortName}
                      </span>
                      {isDone && (
                        <div
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-950 flex items-center justify-center"
                          style={{ backgroundColor: def.color }}
                        >
                          <Check className="w-1.5 h-1.5 text-slate-950 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Compact Actionable Daily Focus (Oracle Quest) */}
      {!statsData.allCompletedToday && suggestedStatDef && suggestedStatRecord && activeHeroAction && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#101b38]/90 to-slate-900/90 border border-sky-400/40 p-4 sm:p-5 shadow-lg backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center border shadow-md shrink-0"
                style={{
                  backgroundColor: `${suggestedStatDef.color}20`,
                  borderColor: `${suggestedStatDef.color}60`,
                }}
              >
                {(() => {
                  const IconComp = STAT_ICONS[suggestedStatDef.iconName] || Shield;
                  return <IconComp className="w-5 h-5" style={{ color: suggestedStatDef.color }} />;
                })()}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-400 bg-sky-500/15 border border-sky-400/30 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    Daily Focus • Least Fortified
                  </span>
                  <span className="text-xs font-bold text-white">
                    {suggestedStatDef.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (LVL {suggestedStatRecord.level})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="font-semibold text-slate-100 truncate">
                    {activeHeroAction.title}
                  </span>
                  <button
                    onClick={() =>
                      cycleSuggestion(
                        suggestedStatDef.key,
                        suggestedStatDef.suggestedActions.length
                      )
                    }
                    title="Try another habit"
                    className="p-1 rounded-md text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <Shuffle className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Fortify CTA Button */}
            <button
              onClick={() => handleCompleteStat(suggestedStatDef.key as StatKey, activeHeroAction)}
              disabled={completingKey === suggestedStatDef.key}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shrink-0"
            >
              {completingKey === suggestedStatDef.key ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Fortifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete Focus (+{activeHeroAction.xpReward} XP)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Celebratory Banner if All 8 are Completed */}
      {statsData.allCompletedToday && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border border-emerald-500/40 p-4 sm:p-5 text-center space-y-1.5 shadow-lg backdrop-blur-md">
          <div className="inline-flex items-center gap-2 text-emerald-400 font-extrabold text-sm sm:text-base">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>All 8 Attributes Fortified Today!</span>
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You have achieved complete character harmony for today. Streaks preserved!
          </p>
        </div>
      )}

      {/* 3. Toolbar: Filters, Roulette Spin & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === "all"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
              }`}
          >
            All ({statsData.totalStatsCount})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${filter === "pending"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
              }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
            <span className="text-[11px] font-mono">({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === "completed"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
              }`}
          >
            Fortified ({statsData.completedTodayCount})
          </button>
        </div>

        {/* Right controls: Spin Roulette & View Switcher */}
        <div className="flex items-center justify-end gap-2">
          {/* Spin Roulette Button */}
          {/* <button
            onClick={spinCarousel}
            disabled={isSpinning || filteredStats.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Spin roulette to focus a random pending stat"
          >
            <Dices className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
            <span>Spin Roulette</span>
          </button> */}

          {/* View Toggle (Carousel vs Grid vs Compact List) */}
          {/* <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("carousel")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === "carousel"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
                }`}
              title="Horizontal Carousel View"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Carousel</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === "grid"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
                }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === "list"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
                }`}
              title="Compact List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div> */}
        </div>
      </div>

      {/* 4A. HORIZONTAL CAROUSEL VIEW */}
      {viewMode === "carousel" && (
        <div className="space-y-3">
          {/* Header & Quick Scroll Arrows */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Attribute Carousel
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({filteredStats.length} attributes)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollCarousel("left")}
                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCarousel("right")}
                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Carousel Scroll Track with Floating Arrow Buttons */}
          <div className="relative group/carousel">
            {/* Left Floating Arrow */}
            <button
              onClick={() => scrollCarousel("left")}
              className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/95 border border-slate-700/80 text-white shadow-xl items-center justify-center hover:bg-blue-600 hover:border-blue-400/50 hover:scale-110 active:scale-95 transition-all opacity-80 group-hover/carousel:opacity-100"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Horizontal Track */}
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-2 px-1 scroll-smooth scrollbar-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filteredStats.map((stat) => {
                const def = STATS_CATALOG[stat.statKey as StatKey];
                if (!def) return null;

                const { level, currentLevelXp, xpForNextLevel, percent } =
                  getLevelAndProgress(stat.xp);
                const IconComp = STAT_ICONS[def.iconName] || Shield;
                const isCompleting = completingKey === stat.statKey;
                const currentSuggestionIdx = selectedSuggestions[stat.statKey] || 0;
                const currentSuggestion =
                  def.suggestedActions[currentSuggestionIdx % def.suggestedActions.length];
                const isHighlighted = highlightedStatKey === stat.statKey;

                return (
                  <div
                    key={stat.statKey}
                    className={`rounded-2xl bg-gradient-to-b from-[#0F1833]/90 to-[#0B132B]/95 border transition-all duration-300 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-5 relative group shrink-0 snap-center w-[285px] sm:w-[315px] md:w-[335px] ${isHighlighted
                      ? "ring-2 ring-amber-400 shadow-2xl shadow-amber-500/25 border-amber-400/80 scale-[1.02]"
                      : stat.isCompletedToday
                        ? "border-emerald-500/30 shadow-sm shadow-emerald-500/5"
                        : `${def.borderColor} hover:shadow-lg hover:shadow-black/30`
                      }`}
                  >
                    <div className="space-y-3">
                      {/* Card Header: Icon, Name, Level, Streak */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm shrink-0"
                            style={{
                              backgroundColor: `${def.color}15`,
                              borderColor: `${def.color}40`,
                            }}
                          >
                            <IconComp className="w-5 h-5" style={{ color: def.color }} />
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-extrabold text-sm text-white truncate">
                              {def.name}
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate">
                              {def.subtitle}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveModalStat(stat.statKey as StatKey)}
                          title="View scaling & lore"
                          className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800 shrink-0"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Level & Streak Row */}
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-black text-white px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/80 text-[11px]">
                          LVL {level}
                        </span>
                        <div className="flex items-center gap-1 font-bold text-amber-400 text-[11px]">
                          <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{stat.streak}d streak</span>
                        </div>
                      </div>

                      {/* XP Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>{stat.xp} XP</span>
                          <span>
                            {currentLevelXp}/{xpForNextLevel} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950/80 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: def.color,
                              width: `${percent}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Active Habit Snippet */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-300 font-medium truncate">
                          {currentSuggestion.title}
                        </span>
                        <button
                          onClick={() =>
                            cycleSuggestion(stat.statKey, def.suggestedActions.length)
                          }
                          title="Next habit suggestion"
                          className="text-slate-500 hover:text-sky-300 transition-colors p-0.5 shrink-0"
                        >
                          <Shuffle className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card Footer: Action Button */}
                    <div className="pt-3 mt-3 border-t border-slate-800/70">
                      {stat.isCompletedToday ? (
                        <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Fortified Today</span>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            handleCompleteStat(stat.statKey as StatKey, currentSuggestion)
                          }
                          disabled={isCompleting}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold text-white transition-all bg-blue-600/90 hover:bg-blue-600 border border-blue-500/40 shadow-sm shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                        >
                          {isCompleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Fortify (+50 XP)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Floating Arrow */}
            <button
              onClick={() => scrollCarousel("right")}
              className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/95 border border-slate-700/80 text-white shadow-xl items-center justify-center hover:bg-blue-600 hover:border-blue-400/50 hover:scale-110 active:scale-95 transition-all opacity-80 group-hover/carousel:opacity-100"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Position Indicator Pills / Mini-map */}
          <div className="flex items-center justify-center gap-1.5 pt-1 flex-wrap">
            {filteredStats.map((stat, idx) => {
              const def = STATS_CATALOG[stat.statKey as StatKey];
              const isDone = stat.isCompletedToday;
              const isHighlighted = highlightedStatKey === stat.statKey;

              return (
                <button
                  key={stat.statKey}
                  onClick={() => scrollToCard(idx)}
                  title={`Jump to ${def.name}`}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all flex items-center gap-1 ${isHighlighted
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40"
                    : isDone
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                >
                  <span>{def.shortName}</span>
                  {isDone && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4A-ALT. GRID VIEW: Multi-column Card Grid */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredStats.map((stat) => {
            const def = STATS_CATALOG[stat.statKey as StatKey];
            if (!def) return null;

            const { level, currentLevelXp, xpForNextLevel, percent } =
              getLevelAndProgress(stat.xp);
            const IconComp = STAT_ICONS[def.iconName] || Shield;
            const isCompleting = completingKey === stat.statKey;
            const currentSuggestionIdx = selectedSuggestions[stat.statKey] || 0;
            const currentSuggestion =
              def.suggestedActions[currentSuggestionIdx % def.suggestedActions.length];
            const isHighlighted = highlightedStatKey === stat.statKey;

            return (
              <div
                key={stat.statKey}
                className={`rounded-2xl bg-gradient-to-b from-[#0F1833]/90 to-[#0B132B]/95 border transition-all duration-200 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-5 relative group ${isHighlighted
                  ? "ring-2 ring-amber-400 shadow-2xl shadow-amber-500/25 border-amber-400/80"
                  : stat.isCompletedToday
                    ? "border-emerald-500/30 shadow-sm shadow-emerald-500/5"
                    : `${def.borderColor} hover:shadow-lg hover:shadow-black/30`
                  }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Icon, Name, Level, Streak */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm shrink-0"
                        style={{
                          backgroundColor: `${def.color}15`,
                          borderColor: `${def.color}40`,
                        }}
                      >
                        <IconComp className="w-5 h-5" style={{ color: def.color }} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-white truncate">
                          {def.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {def.subtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveModalStat(stat.statKey as StatKey)}
                      title="View scaling & lore"
                      className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800 shrink-0"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Level & Streak Row */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-black text-white px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/80 text-[11px]">
                      LVL {level}
                    </span>
                    <div className="flex items-center gap-1 font-bold text-amber-400 text-[11px]">
                      <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{stat.streak}d streak</span>
                    </div>
                  </div>

                  {/* XP Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{stat.xp} XP</span>
                      <span>
                        {currentLevelXp}/{xpForNextLevel} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950/80 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: def.color,
                          width: `${percent}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Active Habit Snippet */}
                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-300 font-medium truncate">
                      {currentSuggestion.title}
                    </span>
                    <button
                      onClick={() =>
                        cycleSuggestion(stat.statKey, def.suggestedActions.length)
                      }
                      title="Next habit suggestion"
                      className="text-slate-500 hover:text-sky-300 transition-colors p-0.5 shrink-0"
                    >
                      <Shuffle className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Card Footer: Action Button */}
                <div className="pt-3 mt-3 border-t border-slate-800/70">
                  {stat.isCompletedToday ? (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fortified Today</span>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        handleCompleteStat(stat.statKey as StatKey, currentSuggestion)
                      }
                      disabled={isCompleting}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold text-white transition-all bg-blue-600/90 hover:bg-blue-600 border border-blue-500/40 shadow-sm shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {isCompleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Fortify (+50 XP)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4B. COMPACT LIST VIEW: High Efficiency Morning Checklist */}
      {viewMode === "list" && (
        <div className="space-y-2">
          {filteredStats.map((stat) => {
            const def = STATS_CATALOG[stat.statKey as StatKey];
            if (!def) return null;

            const { level, currentLevelXp, xpForNextLevel, percent } =
              getLevelAndProgress(stat.xp);
            const IconComp = STAT_ICONS[def.iconName] || Shield;
            const isCompleting = completingKey === stat.statKey;
            const currentSuggestionIdx = selectedSuggestions[stat.statKey] || 0;
            const currentSuggestion =
              def.suggestedActions[currentSuggestionIdx % def.suggestedActions.length];

            return (
              <div
                key={stat.statKey}
                className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0F1833]/80 border transition-all ${stat.isCompletedToday
                  ? "border-emerald-500/30"
                  : "border-slate-800 hover:border-slate-700"
                  }`}
              >
                {/* Left: Icon, Name & Level */}
                <div className="flex items-center gap-3 min-w-[180px]">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
                    style={{
                      backgroundColor: `${def.color}15`,
                      borderColor: `${def.color}40`,
                    }}
                  >
                    <IconComp className="w-4 h-4" style={{ color: def.color }} />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-white">
                        {def.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                        LVL {level}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                      <Flame className="w-2.5 h-2.5 fill-amber-400" />
                      <span>{stat.streak}d streak</span>
                    </div>
                  </div>
                </div>

                {/* Center: Recommended Habit */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-xs text-slate-300 truncate">
                    {currentSuggestion.title}
                  </span>
                  <button
                    onClick={() =>
                      cycleSuggestion(stat.statKey, def.suggestedActions.length)
                    }
                    title="Next suggestion"
                    className="text-slate-500 hover:text-sky-300 p-0.5"
                  >
                    <Shuffle className="w-3 h-3" />
                  </button>
                </div>

                {/* Mini Progress */}
                <div className="w-24 hidden md:block">
                  <div className="text-[10px] font-mono text-slate-400 text-right mb-0.5">
                    {currentLevelXp}/{xpForNextLevel} XP
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: def.color,
                        width: `${percent}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Right: Action Button & Info */}
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    onClick={() => setActiveModalStat(stat.statKey as StatKey)}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
                    title="View details"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>

                  {stat.isCompletedToday ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg min-w-[125px] justify-center">
                      <Check className="w-3.5 h-3.5" />
                      <span>Fortified</span>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        handleCompleteStat(stat.statKey as StatKey, currentSuggestion)
                      }
                      disabled={isCompleting}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500/30 transition-all min-w-[125px] disabled:opacity-50"
                    >
                      {isCompleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Fortify (+50)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Recent Fortifications Log (Compact Stream) */}
      {recentHistory && recentHistory.length > 0 && (
        <div className="rounded-2xl bg-[#0F1833]/70 border border-slate-800 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Recent Fortifications</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Activity log
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {recentHistory.map((item) => {
              const def = STATS_CATALOG[item.statKey as StatKey];
              const dateStr = new Date(item.completedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={item._id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5 text-xs"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center border shrink-0"
                    style={{
                      backgroundColor: `${def?.color || "#38BDF8"}15`,
                      borderColor: `${def?.color || "#38BDF8"}40`,
                    }}
                  >
                    <CheckCircle2
                      className="w-3.5 h-3.5"
                      style={{ color: def?.color || "#38BDF8" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-white truncate text-[11px]">
                        {def?.name || item.statKey}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        +{item.xpGained} XP
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.actionTitle}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono shrink-0">
                    {dateStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Focused Lore & Training Habits Modal */}
      {activeModalStat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#0F1833] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            {(() => {
              const def = STATS_CATALOG[activeModalStat];
              const statRecord = statsData.stats.find((s) => s.statKey === activeModalStat);
              const { level, currentLevelXp, xpForNextLevel, percent } = getLevelAndProgress(
                statRecord?.xp || 0
              );
              const IconComp = STAT_ICONS[def.iconName] || Shield;

              return (
                <>
                  <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/60">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-md shrink-0"
                        style={{
                          backgroundColor: `${def.color}20`,
                          borderColor: `${def.color}50`,
                        }}
                      >
                        <IconComp className="w-6 h-6" style={{ color: def.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black text-white">{def.name}</h2>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {def.shortName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{def.subtitle}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveModalStat(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body: Scrollable */}
                  <div className="p-5 overflow-y-auto space-y-5 text-xs">
                    {/* Level Progress */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-white">Level {level}</span>
                        <span className="text-slate-400">
                          {currentLevelXp} / {xpForNextLevel} XP ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            backgroundColor: def.color,
                            width: `${percent}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Scaling Lore */}
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Zap className="w-3 h-3 text-sky-400" />
                        <span>Scaling Factors</span>
                      </span>
                      <p className="text-slate-400 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                        {def.scaling}
                      </p>
                    </div>

                    {/* RPG Effect */}
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span>In-Game RPG Effect</span>
                      </span>
                      <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        {def.effect}
                      </p>
                    </div>

                    {/* 4 Suggested Daily Training Habits */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px]">
                          Choose Training Habit
                        </span>
                        <span className="text-[10px] text-slate-500">Click to fortify</span>
                      </div>

                      <div className="space-y-2">
                        {def.suggestedActions.map((action) => (
                          <div
                            key={action.id}
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-200">
                                  {action.title}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  {action.tag}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-normal">
                                {action.description}
                              </p>
                            </div>

                            {!statRecord?.isCompletedToday ? (
                              <button
                                onClick={() => {
                                  handleCompleteStat(activeModalStat, action);
                                  setActiveModalStat(null);
                                }}
                                disabled={completingKey === activeModalStat}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 transition-all shrink-0 shadow-sm"
                              >
                                Done (+50)
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shrink-0">
                                Fortified
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

