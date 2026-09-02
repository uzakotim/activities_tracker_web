"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/ConvexClientProvider";
import { CategoryIcon } from "./CategoryIcon";
import { EditActivityModal } from "./EditActivityModal";
import { ActivityItem } from "@/lib/types";
import {
  formatDurationHuman,
  formatFriendlyDate,
  formatSecondsToTimer,
} from "@/lib/utils";
import {
  History,
  Search,
  Filter,
  Calendar,
  Clock,
  Edit2,
  FileDown,
  Inbox,
} from "lucide-react";

export function ActivityHistoryList() {
  const { user } = useAuth();
  const userId = user?.tokenIdentifier || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

  const activities = useQuery(api.activities.listActivities, {
    userId,
    limit: 200,
  });

  const availableCategories = useQuery(api.classify.getAvailableCategories);

  // Filter items
  const filteredActivities = (activities || []).filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === "all" || item.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (!activities || activities.length === 0) return;
    const headers = ["Name", "Category", "Duration (seconds)", "Duration (formatted)", "Date", "Notes"];
    const rows = activities.map((a) => [
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      a.duration,
      `"${formatDurationHuman(a.duration)}"`,
      `"${a.date}"`,
      `"${(a.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activities_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group by date
  const groupedByDate: { [dateStr: string]: typeof filteredActivities } = {};
  filteredActivities.forEach((item) => {
    if (!groupedByDate[item.date]) {
      groupedByDate[item.date] = [];
    }
    groupedByDate[item.date].push(item);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header, Search & Filter Bar */}
      <div className="bg-gradient-to-b from-[#111C38] to-[#0D152B] p-5 rounded-3xl border border-slate-700/80 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-sky-400" />
              <span>Activity History & Timeline</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredActivities.length} {filteredActivities.length === 1 ? "activity" : "activities"} logged
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!activities || activities.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all w-fit disabled:opacity-40"
          >
            <FileDown className="w-4 h-4 text-sky-400" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities or notes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-4">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="all">All Categories</option>
              {(availableCategories || []).map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      {sortedDates.length === 0 ? (
        <div className="bg-[#111C38] border border-slate-700/80 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <Inbox className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No activities found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedCategoryFilter !== "all"
              ? "Try adjusting your search or category filter."
              : "Start the stopwatch in the Tracker tab to record your first activity!"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const items = groupedByDate[dateStr];
            const dayTotalSeconds = items.reduce((acc, curr) => acc + curr.duration, 0);

            return (
              <div key={dateStr} className="space-y-2.5">
                {/* Date Header */}
                <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>{formatFriendlyDate(dateStr)}</span>
                    <span className="text-[11px] text-slate-500 font-normal">({dateStr})</span>
                  </div>
                  <span className="font-mono text-slate-400">
                    Total: {formatDurationHuman(dayTotalSeconds)}
                  </span>
                </div>

                {/* Items in this date */}
                <div className="bg-[#111C38] border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg divide-y divide-slate-800">
                  {items.map((activity) => (
                    <div
                      key={activity._id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors group"
                    >
                      {/* Left: Category Icon + Title + Notes */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                          style={{
                            backgroundColor: `${activity.categoryColor}20`,
                            color: activity.categoryColor,
                          }}
                        >
                          <CategoryIcon name={activity.categoryIcon} className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm sm:text-base text-white truncate">
                              {activity.name}
                            </h4>
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold border"
                              style={{
                                backgroundColor: `${activity.categoryColor}15`,
                                borderColor: `${activity.categoryColor}35`,
                                color: activity.categoryColor,
                              }}
                            >
                              {activity.category}
                            </span>
                          </div>

                          {activity.notes && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                              "{activity.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Duration + Edit Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-extrabold text-white font-mono">
                            {formatDurationHuman(activity.duration)}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {formatSecondsToTimer(activity.duration)}
                          </div>
                        </div>

                        <button
                          onClick={() => setEditingActivity(activity as any)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white transition-colors"
                          title="Edit activity"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </div>
  );
}
