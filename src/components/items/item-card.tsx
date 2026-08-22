"use client";

import Link from "next/link";
import { LostFoundItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTimeOfDay, getCategoryColor, getCategoryLabel } from "@/lib/utils";
import { useItems } from "@/lib/items-context";
import { MapPin, Calendar, Building, Sparkles, ArrowRight, Zap } from "lucide-react";

export function ItemCard({ item }: { item: LostFoundItem }) {
  const { getMatchesForItem } = useItems();
  const itemMatches = getMatchesForItem(item.id);
  const highMatch = itemMatches.find((m) => m.overallScore >= 80);
  const categoryStyle = getCategoryColor(item.category);

  return (
    <Card className="group flex flex-col justify-between overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 bg-white border border-slate-200/90">
      <div className="space-y-3.5">
        {/* Card Header: Type Badge, Category, Search Relevance & Potential Match count */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={item.type === "lost" ? "lost" : "found"}>
              {item.type === "lost" ? "LOST" : "FOUND"}
            </Badge>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold border ${categoryStyle.bg} ${categoryStyle.border}`}
            >
              {getCategoryLabel(item.category)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {item.searchRelevanceScore !== undefined && item.searchRelevanceScore > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                <Sparkles className="h-2.5 w-2.5 text-indigo-600" />
                {Math.round(item.searchRelevanceScore)}% Relevance
              </span>
            )}

            {itemMatches.length > 0 && (
              <Link href="/matches">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                  <Zap className="h-3 w-3 text-blue-600" />
                  {itemMatches.length} match{itemMatches.length > 1 ? "es" : ""}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Item Title & Description */}
        <div>
          <Link href={`/items/${item.id}?type=${item.type}`}>
            <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {item.title}
            </h4>
          </Link>
          <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Item Key Metadata */}
        <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200/70">
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">
                {item.location}
              </p>
              <p className="text-[11px] text-slate-500">Zone: {item.campusZone}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>
              {formatDate(item.date)} • {formatTimeOfDay(item.timeOfDay).split(" ")[0]}
            </span>
          </div>

          {item.holdingLocation && (
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <Building className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Custody: {item.holdingLocation}</span>
            </div>
          )}
        </div>

        {/* Strong Match Callout Banner if detected */}
        {highMatch && (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-900 border border-emerald-200">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>{highMatch.overallScore}% Potential Match</span>
            </div>
            <Link
              href="/matches"
              className="text-[11px] font-bold text-emerald-700 hover:underline"
            >
              View →
            </Link>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
        <span
          title={`Full UUID: ${item.id}`}
          className="text-[11px] text-slate-400 font-mono"
        >
          #{item.id.slice(0, 8)}
        </span>
        <Link href={`/items/${item.id}?type=${item.type}`}>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1 text-slate-600 hover:text-slate-900">
            <span>Details</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
