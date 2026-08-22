"use client";

import { useState, useMemo, useEffect } from "react";
import { LostFoundItem, FilterState } from "@/lib/types";
import { ItemCard } from "./item-card";
import { ItemFilterBar } from "./item-filter-bar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inbox, Sparkles } from "lucide-react";
import { cosineSimilarity, parseVector } from "@/lib/gemini-embedding";

export function ItemGrid({
  lostItems,
  foundItems,
}: {
  lostItems: LostFoundItem[];
  foundItems: LostFoundItem[];
}) {
  const [activeTab, setActiveTab] = useState<"all" | "lost" | "found">("all");
  const [filter, setFilter] = useState<FilterState>({
    searchQuery: "",
    searchMode: "hybrid",
    type: "all",
    category: "all",
    campusZone: "all",
    status: "all",
    minMatchScore: 40,
    sortBy: "newest",
  });

  const [queryVector, setQueryVector] = useState<number[] | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Debounced
  useEffect(() => {
    const query = filter.searchQuery.trim();
    if (!query || filter.searchMode !== "hybrid") {
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch("/api/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: query }),
        });
        if (res.ok && isMounted) {
          const data = (await res.json()) as { vector: number[] | null };
          setQueryVector(data.vector);
        }
      } catch {
        if (isMounted) setQueryVector(null);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [filter.searchQuery, filter.searchMode]);

  // Derived effective vector to ensure zero-stale queries
  const effectiveQueryVector =
    filter.searchQuery.trim() && filter.searchMode === "hybrid"
      ? queryVector
      : null;

  // Hybrid Semantic + Keyword Search Evaluation
  const combinedItems = useMemo(() => {
    let list: LostFoundItem[] = [];
    if (activeTab === "all") list = [...lostItems, ...foundItems];
    else if (activeTab === "lost") list = lostItems;
    else if (activeTab === "found") list = foundItems;

    // Category filter
    if (filter.category !== "all") {
      list = list.filter((item) => item.category === filter.category);
    }

    // Campus zone filter
    if (filter.campusZone !== "all") {
      list = list.filter((item) => item.campusZone === filter.campusZone);
    }

    const query = filter.searchQuery.trim().toLowerCase();

    if (!query) {
      // Default Sort when no active search
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const scoredList: LostFoundItem[] = [];

    for (const item of list) {
      let keywordScore = 0;
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const locLower = item.location.toLowerCase();
      const colorLower = (item.color || "").toLowerCase();
      const brandLower = (item.brand || "").toLowerCase();

      // Direct keyword matches
      if (titleLower.includes(query)) {
        keywordScore = Math.max(keywordScore, 100)
      }
      else if (descLower.includes(query)) {
        keywordScore = Math.max(keywordScore, 85)
      }
      else if (locLower.includes(query) || colorLower.includes(query) || brandLower.includes(query)) {
        keywordScore = Math.max(keywordScore, 75)
      }
      else {
        // Word token overlap
        const queryWords = query.split(/\s+/).filter((w) => w.length > 2);
        const matchCount = queryWords.filter(
          (w) =>
            titleLower.includes(w) ||
            descLower.includes(w) ||
            locLower.includes(w) ||
            colorLower.includes(w)
        ).length;
        if (matchCount > 0) {
          keywordScore = (matchCount / queryWords.length) * 70;
        }
      }

      // Vector cosine similarity pass
      let vectorScore = 0;
      if (effectiveQueryVector && item.embedding) {
        const itemVec = parseVector(item.embedding);
        if (itemVec) {
          const sim = cosineSimilarity(effectiveQueryVector, itemVec);
          vectorScore = sim * 100;
        }
      }

      // Aggregated Score
      const finalRelevance =
        filter.searchMode === "hybrid"
          ? Math.max(keywordScore, vectorScore)
          : keywordScore;

      // Filter threshold
      if (finalRelevance >= 35) {
        scoredList.push({
          ...item,
          searchRelevanceScore: finalRelevance,
        });
      }
    }

    // Sort by relevance descending when searching
    return scoredList.sort(
      (a, b) => (b.searchRelevanceScore || 0) - (a.searchRelevanceScore || 0)
    );
  }, [activeTab, lostItems, foundItems, filter, effectiveQueryVector]);

  return (
    <div className="space-y-4">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "all" | "lost" | "found")}
        >
          <TabsList>
            <TabsTrigger value="all" badge={lostItems.length + foundItems.length}>
              All Reports
            </TabsTrigger>
            <TabsTrigger value="lost" badge={lostItems.length}>
              Lost Items
            </TabsTrigger>
            <TabsTrigger value="found" badge={foundItems.length}>
              Found Items
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {filter.searchQuery && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              <Sparkles className="h-3 w-3 text-blue-600" />
              <span>Ranked by {filter.searchMode === "hybrid" ? "AI Relevance" : "Keyword Match"}</span>
            </span>
          )}
          <span className="text-xs text-slate-500 font-semibold">
            {combinedItems.length} report{combinedItems.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <ItemFilterBar
        filter={filter}
        setFilter={setFilter}
        isSearching={isSearching}
      />

      {combinedItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Inbox className="h-6 w-6" />
          </div>
          <h4 className="mt-3 font-semibold text-slate-900">
            No Reports Found
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms, switching search mode, or clearing active filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combinedItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
