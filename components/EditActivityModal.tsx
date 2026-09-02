"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/ConvexClientProvider";
import { CategoryIcon } from "./CategoryIcon";
import { ActivityItem } from "@/lib/types";
import { X, Check, Trash2, Clock, FileText, Tag } from "lucide-react";

interface EditActivityModalProps {
  activity: ActivityItem;
  onClose: () => void;
}

export function EditActivityModal({ activity, onClose }: EditActivityModalProps) {
  const { user } = useAuth();
  const userId = user?.tokenIdentifier || "";

  const availableCategories = useQuery(api.classify.getAvailableCategories);
  const updateMutation = useMutation(api.activities.updateActivity);
  const deleteMutation = useMutation(api.activities.deleteActivity);

  const [name, setName] = useState(activity.name);
  const [category, setCategory] = useState(activity.category);
  const [categoryColor, setCategoryColor] = useState(activity.categoryColor);
  const [categoryIcon, setCategoryIcon] = useState(activity.categoryIcon);
  const [hours, setHours] = useState(Math.floor(activity.duration / 3600));
  const [minutes, setMinutes] = useState(Math.floor((activity.duration % 3600) / 60));
  const [seconds, setSeconds] = useState(activity.duration % 60);
  const [notes, setNotes] = useState(activity.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) {
      alert("Duration must be at least 1 second.");
      return;
    }

    setIsSaving(true);
    try {
      await updateMutation({
        activityId: activity._id as any,
        userId,
        name: name.trim(),
        category,
        categoryColor,
        categoryIcon,
        durationSeconds: totalSeconds,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this activity log?")) {
      try {
        await deleteMutation({
          activityId: activity._id as any,
          userId,
        });
        onClose();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#111C38] border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <span>Edit Activity Log</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Activity Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
              {(availableCategories || []).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.name);
                    setCategoryColor(cat.color);
                    setCategoryIcon(cat.icon);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all text-left ${
                    category === cat.name
                      ? "border-blue-500 bg-blue-500/20 text-white"
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-3 h-3" />
                  </div>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-transparent text-white font-mono text-sm focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold ml-1">h</span>
              </div>

              <div className="flex items-center bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-transparent text-white font-mono text-sm focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold ml-1">m</span>
              </div>

              <div className="flex items-center bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-transparent text-white font-mono text-sm focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold ml-1">s</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Session notes..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
