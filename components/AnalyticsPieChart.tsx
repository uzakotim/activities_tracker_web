"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/ConvexClientProvider";
import { CategoryIcon } from "./CategoryIcon";
import {
  formatDurationHuman,
  formatHoursHuman,
  getTodayDateString,
  MONTH_NAMES,
} from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  PieChart as PieIcon,
  Flame,
  Clock,
  Award,
  BarChart2,
  Layers,
} from "lucide-react";

type TimeframeType = "daily" | "monthly" | "yearly" | "all";

export function AnalyticsPieChart() {
  const { user } = useAuth();
  const userId = user?.tokenIdentifier || "";

  const [timeframe, setTimeframe] = useState<TimeframeType>("daily");

  // Date states for navigation
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Fetch stats from Convex
  const stats = useQuery(api.activities.getCategoryStats, {
    userId,
    timeframe,
    date: timeframe === "daily" ? selectedDate : undefined,
    year: timeframe === "monthly" || timeframe === "yearly" ? selectedYear : undefined,
    month: timeframe === "monthly" ? selectedMonth : undefined,
  });

  // Navigation handlers
  const handlePrevPeriod = () => {
    if (timeframe === "daily") {
      const parts = selectedDate.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() - 1);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const dy = String(d.getDate()).padStart(2, "0");
      setSelectedDate(`${yr}-${mo}-${dy}`);
    } else if (timeframe === "monthly") {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else if (timeframe === "yearly") {
      setSelectedYear(selectedYear - 1);
    }
  };

  const handleNextPeriod = () => {
    if (timeframe === "daily") {
      const parts = selectedDate.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + 1);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const dy = String(d.getDate()).padStart(2, "0");
      setSelectedDate(`${yr}-${mo}-${dy}`);
    } else if (timeframe === "monthly") {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    } else if (timeframe === "yearly") {
      setSelectedYear(selectedYear + 1);
    }
  };

  const getPeriodLabel = () => {
    if (timeframe === "daily") {
      const today = getTodayDateString();
      if (selectedDate === today) return "Today";
      const parts = selectedDate.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: parts[0] !== now.getFullYear() ? "numeric" : undefined,
      });
    } else if (timeframe === "monthly") {
      return `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
    } else if (timeframe === "yearly") {
      return `Year ${selectedYear}`;
    }
    return "All Time";
  };

  const categories = stats?.categories || [];
  const totalSeconds = stats?.totalSeconds || 0;
  const totalHours = stats?.totalHours || 0;

  // Compute SVG Donut Chart Paths
  const renderDonutSlices = () => {
    if (!categories.length || totalSeconds === 0) {
      return (
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="#1E293B"
          strokeWidth="28"
        />
      );
    }

    const radius = 80;
    const center = 100;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;

    return categories.map((cat, idx) => {
      const fraction = cat.seconds / totalSeconds;
      const strokeDash = fraction * circumference;
      const strokeDashoffset = circumference - strokeDash;
      const angle = (accumulatedAngle / totalSeconds) * 360;
      accumulatedAngle += cat.seconds;

      const isHovered = hoveredCategory === cat.name;

      return (
        <circle
          key={idx}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={cat.color}
          strokeWidth={isHovered ? "34" : "28"}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeDashoffset={-((angle / 360) * circumference)}
          strokeLinecap="butt"
          className="transition-all duration-300 cursor-pointer hover:opacity-95"
          onMouseEnter={() => setHoveredCategory(cat.name)}
          onMouseLeave={() => setHoveredCategory(null)}
          onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
        />
      );
    });
  };

  const activeHoverCategory = categories.find((c) => c.name === hoveredCategory);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-b from-[#111C38] to-[#0D152B] p-4 sm:p-5 rounded-3xl border border-slate-700/80 shadow-xl backdrop-blur-md overflow-hidden">
        {/* Timeframe Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-2xl border border-slate-800 w-full sm:w-fit justify-center">
          <button
            onClick={() => setTimeframe("daily")}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              timeframe === "daily"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeframe("monthly")}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              timeframe === "monthly"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeframe("yearly")}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              timeframe === "yearly"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Per Year
          </button>
          <button
            onClick={() => setTimeframe("all")}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              timeframe === "all"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Time
          </button>
        </div>

        {/* Date Navigator */}
        {timeframe !== "all" && (
          <div className="flex items-center gap-2 bg-slate-950/70 px-3 py-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={handlePrevPeriod}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-semibold text-white min-w-[110px] text-center">
              {getPeriodLabel()}
            </span>
            <button
              onClick={handleNextPeriod}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Time */}
        <div className="bg-[#111C38] border border-slate-700/80 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Time</span>
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {formatDurationHuman(totalSeconds)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{totalHours} hrs total</p>
          </div>
        </div>

        {/* Top Category */}
        <div className="bg-[#111C38] border border-slate-700/80 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Category</span>
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-white truncate">
              {stats?.topCategory?.name || "None"}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {stats?.topCategory ? `${stats.topCategory.percentage}% of time` : "No entries yet"}
            </p>
          </div>
        </div>

        {/* Sessions Count */}
        <div className="bg-[#111C38] border border-slate-700/80 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sessions</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {stats?.activityCount || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">logged activities</p>
          </div>
        </div>

        {/* Category Count */}
        <div className="bg-[#111C38] border border-slate-700/80 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Categories</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {categories.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">distinct types</p>
          </div>
        </div>
      </div>

      {/* Main Chart + Breakdown Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive SVG Pie / Donut Chart */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#111C38] to-[#0D152B] border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center relative backdrop-blur-md overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-sky-400" />
            <span>Category Distribution</span>
          </h3>

          <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full -rotate-90 transform origin-center drop-shadow-md"
            >
              {renderDonutSlices()}
            </svg>

            {/* Central Donut Hub Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {activeHoverCategory ? (
                <div className="space-y-0.5 animate-fadeIn">
                  <span
                    className="text-xs font-bold uppercase tracking-wider block"
                    style={{ color: activeHoverCategory.color }}
                  >
                    {activeHoverCategory.name}
                  </span>
                  <span className="text-2xl font-extrabold text-white block">
                    {formatHoursHuman(activeHoverCategory.hours)}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold block">
                    {activeHoverCategory.percentage}%
                  </span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Time
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-white block">
                    {totalHours}h
                  </span>
                  <span className="text-[11px] text-sky-400 font-medium block">
                    {getPeriodLabel()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            Hover or tap any slice to see category details & hours spent
          </p>
        </div>

        {/* Right: Detailed Category Breakdown Table */}
        <div className="lg:col-span-7 bg-gradient-to-b from-[#111C38] to-[#0D152B] border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-sky-400" />
              <span>Hours Spent by Category</span>
            </h3>
            <span className="text-xs text-slate-400">{categories.length} categories</span>
          </div>

          {categories.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <PieIcon className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium">No activities recorded for this period.</p>
              <p className="text-xs text-slate-500">
                Start tracking in the Tracker tab to see your pie chart!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {categories.map((cat, idx) => {
                const isExpanded = expandedCategory === cat.name;
                const isHovered = hoveredCategory === cat.name;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredCategory(cat.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isHovered || isExpanded
                        ? "bg-slate-900/90 border-slate-600 shadow-md"
                        : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    {/* Category Summary Row */}
                    <button
                      onClick={() =>
                        setExpandedCategory(isExpanded ? null : cat.name)
                      }
                      className="w-full p-3.5 flex items-center justify-between text-left gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                          }}
                        >
                          <CategoryIcon name={cat.icon} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-white truncate block">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {cat.count} {cat.count === 1 ? "session" : "sessions"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-white">
                          {formatHoursHuman(cat.hours)}
                        </div>
                        <div
                          className="text-xs font-semibold"
                          style={{ color: cat.color }}
                        >
                          {cat.percentage}%
                        </div>
                      </div>
                    </button>

                    {/* Progress Bar */}
                    <div className="px-3.5 pb-2">
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Sub-activities drill-down on expand */}
                    {isExpanded && cat.activities && cat.activities.length > 0 && (
                      <div className="px-3.5 pb-3 pt-1 border-t border-slate-800/60 bg-slate-950/60 space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block pt-1">
                          Activities in {cat.name}:
                        </span>
                        {cat.activities.map((act, aIdx) => (
                          <div
                            key={aIdx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/[0.03] text-slate-300"
                          >
                            <span className="truncate font-medium">{act.name}</span>
                            <span className="font-mono text-slate-400 ml-2">
                              {formatDurationHuman(act.seconds)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
