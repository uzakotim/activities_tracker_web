"use client";

import React from "react";
import { Timer, BarChart3, History } from "lucide-react";

interface MobileBottomNavProps {
  activeTab: "tracker" | "analytics" | "history";
  setActiveTab: (tab: "tracker" | "analytics" | "history") => void;
  hasActiveSession?: boolean;
}

export function MobileBottomNav({
  activeTab,
  setActiveTab,
  hasActiveSession = false,
}: MobileBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0B132B]/90 backdrop-blur-xl border-t border-slate-800 px-6 py-2 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tracker Tab */}
        <button
          onClick={() => setActiveTab("tracker")}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all relative ${
            activeTab === "tracker"
              ? "text-sky-400 font-semibold scale-105"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <Timer className="w-5 h-5" />
            {hasActiveSession && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[11px]">Tracker</span>
        </button>

        {/* Analytics Tab */}
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === "analytics"
              ? "text-sky-400 font-semibold scale-105"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[11px]">Analytics</span>
        </button>

        {/* History Tab */}
        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === "history"
              ? "text-sky-400 font-semibold scale-105"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[11px]">History</span>
        </button>
      </div>
    </div>
  );
}
