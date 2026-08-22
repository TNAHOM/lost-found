"use client";

import { useState, useMemo } from "react";
import { useItems } from "@/lib/items-context";
import { MatchCard } from "@/components/matches/match-card";
import { MatchTier } from "@/lib/types";
import { SlidersHorizontal, Sparkles } from "lucide-react";

export default function MatchesPage() {
  const { matches, minMatchScore, setMinMatchScore } = useItems();
  const [selectedTier, setSelectedTier] = useState<"all" | MatchTier>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unreviewed" | "confirmed" | "claimed">("all");

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedTier !== "all" && m.matchTier !== selectedTier) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      return true;
    });
  }, [matches, selectedTier, statusFilter]);

  const strongCount = matches.filter((m) => m.overallScore >= 80).length;
  const moderateCount = matches.filter(
    (m) => m.overallScore >= 60 && m.overallScore < 80
  ).length;
  const lowCount = matches.filter((m) => m.overallScore < 60).length;

  return (
    <div className="space-y-6">

      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-400/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Multi-Factor Automated Matching Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Candidate Reconciliations Studio
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time cross-evaluation of lost and found reports using
              weighted description semantic vectors (50%), campus zone
              proximity (25%), and temporal decay (25%).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 text-center min-w-[90px]">
              <span className="block text-2xl font-black text-emerald-400 font-mono">
                {strongCount}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                Strong (≥80%)
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 text-center min-w-[90px]">
              <span className="block text-2xl font-black text-amber-400 font-mono">
                {moderateCount}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                Moderate (60-79%)
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 text-center min-w-[90px]">
              <span className="block text-2xl font-black text-slate-300 font-mono">
                {lowCount}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                Low (&lt;60%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="rounded-2xl bg-white p-5 shadow-2xs border border-slate-200/90 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tier & Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedTier("all")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedTier === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Tiers ({matches.length})
            </button>
            <button
              onClick={() => setSelectedTier("strong")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedTier === "strong"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              Strong ({strongCount})
            </button>
            <button
              onClick={() => setSelectedTier("moderate")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedTier === "moderate"
                  ? "bg-amber-700 text-white shadow-xs"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              Moderate ({moderateCount})
            </button>
            <button
              onClick={() => setSelectedTier("low")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedTier === "low"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              Low ({lowCount})
            </button>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "unreviewed" | "confirmed" | "claimed")
              }
              className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-semibold focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs ml-1"
            >
              <option value="all">All Review Statuses</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="confirmed">Confirmed</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>

          {/* Threshold Slider */}
          <div className="flex items-center gap-3 min-w-[240px]">
            <SlidersHorizontal className="h-4 w-4 text-slate-500 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Min Score Cutoff:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {minMatchScore}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="h-1.5 w-full appearance-none rounded-lg bg-slate-200 accent-slate-900 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Sparkles className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-base font-bold text-slate-900">
            No Candidate Matches in this View
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your score cutoff threshold slider above or switching the tier filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
