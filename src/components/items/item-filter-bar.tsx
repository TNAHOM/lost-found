"use client";

import { FilterState } from "@/lib/types";
import { Search, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_FILTER_OPTIONS as CATEGORIES,
  CAMPUS_ZONE_FILTER_OPTIONS as CAMPUS_ZONES,
} from "@/lib/constants";

export function ItemFilterBar({
  filter,
  setFilter,
  isSearching = false,
}: {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  isSearching?: boolean;
}) {
  const hasActiveFilters =
    filter.searchQuery !== "" ||
    filter.category !== "all" ||
    filter.campusZone !== "all";

  const clearFilters = () => {
    setFilter((prev) => ({
      ...prev,
      searchQuery: "",
      category: "all",
      campusZone: "all",
      sortBy: "newest",
    }));
  };

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-2xs border border-slate-200/90">
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Input with AI semantic indicator */}
        <div className="relative w-full md:flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              filter.searchMode === "hybrid"
                ? "AI Semantic Search: Try concepts like 'earbuds', 'bookbag', 'charger', 'cafeteria'..."
                : "Exact Keyword Search: Matches words in title, color, or location..."
            }
            value={filter.searchQuery}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                searchQuery: e.target.value,
                sortBy: e.target.value.trim() ? "relevance" : prev.sortBy,
              }))
            }
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-colors shadow-2xs"
          />
          {filter.searchQuery ? (
            <button
              onClick={() => setFilter((prev) => ({ ...prev, searchQuery: "", sortBy: "newest" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : isSearching ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 animate-spin">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          ) : null}
        </div>

        {/* Search Mode Toggle & Dropdowns */}
        <div className="flex flex-wrap w-full md:w-auto items-center gap-2">
          {/* Mode Pill Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setFilter((prev) => ({ ...prev, searchMode: "hybrid" }))}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter.searchMode === "hybrid"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Vector semantic search powered by Gemini text-embedding-001"
            >
              <Sparkles className="h-3 w-3 text-blue-600" />
              <span>AI Semantic</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter((prev) => ({ ...prev, searchMode: "keyword" }))}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter.searchMode === "keyword"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Strict keyword substring search"
            >
              <span>Exact Key</span>
            </button>
          </div>

          <select
            value={filter.category}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                category: e.target.value as FilterState["category"],
              }))
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 font-semibold focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={filter.campusZone}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                campusZone: e.target.value as FilterState["campusZone"],
              }))
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 font-semibold focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs"
          >
            {CAMPUS_ZONES.map((zone) => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 text-xs px-2 text-slate-500 hover:text-slate-900"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
