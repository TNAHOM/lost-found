"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useItems } from "@/lib/items-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/matches/match-card";
import { formatDate, formatTimeOfDay, getCategoryColor, getCategoryLabel } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Tag,
  Building,
  User,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ type?: string }>;
}) {
  const { id } = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined;
  const expectedType = resolvedSearchParams?.type;

  const { getItemById, getMatchesForItem, updateMatchStatus } = useItems();
  const [copied, setCopied] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const item = getItemById(id);
  const matches = getMatchesForItem(id);

  // Find confirmed or claimed matches for this item
  const claimedMatch = matches.find((m) => m.status === "claimed");
  const confirmedMatch = matches.find((m) => m.status === "confirmed");

  // Paired item if claimed or confirmed
  const pairedItemId = item?.matchedItemId || (claimedMatch ? (claimedMatch.lostItem.id === id ? claimedMatch.foundItem.id : claimedMatch.lostItem.id) : undefined);
  const pairedItem = pairedItemId ? getItemById(pairedItemId) : undefined;

  const handleCopyId = () => {
    if (!item) return;
    navigator.clipboard.writeText(item.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickClaim = async (matchToClaim: typeof confirmedMatch) => {
    if (!matchToClaim) return;
    setIsClaiming(true);
    try {
      await updateMatchStatus(matchToClaim.id, "claim", {
        lostItemId: matchToClaim.lostItem.id,
        foundItemId: matchToClaim.foundItem.id,
        overallScore: matchToClaim.overallScore,
        matchTier: matchToClaim.matchTier,
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (!item) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white space-y-4">
        <h3 className="text-xl font-bold text-slate-900">
          Item Report Not Found
        </h3>
        <p className="text-xs text-slate-500">
          No active report found with UUID <code className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{id}</code>.
        </p>
        <Link href="/">
          <Button variant="default" size="sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const categoryStyle = getCategoryColor(item.category);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Reports</span>
        </Link>

        <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs text-slate-600">
          <span className="font-semibold text-slate-500 uppercase text-[10px]">UUID:</span>
          <code className="font-mono text-slate-800 text-[11px] select-all font-semibold">
            {item.id}
          </code>
          <button
            onClick={handleCopyId}
            title="Copy UUID to clipboard"
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ml-0.5 rounded"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Claimed Status Banner with Paired Link */}
      {item.status === "claimed" && (
        <div className="rounded-3xl border border-emerald-300 bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-emerald-950">
                  Item Reconciled & Returned
                </span>
                <Badge variant="success" className="text-[10px] uppercase font-bold">
                  Claimed
                </Badge>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                {pairedItem ? (
                  <>
                    Paired with {pairedItem.type === "lost" ? "Lost Report" : "Found Custody Report"}:{" "}
                    <strong className="font-semibold text-emerald-950">&ldquo;{pairedItem.title}&rdquo;</strong>
                  </>
                ) : (
                  "Official handover completed and logged in campus records."
                )}
              </p>
            </div>
          </div>

          {pairedItem && (
            <Link href={`/items/${pairedItem.id}?type=${pairedItem.type}`}>
              <Button variant="outline" size="sm" className="border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 text-xs">
                <span>View Paired Report</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Confirmed Match Banner (Ready for Claim) */}
      {item.status !== "claimed" && confirmedMatch && (
        <div className="rounded-3xl border border-blue-300 bg-linear-to-r from-blue-50 via-indigo-50/50 to-blue-50 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-blue-950">
                  Verified Candidate Match ({confirmedMatch.overallScore}% Confidence)
                </span>
                <span className="rounded-md bg-blue-200/70 px-2 py-0.5 text-[10px] font-bold text-blue-900 uppercase">
                  Verified
                </span>
              </div>
              <p className="text-xs text-blue-800 mt-0.5">
                Verified candidate:{" "}
                <strong className="font-semibold text-blue-950">
                  &ldquo;{item.type === "lost" ? confirmedMatch.foundItem.title : confirmedMatch.lostItem.title}&rdquo;
                </strong>
                . Ready for physical pickup handover.
              </p>
            </div>
          </div>

          <Button
            variant="success"
            size="sm"
            onClick={() => handleQuickClaim(confirmedMatch)}
            disabled={isClaiming}
            className="cursor-pointer font-bold shadow-xs shrink-0"
          >
            {isClaiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            <span>Confirm & Mark Claimed</span>
          </Button>
        </div>
      )}

      {/* Main Detail Card */}
      <Card className="p-6 sm:p-8 space-y-6 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={item.type === "lost" ? "lost" : "found"}>
                {item.type === "lost" ? "LOST REPORT" : "FOUND REPORT"}
              </Badge>
              <span
                className={`rounded-md px-2.5 py-0.5 text-xs font-bold border ${categoryStyle.bg} ${categoryStyle.border}`}
              >
                {getCategoryLabel(item.category)}
              </span>
              <Badge
                variant={item.status === "claimed" ? "success" : "outline"}
                className="text-xs uppercase font-semibold"
              >
                {item.status}
              </Badge>
              {expectedType && expectedType === item.type && (
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  (Type: {item.type})
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {item.title}
            </h1>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Report Description & Details
          </h3>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            &ldquo;{item.description}&rdquo;
          </p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <MapPin className="h-3.5 w-3.5 text-rose-600" />
              <span>Location Reported</span>
            </div>
            <p className="font-bold text-sm text-slate-900">
              {item.location}
            </p>
            <p className="text-xs text-slate-500">Zone: {item.campusZone}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              <span>Date & Time</span>
            </div>
            <p className="font-bold text-sm text-slate-900">
              {formatDate(item.date)}
            </p>
            <p className="text-xs text-slate-500">
              {formatTimeOfDay(item.timeOfDay)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Tag className="h-3.5 w-3.5 text-emerald-600" />
              <span>Attributes</span>
            </div>
            <p className="font-bold text-sm text-slate-900">
              Color: {item.color || "Not specified"}
            </p>
            {item.brand && (
              <p className="text-xs text-slate-500">Brand: {item.brand}</p>
            )}
          </div>
        </div>

        {/* Custody details for found items */}
        {item.holdingLocation && (
          <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 flex items-center gap-3">
            <Building className="h-6 w-6 text-emerald-700 shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase">
                Official Campus Custody
              </span>
              <p className="text-sm font-bold text-slate-900">
                Item held at: {item.holdingLocation}
              </p>
            </div>
          </div>
        )}

        {item.contactName && (
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-800">
                Reporter: {item.contactName}
              </span>
            </div>
            {item.contactEmail && (
              <span className="text-slate-600 font-mono font-medium">{item.contactEmail}</span>
            )}
          </div>
        )}
      </Card>

      {/* Candidate Matches for this Item */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Potential Candidate Matches ({matches.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Ranked by multi-factor score
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white text-xs text-slate-500">
            No active candidate matches found for this specific item yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
