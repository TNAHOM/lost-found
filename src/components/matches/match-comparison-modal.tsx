"use client";

import Link from "next/link";
import { MatchResult } from "@/lib/types";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchBreakdownBar } from "./match-breakdown-bar";
import { formatDate, formatTimeOfDay, getCategoryLabel, getMatchTierMeta } from "@/lib/utils";
import { useItems } from "@/lib/items-context";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
  Calendar,
  User,
  Building,
  Tag,
  ShieldCheck,
} from "lucide-react";

export function MatchComparisonModal({
  match,
  isOpen,
  onClose,
}: {
  match: MatchResult | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { updateMatchStatus, updateItemStatus } = useItems();

  if (!match) return null;

  const { lostItem, foundItem, overallScore, matchTier, breakdown, explanation, highlights } = match;
  const tierMeta = getMatchTierMeta(matchTier, overallScore);

  const handleConfirm = () => {
    updateMatchStatus(match.id, "confirmed");
    updateItemStatus(lostItem.id, "potential_match");
    updateItemStatus(foundItem.id, "potential_match");
    onClose();
  };

  const handleMarkClaimed = () => {
    updateMatchStatus(match.id, "claimed");
    updateItemStatus(lostItem.id, "claimed");
    updateItemStatus(foundItem.id, "claimed");
    onClose();
  };

  const handleReject = () => {
    updateMatchStatus(match.id, "rejected");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Match Analysis & Side-by-Side Comparison"
      description="Inspect semantic similarities, campus location proximity, and timeline chronology."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Match Header Score Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
                <span className="text-xl font-black font-mono">{overallScore}%</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold ${tierMeta.textColor}`}>
                    {tierMeta.label}
                  </span>
                  <Badge variant={matchTier === "strong" ? "success" : matchTier === "moderate" ? "warning" : "default"}>
                    {overallScore >= 80 ? "High Confidence" : overallScore >= 60 ? "Moderate" : "Low"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated Match ID: <code className="font-mono text-slate-800 font-semibold">{match.id}</code>
                </p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700 border border-slate-200">
                {match.status}
              </span>
            </div>
          </div>

          {/* Explainability Callout (Deterministic Zero-LLM output) */}
          <div className="mt-4 rounded-xl bg-blue-50 p-3.5 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-blue-900 block mb-0.5">
                Explainability Engine Assessment:
              </span>
              <p className="leading-relaxed">{explanation}</p>
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lost Item Column */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-200/80">
              <Badge variant="lost" className="text-xs px-3 py-1 font-bold">
                LOST REPORT
              </Badge>
              <Link
                href={`/items/${lostItem.id}?type=lost`}
                title={`Full UUID: ${lostItem.id}`}
                className="text-xs text-rose-700 hover:underline font-mono font-bold"
              >
                #{lostItem.id.slice(0, 8)} ↗
              </Link>
            </div>

            <div>
              <Link href={`/items/${lostItem.id}?type=lost`}>
                <h3 className="text-lg font-bold text-slate-900 hover:text-rose-600 transition-colors">
                  {lostItem.title}
                </h3>
              </Link>
              <p className="text-xs text-slate-700 mt-1 italic leading-relaxed">
                &ldquo;{lostItem.description}&rdquo;
              </p>
            </div>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Tag className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-900">Category:</span>
                <span>{getCategoryLabel(lostItem.category)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="h-3 w-3 rounded-full bg-slate-800 shrink-0 border border-white" />
                <span className="font-semibold text-slate-900">Color:</span>
                <span>{lostItem.color}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Location: </span>
                  <span>{lostItem.location}</span>
                  <p className="text-[11px] text-slate-500">Zone: {lostItem.campusZone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-900">Lost Date:</span>
                <span>{formatDate(lostItem.date)} ({formatTimeOfDay(lostItem.timeOfDay)})</span>
              </div>
              {lostItem.contactName && (
                <div className="flex items-center gap-2 text-slate-700 pt-1 border-t border-rose-200/60">
                  <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-900">Reporter:</span>
                  <span>{lostItem.contactName} ({lostItem.contactEmail || "Email protected"})</span>
                </div>
              )}
            </div>
          </div>

          {/* Found Item Column */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80">
              <Badge variant="found" className="text-xs px-3 py-1 font-bold">
                FOUND REPORT
              </Badge>
              <Link
                href={`/items/${foundItem.id}?type=found`}
                title={`Full UUID: ${foundItem.id}`}
                className="text-xs text-emerald-700 hover:underline font-mono font-bold"
              >
                #{foundItem.id.slice(0, 8)} ↗
              </Link>
            </div>

            <div>
              <Link href={`/items/${foundItem.id}?type=found`}>
                <h3 className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                  {foundItem.title}
                </h3>
              </Link>
              <p className="text-xs text-slate-700 mt-1 italic leading-relaxed">
                &ldquo;{foundItem.description}&rdquo;
              </p>
            </div>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Tag className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-900">Category:</span>
                <span>{getCategoryLabel(foundItem.category)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="h-3 w-3 rounded-full bg-slate-800 shrink-0 border border-white" />
                <span className="font-semibold text-slate-900">Color:</span>
                <span>{foundItem.color}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Location: </span>
                  <span>{foundItem.location}</span>
                  <p className="text-[11px] text-slate-500">Zone: {foundItem.campusZone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-900">Found Date:</span>
                <span>{formatDate(foundItem.date)} ({formatTimeOfDay(foundItem.timeOfDay)})</span>
              </div>
              {foundItem.holdingLocation && (
                <div className="flex items-center gap-2 text-slate-700 pt-1 border-t border-emerald-200/60">
                  <Building className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span className="font-semibold text-slate-900">Custody:</span>
                  <span className="font-bold text-emerald-800">{foundItem.holdingLocation}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scoring Breakdown & Key Shared Attributes */}
        <div className="space-y-4">
          <MatchBreakdownBar breakdown={breakdown} />

          {/* Shared Signal Badges */}
          {highlights.sharedKeywords.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block mb-2">
                Shared Semantic Signals & Keywords:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {highlights.sharedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-blue-50 px-2 py-1 font-mono text-[11px] font-bold text-blue-800 border border-blue-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              <XCircle className="h-4 w-4" />
              <span>Dismiss / Not a Match</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleConfirm}
            >
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>Verify Match</span>
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleMarkClaimed}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Confirm & Mark Claimed</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
