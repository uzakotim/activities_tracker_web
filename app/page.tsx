"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/ConvexClientProvider";
import { AuthScreen } from "@/components/AuthScreen";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ActivityInputTracker } from "@/components/ActivityInputTracker";
import { AnalyticsPieChart } from "@/components/AnalyticsPieChart";
import { ActivityHistoryList } from "@/components/ActivityHistoryList";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sparkles, Loader2 } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const userId = user?.tokenIdentifier || "";

  const [activeTab, setActiveTab] = useState<"tracker" | "analytics" | "history">("tracker");

  // Query active session for global indicator
  const activeSession = useQuery(api.activities.getActiveSession, { userId });
  // Track elapsed seconds from the tracker component so Navbar stays in sync
  const [activeSeconds, setActiveSeconds] = useState(0);

  // Reset header timer when session ends
  useEffect(() => {
    if (!activeSession) setActiveSeconds(0);
  }, [activeSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B132B] flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading Activity Tracker...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0B132B] text-white flex flex-col selection:bg-blue-500 selection:text-white relative">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveSession={!!activeSession}
        activeSessionSeconds={activeSeconds}
        activeSessionName={activeSession?.activityName}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 md:pb-12 z-10">
        {activeTab === "tracker" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                What are you working on?
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Type an activity and AI will auto-categorize it, start your stopwatch, and log your hours.
              </p>
            </div>
            <ActivityInputTracker
              onActivitySaved={() => setActiveTab("analytics")}
              onElapsedSecondsChange={setActiveSeconds}
            />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6 animate-fadeIn">
            <AnalyticsPieChart />
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6 animate-fadeIn">
            <ActivityHistoryList />
          </div>
        )}
      </main>

      {/* Mobile Floating Bottom Nav */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveSession={!!activeSession}
      />
    </div>
  );
}
