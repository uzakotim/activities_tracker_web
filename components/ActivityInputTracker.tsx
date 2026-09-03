"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/ConvexClientProvider";
import { CategoryIcon } from "./CategoryIcon";
import { formatSecondsToTimer, getTodayDateString } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  Play,
  Pause,
  Square,
  Trash2,
  Sparkles,
  RotateCcw,
  Plus,
  Clock,
  ChevronDown,
  Tag,
  Check,
  Zap,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";

export function ActivityInputTracker({
  onActivitySaved,
  onElapsedSecondsChange,
}: {
  onActivitySaved?: () => void;
  onElapsedSecondsChange?: (seconds: number) => void;
}) {
  const { user } = useAuth();
  const userId = user?.tokenIdentifier || "";

  // Convex data
  const activeSession = useQuery(api.activities.getActiveSession, { userId });
  const recentActivities = useQuery(api.activities.getRecentActivities, { userId, limit: 10 });
  const availableCategories = useQuery(api.classify.getAvailableCategories);
  // Stable cache-buster: a new value per page load ensures getServerTime is
  // always computed fresh on the server instead of reusing a stale cache entry.
  const serverTimeRequestedAt = useMemo(() => Date.now(), []);
  const serverTime = useQuery(api.activities.getServerTime, { requestedAt: serverTimeRequestedAt });

  // Mutations
  const startSessionMutation = useMutation(api.activities.startActiveSession);
  const pauseSessionMutation = useMutation(api.activities.pauseActiveSession);
  const resumeSessionMutation = useMutation(api.activities.resumeActiveSession);
  const stopAndSaveSessionMutation = useMutation(api.activities.stopAndSaveActiveSession);
  const discardSessionMutation = useMutation(api.activities.discardActiveSession);
  const logManualActivityMutation = useMutation(api.activities.logManualActivity);

  // Input states
  const [activityInput, setActivityInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"stopwatch" | "manual">("stopwatch");

  // Manual entry fields
  const [manualHours, setManualHours] = useState<number>(0);
  const [manualMinutes, setManualMinutes] = useState<number>(30);
  const [manualDate, setManualDate] = useState<string>(getTodayDateString());
  const [manualNotes, setManualNotes] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Active timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  // Estimated offset (ms) to convert client Date.now() → Convex server time.
  // Computed once per page load from getServerTime; corrects cross-device
  // timer display when the device clock differs from the server clock.
  const clockSkewMs = useRef(0);
  // High-precision local anchor set right after start/resume on THIS device.
  // When available it overrides the skew-corrected calculation to guarantee
  // an exact 0:00 start without waiting for the server-time query.
  const localTimerRefAt = useRef<number | null>(null);

  // Real-time AI classification query for current input
  const aiClassification = useQuery(
    api.classify.classify,
    activityInput.trim() ? { userId, text: activityInput.trim() } : "skip"
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const categoryPickerRef = useRef<HTMLDivElement>(null);

  // Update selected category when AI classifies, unless user manually chose one
  useEffect(() => {
    if (aiClassification && !selectedCategory) {
      // automatically preview the AI classified category
    }
  }, [aiClassification, selectedCategory]);

  // Compute clock skew once the server-time query returns.
  // clockSkewMs = serverNow - clientNow  (negative when client is ahead).
  useEffect(() => {
    if (serverTime != null) {
      clockSkewMs.current = serverTime - Date.now();
    }
  }, [serverTime]);

  // Sync elapsed seconds from activeSession
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (!activeSession) {
      setElapsedSeconds(0);
      // Clear local ref so next session always starts fresh.
      localTimerRefAt.current = null;
      return;
    }

    const updateTimer = () => {
      const accumulated = activeSession.accumulatedSeconds ?? 0;

      if (activeSession.isPaused) {
        setElapsedSeconds(accumulated);
        onElapsedSecondsChange?.(accumulated);
        return;
      }

      let diff: number;

      if (localTimerRefAt.current != null) {
        // Same page lifetime as the start/resume: use the local anchor for an
        // exact count that never jumps due to server timestamp rounding.
        diff = Math.max(0, Math.floor((Date.now() - localTimerRefAt.current) / 1000));
      } else {
        // Different device or page reload: correct client Date.now() for clock
        // skew so both devices show the same elapsed time.
        const serverAdjustedNow = Date.now() + clockSkewMs.current;
        const startedAt = activeSession.startedAt;
        if (!startedAt || !Number.isFinite(startedAt)) {
          setElapsedSeconds(accumulated);
          return;
        }
        diff = Math.max(0, Math.floor((serverAdjustedNow - startedAt) / 1000));
      }

      const next = accumulated + diff;
      setElapsedSeconds(next);
      onElapsedSecondsChange?.(next);
    };

    // Immediately sync the display.
    updateTimer();

    if (!activeSession.isPaused) {
      interval = setInterval(updateTimer, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    activeSession?.startedAt,
    activeSession?.accumulatedSeconds,
    activeSession?.isPaused,
  ]);
  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        categoryPickerRef.current &&
        !categoryPickerRef.current.contains(e.target as Node)
      ) {
        setIsCategoryPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine current active preview category
  const currentCategoryName =
    selectedCategory ||
    (aiClassification ? aiClassification.category : "Activity");
  const currentCategoryColor =
    selectedColor ||
    (aiClassification ? aiClassification.categoryColor : "#3B82F6");
  const currentCategoryIcon =
    selectedIcon ||
    (aiClassification ? aiClassification.categoryIcon : "Clock");

  // Filter autocomplete suggestions based on input
  const filteredSuggestions = (recentActivities || []).filter((item) =>
    item.name.toLowerCase().includes(activityInput.trim().toLowerCase())
  );

  const handleStartStopwatch = async (nameOverride?: string) => {
    const targetName = (nameOverride || activityInput).trim();
    if (!targetName) return;

    try {
      await startSessionMutation({
        userId,
        activityName: targetName,
        category: selectedCategory || (aiClassification?.category ?? undefined),
        categoryColor: selectedColor || (aiClassification?.categoryColor ?? undefined),
        categoryIcon: selectedIcon || (aiClassification?.categoryIcon ?? undefined),
      });
      // Record the local time right after the mutation succeeds so the timer
      // always starts from 0 on this device, regardless of server clock skew.
      localTimerRefAt.current = Date.now();
      setActivityInput("");
      setSelectedCategory(null);
      setSelectedColor(null);
      setSelectedIcon(null);
      setShowSuggestions(false);
    } catch (err) {
      console.error("Failed to start session", err);
    }
  };

  const handlePause = async () => {
    if (!userId) return;
    // Clear the local ref; the paused accumulated time comes from the server.
    localTimerRefAt.current = null;
    await pauseSessionMutation({ userId });
  };

  const handleResume = async () => {
    if (!userId) return;
    await resumeSessionMutation({ userId });
    // Record local time at resume so the clock continues without skew.
    localTimerRefAt.current = Date.now();
  };

  const handleStopAndSave = async () => {
    if (!userId || isSaving) return;
    setIsSaving(true);
    try {
      await stopAndSaveSessionMutation({
        userId,
        notes: notes.trim() || undefined,
        finalCategory: selectedCategory || activeSession?.category,
        finalCategoryColor: selectedColor || activeSession?.categoryColor,
        finalCategoryIcon: selectedIcon || activeSession?.categoryIcon,
      });

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#38BDF8", "#3B82F6", "#818CF8", "#34D399"],
      });

      setNotes("");
      setSelectedCategory(null);
      setSelectedColor(null);
      setSelectedIcon(null);
      if (onActivitySaved) onActivitySaved();
    } catch (err) {
      console.error("Failed to save session", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!userId) return;
    if (confirm("Are you sure you want to discard this timer without saving?")) {
      await discardSessionMutation({ userId });
      setNotes("");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = activityInput.trim();
    if (!name) return;

    const totalSecs = manualHours * 3600 + manualMinutes * 60;
    if (totalSecs <= 0) {
      alert("Please enter a duration greater than 0 minutes.");
      return;
    }

    setManualSubmitting(true);
    try {
      await logManualActivityMutation({
        userId,
        name,
        category: currentCategoryName,
        categoryColor: currentCategoryColor,
        categoryIcon: currentCategoryIcon,
        durationSeconds: totalSecs,
        dateStr: manualDate,
        notes: manualNotes.trim() || undefined,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      setActivityInput("");
      setManualHours(0);
      setManualMinutes(30);
      setManualNotes("");
      setSelectedCategory(null);
      if (onActivitySaved) onActivitySaved();
    } catch (err) {
      console.error("Manual log failed", err);
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center gap-2 bg-slate-900/60 p-1 rounded-2xl border border-slate-800 w-fit mx-auto">
        <button
          onClick={() => setMode("stopwatch")}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${mode === "stopwatch"
            ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
            : "text-slate-400 hover:text-white"
            }`}
        >
          <Clock className="w-4 h-4" />
          <span>Live Stopwatch</span>
        </button>

        <button
          onClick={() => setMode("manual")}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${mode === "manual"
            ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
            : "text-slate-400 hover:text-white"
            }`}
        >
          <Plus className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* Main Tracker Container */}
      <div className="relative isolate overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-b from-[#111C38] to-[#0D152B] p-6 shadow-2xl shadow-black/40 sm:p-8">
        {/* Subtle decorative glow */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full opacity-30 transition-colors duration-500"
          style={{
            background: `radial-gradient(circle, ${activeSession
              ? activeSession.categoryColor
              : currentCategoryColor
              } 0%, transparent 60%)`,
          }}
        />

        {/* ACTIVE STOPWATCH RUNNING STATE */}
        {activeSession ? (
          <div className="space-y-6 text-center">
            {/* Header pill with category badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md shadow-sm overflow-hidden"
              style={{
                backgroundColor: `${activeSession.categoryColor}15`,
                borderColor: `${activeSession.categoryColor}40`,
                color: activeSession.categoryColor,
              }}
            >
              <CategoryIcon name={activeSession.categoryIcon} className="w-4 h-4" />
              <span>{activeSession.category}</span>
            </div>

            {/* Activity Name */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight break-words">
                {activeSession.activityName}
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                <span className={`w-2 h-2 rounded-4xl ${activeSession.isPaused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
                {activeSession.isPaused ? "Paused" : "Currently Tracking"}
              </p>
            </div>

            {/* Stopwatch Display */}
            <div className="py-4">
              <div className="inline-block p-6 sm:p-8 rounded-3xl bg-slate-950/60 border border-slate-800 shadow-inner">
                <span className="font-mono text-5xl sm:text-7xl font-bold tracking-tight text-white select-all">
                  {formatSecondsToTimer(elapsedSeconds)}
                </span>
              </div>
            </div>

            {/* Session Notes input (optional) */}
            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes for this session (optional)..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {/* Pause / Resume Button */}
              {activeSession.isPaused ? (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/30 active:scale-95 transition-all"
                >
                  <Pause className="w-5 h-5 fill-white" />
                  <span>Pause</span>
                </button>
              )}

              {/* Stop & Save Button */}
              <button
                onClick={handleStopAndSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                <Square className="w-5 h-5 fill-white" />
                <span>{isSaving ? "Saving..." : "Stop & Save"}</span>
              </button>

              {/* Discard Button */}
              <button
                onClick={handleDiscard}
                title="Discard session"
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700/80 active:scale-95 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : mode === "stopwatch" ? (
          /* STOPWATCH INPUT / START STATE */
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center justify-between">
                <span>What are you doing?</span>
                <span className="text-[11px] text-sky-400 font-normal flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI categorizes automatically
                </span>
              </label>

              {/* Input field with AI preview badge */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={activityInput}
                  onChange={(e) => {
                    setActivityInput(e.target.value);
                    setShowSuggestions(true);
                    setSelectedCategory(null);
                    setSelectedColor(null);
                    setSelectedIcon(null);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && activityInput.trim()) {
                      handleStartStopwatch();
                    }
                  }}
                  placeholder="e.g. Hollow Knight, LeetCode, Gym leg day, Reading..."
                  className="w-full px-5 py-4 pr-32 rounded-2xl bg-slate-950/70 border border-slate-700 text-base sm:text-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner font-medium"
                />

                {/* AI Badge inside input */}
                {activityInput.trim() && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border backdrop-blur-md shadow-sm transition-all hover:scale-105 active:scale-95 overflow-hidden"
                      style={{
                        backgroundColor: `${currentCategoryColor}20`,
                        borderColor: `${currentCategoryColor}50`,
                        color: currentCategoryColor,
                      }}
                    >
                      <CategoryIcon name={currentCategoryIcon} className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[80px] sm:max-w-[100px]">
                        {currentCategoryName}
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>
                  </div>
                )}

                {/* Autocomplete suggestions dropdown */}
                {showSuggestions && activityInput.trim() && filteredSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-full mt-2 bg-[#141F3B] border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 max-h-56 overflow-y-auto space-y-1 backdrop-blur-xl overflow-hidden"
                  >
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Previous Activities
                    </div>
                    {filteredSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActivityInput(item.name);
                          setSelectedCategory(item.category);
                          setSelectedColor(item.categoryColor);
                          setSelectedIcon(item.categoryIcon);
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm hover:bg-white/10 text-white transition-colors group"
                      >
                        <span className="font-medium truncate">{item.name}</span>
                        <div
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium border"
                          style={{
                            backgroundColor: `${item.categoryColor}15`,
                            borderColor: `${item.categoryColor}40`,
                            color: item.categoryColor,
                          }}
                        >
                          <CategoryIcon name={item.categoryIcon} className="w-3 h-3" />
                          <span>{item.category}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Category Manual Selector Popup */}
            {isCategoryPickerOpen && (
              <div
                ref={categoryPickerRef}
                className="bg-slate-900/95 border border-slate-700 rounded-2xl p-4 shadow-2xl space-y-3 z-30"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-slate-300">Choose Category Override</span>
                  <button
                    onClick={() => setIsCategoryPickerOpen(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Done
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {(availableCategories || []).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setSelectedColor(cat.color);
                        setSelectedIcon(cat.icon);
                        setIsCategoryPickerOpen(false);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all text-left ${selectedCategory === cat.name
                        ? "border-blue-500 bg-blue-500/20 text-white"
                        : "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300"
                        }`}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick-Start Activity Memory Chips */}
            {recentActivities && recentActivities.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <RotateCcw className="w-3 h-3 text-sky-400" /> Quick Start Previous:
                </span>
                <div className="flex flex-wrap gap-2">
                  {recentActivities.slice(0, 6).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        handleStartStopwatch(item.name);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-4xl text-xs font-medium bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white transition-all hover:scale-105 active:scale-95 group shadow-sm"
                    >
                      <span
                        className="w-2 h-2 rounded-4xl"
                        style={{ backgroundColor: item.categoryColor }}
                      />
                      <span className="truncate max-w-[130px] font-medium">{item.name}</span>
                      <Play className="w-3 h-3 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity fill-sky-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start Stopwatch Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleStartStopwatch()}
                disabled={!activityInput.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-base sm:text-lg shadow-xl shadow-blue-500/25 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-4xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                </div>
                <span>Start Stopwatch</span>
              </button>
            </div>
          </div>
        ) : (
          /* MANUAL ENTRY FORM */
          <form onSubmit={handleManualSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center justify-between">
                <span>Activity Name</span>
                <span className="text-[11px] text-sky-400 font-normal flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-classified
                </span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={activityInput}
                  onChange={(e) => {
                    setActivityInput(e.target.value);
                    setSelectedCategory(null);
                  }}
                  placeholder="e.g. Hollow Knight, Gym Workout, Coding, Reading..."
                  required
                  className="w-full px-5 py-3.5 pr-32 rounded-2xl bg-slate-950/70 border border-slate-700 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-medium"
                />

                {activityInput.trim() && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border backdrop-blur-md shadow-sm hover:scale-105 overflow-hidden"
                      style={{
                        backgroundColor: `${currentCategoryColor}20`,
                        borderColor: `${currentCategoryColor}50`,
                        color: currentCategoryColor,
                      }}
                    >
                      <CategoryIcon name={currentCategoryIcon} className="w-3.5 h-3.5" />
                      <span>{currentCategoryName}</span>
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Category Manual Selector Popup for Manual Mode */}
            {isCategoryPickerOpen && (
              <div
                ref={categoryPickerRef}
                className="bg-slate-900/95 border border-slate-700 rounded-2xl p-4 shadow-2xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-slate-300">Choose Category</span>
                  <button
                    type="button"
                    onClick={() => setIsCategoryPickerOpen(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Done
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto">
                  {(availableCategories || []).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setSelectedColor(cat.color);
                        setSelectedIcon(cat.icon);
                        setIsCategoryPickerOpen(false);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all text-left ${selectedCategory === cat.name
                        ? "border-blue-500 bg-blue-500/20 text-white"
                        : "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300"
                        }`}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Duration & Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" /> Duration
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={manualHours}
                      onChange={(e) => setManualHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-transparent text-white font-mono text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-semibold ml-1">hrs</span>
                  </div>

                  <div className="flex-1 flex items-center bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-transparent text-white font-mono text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-semibold ml-1">mins</span>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" /> Date
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-[100%] min-w-0 max-w-full box-border px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" /> Notes (Optional)
              </label>
              <input
                type="text"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Details about what you worked on..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!activityInput.trim() || manualSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{manualSubmitting ? "Logging Activity..." : "Log Activity"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
