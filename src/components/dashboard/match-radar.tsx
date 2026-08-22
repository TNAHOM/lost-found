"use client";

import Link from "next/link";
import { useItems } from "@/lib/items-context";
import { MatchCard } from "@/components/matches/match-card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Zap } from "lucide-react";

export function MatchRadar() {
  const { matches } = useItems();

  const topMatches = matches.slice(0, 4);
  const strongCount = matches.filter((m) => m.overallScore >= 80).length;

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
          <Sparkles className="h-6 w-6" />
        </div>
        <h4 className="mt-3 font-bold text-slate-900">
          No Potential Matches Above Threshold
        </h4>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Submit new lost or found reports to trigger automated semantic matching.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Radar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white p-4 rounded-2xl border border-blue-100 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                AI Match Radar
              </h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                {strongCount} High Confidence
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live automated matches ranked by semantic & proximity score
            </p>
          </div>
        </div>

        <Link href="/matches">
          <Button variant="outline" size="sm" className="gap-1.5 font-medium text-xs bg-white hover:bg-slate-50 border-slate-200">
            <span>Open Match Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Grid of Top Matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
