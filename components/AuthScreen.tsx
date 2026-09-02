"use client";

import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/app/ConvexClientProvider";
import {
  Sparkles,
  Timer,
  PieChart,
  BrainCircuit,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Play,
} from "lucide-react";

export function AuthScreen() {
  const { loginWithGoogle, loginAsDemoUser } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#0B132B] text-white flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sky-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Timer className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
              Activity<span className="text-sky-400">Tracker</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-500/20 border border-blue-400/30 text-sky-300 px-1.5 py-0.5 rounded">
                AI
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loginAsDemoUser}
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 text-sky-400 fill-sky-400" /> Demo Preview
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-8 md:py-12 flex flex-col lg:flex-row items-center gap-12 z-10">
        {/* Left column: Value Proposition */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/50 border border-blue-700/50 text-sky-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>Smart AI Activity Categorization & Analytics</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
            Track your time, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-400 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
              classified instantly by AI.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Just type what you are doing — from <span className="text-white font-medium bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">"Hollow Knight"</span> to <span className="text-white font-medium bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">"Writing Next.js code"</span>. AI classifies it, starts your stopwatch, and shows your daily, monthly, and yearly time distribution.
          </p>

          {/* Interactive Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-blue-500/20 text-sky-400 mt-0.5">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">AI Classification</h4>
                <p className="text-xs text-slate-400">Zero manual tagging. Intelligent category detection.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Live Stopwatch</h4>
                <p className="text-xs text-slate-400">Real-time tracking that stays synced across reloads.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Pie Chart Analytics</h4>
                <p className="text-xs text-slate-400">Daily, monthly & yearly breakdowns at a glance.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Smart Memory</h4>
                <p className="text-xs text-slate-400">Quick 1-tap chips remember your past activities.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Login Card */}
        <div className="w-full max-w-md">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.1] to-white/[0.03] border border-white/[0.15] backdrop-blur-xl shadow-2xl shadow-black/50 text-center relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
              <Timer className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Get Started</h2>
            <p className="text-slate-300 text-sm mb-8">
              Sign in with your Google account to sync your activities and track your time seamlessly.
            </p>

            {errorMsg && (
              <div className="mb-6 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs text-left">
                {errorMsg}
              </div>
            )}

            {/* Google Login Component */}
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-full flex justify-center py-2">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    setIsLoggingIn(true);
                    setErrorMsg(null);
                    try {
                      await loginWithGoogle(credentialResponse);
                    } catch (err: any) {
                      setErrorMsg(err?.message || "Failed to sign in with Google. Please try again.");
                    } finally {
                      setIsLoggingIn(false);
                    }
                  }}
                  onError={() => {
                    setErrorMsg("Google sign in was unsuccessful. Please check popup settings.");
                  }}
                  useOneTap
                  theme="filled_blue"
                  shape="pill"
                  size="large"
                  text="signin_with"
                  width="300"
                />
              </div>

              {/* Demo Mode Fallback */}
              <div className="w-full pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={loginAsDemoUser}
                  className="w-full py-3 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <span>Continue with Demo Profile</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Secure Google OAuth 2.0 & Real-time Convex DB</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-400 z-10">
        © {new Date().getFullYear()} Activity Tracker AI • Built with Next.js, Convex, and Google OAuth
      </footer>
    </div>
  );
}
