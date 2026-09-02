"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/app/ConvexClientProvider";
import {
  Timer,
  BarChart3,
  History,
  LogOut,
  User,
  Sparkles,
  ChevronDown,
  Circle,
} from "lucide-react";
import { formatSecondsToTimer } from "@/lib/utils";

interface NavbarProps {
  activeTab: "tracker" | "analytics" | "history";
  setActiveTab: (tab: "tracker" | "analytics" | "history") => void;
  activeSessionSeconds?: number;
  hasActiveSession?: boolean;
  activeSessionName?: string;
}

export function Navbar({
  activeTab,
  setActiveTab,
  activeSessionSeconds = 0,
  hasActiveSession = false,
  activeSessionName = "",
}: NavbarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("tracker")}
            className="flex items-center gap-2.5 focus:outline-none group text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight flex items-center gap-1.5">
                Activity<span className="text-sky-400">Tracker</span>
                <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider bg-blue-500/20 border border-blue-400/30 text-sky-300 px-1.5 py-0.5 rounded">
                  AI
                </span>
              </span>
            </div>
          </button>
        </div>

        {/* Live Running Timer Pill in Header (if session active) */}
        {hasActiveSession && (
          <button
            onClick={() => setActiveTab("tracker")}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 transition-all text-xs font-mono font-medium text-sky-300 animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="truncate max-w-[120px] sm:max-w-[180px] text-white font-sans font-medium">
              {activeSessionName || "Tracking"}
            </span>
            <span className="font-bold">{formatSecondsToTimer(activeSessionSeconds)}</span>
          </button>
        )}

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "tracker"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "analytics"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "history"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </nav>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
          >
            {user?.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-sky-400/40 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <span className="hidden sm:inline text-xs font-medium text-slate-200 truncate max-w-[120px]">
              {user?.name || "My Account"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          </button>

          {/* Dropdown Content */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-[#141E33] border border-slate-700/80 rounded-2xl shadow-2xl p-2 text-sm z-50 text-slate-200">
              <div className="px-3 py-2.5 border-b border-slate-700/60 mb-1">
                <p className="font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveTab("tracker");
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <Timer className="w-4 h-4 text-sky-400" />
                  <span>Start Tracker</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("analytics");
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>View Pie Charts & Stats</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("history");
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>All Activities Log</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-700/60">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
