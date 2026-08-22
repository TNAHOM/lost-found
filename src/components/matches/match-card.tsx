"use client";

import { useState } from "react";
import { MatchResult } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchBreakdownBar } from "./match-breakdown-bar";
import { MatchComparisonModal } from "./match-comparison-modal";
import { formatDate, getMatchTierMeta } from "@/lib/utils";
import { Sparkles, ArrowRight } from "lucide-react";

export function MatchCard({ match }: { match: MatchResult }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { lostItem, foundItem, overallScore, matchTier, breakdown, explanation, status } = match;
  const tierMeta = getMatchTierMeta(matchTier, overallScore);

  return (
    <>
      <Card
        className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md bg-white border ${
          matchTier === "strong"
            ? "border-emerald-300 hover:border-emerald-400 ring-1 ring-emerald-100"
            : matchTier === "moderate"
            ? "border-amber-300 hover:border-amber-400 ring-1 ring-amber-100"
            : "border-slate-200 hover:border-slate-300"
        } ${tierMeta.glowClass}`}
      >
        {/* Top Confidence Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-mono font-bold text-sm shadow-xs">
              {overallScore}%
            </div>
            <div>
              <span className={`text-xs font-bold ${tierMeta.textColor}`}>
                {tierMeta.label}
              </span>
              <p className="text-[11px] text-slate-500">
                Auto-reconciliation confidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status !== "unreviewed" && (
              <Badge
                variant={status === "claimed" || status === "confirmed" ? "success" : "default"}
                className="text-[10px] uppercase font-bold"
              >
                {status}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs h-8 bg-white hover:bg-slate-900 hover:text-white border-slate-200 transition-colors"
            >
              <span>Compare</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Paired Items Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3.5">
          {/* Lost Preview */}
          <div className="rounded-xl bg-rose-50/70 p-3 border border-rose-200/80">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-rose-700">LOST REPORT</span>
              <span className="text-slate-500">{formatDate(lostItem.date)}</span>
            </div>
            <h5 className="font-bold text-sm text-slate-900 line-clamp-1">
              {lostItem.title}
            </h5>
            <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
              {lostItem.location}
            </p>
          </div>

          {/* Found Preview */}
          <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-200/80">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-emerald-700">FOUND REPORT</span>
              <span className="text-slate-500">{formatDate(foundItem.date)}</span>
            </div>
            <h5 className="font-bold text-sm text-slate-900 line-clamp-1">
              {foundItem.title}
            </h5>
            <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
              {foundItem.location}
            </p>
          </div>
        </div>

        {/* Explainability Snippet */}
        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/70 text-xs text-slate-700 flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed text-[11px]">
            {explanation}
          </p>
        </div>

        {/* Compact Progress Indicators */}
        <MatchBreakdownBar breakdown={breakdown} compact={true} />
      </Card>

      <MatchComparisonModal
        match={match}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
