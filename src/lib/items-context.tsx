"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import {
  LostFoundItem,
  MatchResult,
  ItemStatus,
  MatchStatus,
  ReportType,
  CreateItemInput,
  ApiItemsResponse,
  ApiItemResponse,
  ApiMatchActionResponse,
  ApiSeedResponse,
} from "./types";
import { evaluateItemMatch, findMatches } from "./matching-engine";
import { Item } from "@/db/schema";
import { getErrorMessage } from "./utils";

interface ItemsContextType {
  lostItems: LostFoundItem[];
  foundItems: LostFoundItem[];
  allItems: LostFoundItem[];
  matches: MatchResult[];
  minMatchScore: number;
  isLoading: boolean;
  setMinMatchScore: (score: number) => void;
  addLostItem: (itemData: Omit<CreateItemInput, "id" | "type" | "status" | "createdAt">) => Promise<LostFoundItem>;
  addFoundItem: (itemData: Omit<CreateItemInput, "id" | "type" | "status" | "createdAt">) => Promise<LostFoundItem>;
  updateItemStatus: (id: string, status: ItemStatus) => Promise<void>;
  updateMatchStatus: (
    matchId: string,
    actionOrStatus: MatchStatus | "verify" | "claim" | "reject" | "unverify",
    matchData?: {
      lostItemId?: string;
      foundItemId?: string;
      overallScore?: number;
      matchTier?: MatchResult["matchTier"];
    }
  ) => Promise<void>;
  getItemById: (id: string) => LostFoundItem | undefined;
  getMatchesForItem: (id: string) => MatchResult[];
  findLiveMatchesForDraft: (draft: Partial<LostFoundItem>, type: ReportType) => MatchResult[];
  resetToMockData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

function normalizeDbItem(raw: Item | LostFoundItem): LostFoundItem {
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    description: raw.description,
    category: raw.category,
    color: raw.color || "",
    brand: raw.brand || undefined,
    location: raw.location,
    campusZone: raw.campusZone,
    date: raw.date,
    timeOfDay: raw.timeOfDay,
    contactName: raw.contactName || undefined,
    contactEmail: raw.contactEmail || undefined,
    contactPhone: raw.contactPhone || undefined,
    holdingLocation: raw.holdingLocation || undefined,
    isAnonymous: Boolean(raw.isAnonymous),
    status: raw.status,
    matchedItemId: raw.matchedItemId || undefined,
    embedding: raw.embedding || undefined,
    createdAt: raw.createdAt,
  };
}

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const [itemsList, setItemsList] = useState<LostFoundItem[]>([]);
  const [matchStatusMap, setMatchStatusMap] = useState<Record<string, MatchStatus>>({});
  const [minMatchScore, setMinMatchScore] = useState<number>(40);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAllData = useCallback(async () => {
    try {
      const [itemsRes, matchesRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/matches"),
      ]);

      if (itemsRes.ok) {
        const itemsData = (await itemsRes.json()) as ApiItemsResponse;
        if (itemsData.items && Array.isArray(itemsData.items)) {
          setItemsList(itemsData.items.map(normalizeDbItem));
        }
      }

      if (matchesRes.ok) {
        const matchesData = (await matchesRes.json()) as { matches: Array<{ id: string; status: MatchStatus }> };
        if (matchesData.matches && Array.isArray(matchesData.matches)) {
          const statusMap: Record<string, MatchStatus> = {};
          for (const m of matchesData.matches) {
            statusMap[m.id] = m.status;
          }
          setMatchStatusMap(statusMap);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to fetch items and matches from SQLite DB:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        const [itemsRes, matchesRes] = await Promise.all([
          fetch("/api/items"),
          fetch("/api/matches"),
        ]);

        if (itemsRes.ok) {
          const itemsData = (await itemsRes.json()) as ApiItemsResponse;
          if (!ignore && itemsData.items && Array.isArray(itemsData.items)) {
            setItemsList(itemsData.items.map(normalizeDbItem));
          }
        }

        if (matchesRes.ok) {
          const matchesData = (await matchesRes.json()) as { matches: Array<{ id: string; status: MatchStatus }> };
          if (!ignore && matchesData.matches && Array.isArray(matchesData.matches)) {
            const statusMap: Record<string, MatchStatus> = {};
            for (const m of matchesData.matches) {
              statusMap[m.id] = m.status;
            }
            setMatchStatusMap(statusMap);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("Failed to fetch items and matches from SQLite DB:", getErrorMessage(err));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  const lostItems = useMemo(() => {
    return itemsList.filter((i) => i.type === "lost");
  }, [itemsList]);

  const foundItems = useMemo(() => {
    return itemsList.filter((i) => i.type === "found");
  }, [itemsList]);

  // Dynamically compute all matches based on database items and apply DB status & supersedence rules
  const matches = useMemo(() => {
    const rawMatches = findMatches(lostItems, foundItems, minMatchScore);

    return rawMatches.map((m) => {
      const savedStatus = matchStatusMap[m.id] || "unreviewed";
      const lost = itemsList.find((i) => i.id === m.lostItem.id) || m.lostItem;
      const found = itemsList.find((i) => i.id === m.foundItem.id) || m.foundItem;

      // Determine supersedence
      let isSuperseded = false;
      let supersededReason: string | undefined = undefined;

      const isLostClaimedElsewhere = lost.status === "claimed" && lost.matchedItemId !== found.id;
      const isFoundClaimedElsewhere = found.status === "claimed" && found.matchedItemId !== lost.id;

      if (savedStatus !== "claimed") {
        if (isLostClaimedElsewhere && isFoundClaimedElsewhere) {
          isSuperseded = true;
          supersededReason = "Both items have already been claimed in other reports.";
        } else if (isLostClaimedElsewhere) {
          isSuperseded = true;
          supersededReason = `Lost item "${lost.title}" has already been claimed with another found report.`;
        } else if (isFoundClaimedElsewhere) {
          isSuperseded = true;
          supersededReason = `Found item "${found.title}" has already been returned and claimed.`;
        }
      }

      return {
        ...m,
        lostItem: lost,
        foundItem: found,
        status: savedStatus,
        isSuperseded,
        supersededReason,
      };
    });
  }, [lostItems, foundItems, minMatchScore, matchStatusMap, itemsList]);

  const allItems = useMemo(() => {
    return [...itemsList].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [itemsList]);

  const addLostItem = useCallback(
    async (itemData: Omit<CreateItemInput, "id" | "type" | "status" | "createdAt">): Promise<LostFoundItem> => {
      const payload: CreateItemInput = {
        ...itemData,
        id: crypto.randomUUID(),
        type: "lost",
        status: "open",
        createdAt: new Date().toISOString(),
      };

      try {
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = (await res.json()) as ApiItemResponse;
          const saved = normalizeDbItem(data.item);
          setItemsList((prev) => [saved, ...prev.filter((i) => i.id !== saved.id)]);
          return saved;
        }
      } catch (err: unknown) {
        console.error("Error creating lost item:", getErrorMessage(err));
      }

      // Fallback
      const fallback: LostFoundItem = {
        ...itemData,
        id: payload.id || crypto.randomUUID(),
        type: "lost",
        color: itemData.color || "",
        date: itemData.date || new Date().toISOString().split("T")[0],
        timeOfDay: itemData.timeOfDay || "afternoon",
        status: "open",
        createdAt: payload.createdAt || new Date().toISOString(),
      };
      setItemsList((prev) => [fallback, ...prev]);
      return fallback;
    },
    []
  );

  const addFoundItem = useCallback(
    async (itemData: Omit<CreateItemInput, "id" | "type" | "status" | "createdAt">): Promise<LostFoundItem> => {
      const payload: CreateItemInput = {
        ...itemData,
        id: crypto.randomUUID(),
        type: "found",
        status: "open",
        createdAt: new Date().toISOString(),
      };

      try {
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = (await res.json()) as ApiItemResponse;
          const saved = normalizeDbItem(data.item);
          setItemsList((prev) => [saved, ...prev.filter((i) => i.id !== saved.id)]);
          return saved;
        }
      } catch (err: unknown) {
        console.error("Error creating found item:", getErrorMessage(err));
      }

      // Fallback
      const fallback: LostFoundItem = {
        ...itemData,
        id: payload.id || crypto.randomUUID(),
        type: "found",
        color: itemData.color || "",
        date: itemData.date || new Date().toISOString().split("T")[0],
        timeOfDay: itemData.timeOfDay || "afternoon",
        status: "open",
        createdAt: payload.createdAt || new Date().toISOString(),
      };
      setItemsList((prev) => [fallback, ...prev]);
      return fallback;
    },
    []
  );

  const updateItemStatus = useCallback(async (id: string, status: ItemStatus) => {
    setItemsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );

    try {
      await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err: unknown) {
      console.error("Error updating item status in DB:", getErrorMessage(err));
    }
  }, []);

  const updateMatchStatus = useCallback(
    async (
      matchId: string,
      actionOrStatus: MatchStatus | "verify" | "claim" | "reject" | "unverify",
      matchData?: {
        lostItemId?: string;
        foundItemId?: string;
        overallScore?: number;
        matchTier?: MatchResult["matchTier"];
      }
    ) => {
      let action: "verify" | "claim" | "reject" | "unverify" = "unverify";
      let targetStatus: MatchStatus = "unreviewed";

      if (actionOrStatus === "verify" || actionOrStatus === "confirmed") {
        action = "verify";
        targetStatus = "confirmed";
      } else if (actionOrStatus === "claim" || actionOrStatus === "claimed") {
        action = "claim";
        targetStatus = "claimed";
      } else if (actionOrStatus === "reject" || actionOrStatus === "rejected") {
        action = "reject";
        targetStatus = "rejected";
      } else if (actionOrStatus === "unverify" || actionOrStatus === "unreviewed") {
        action = "unverify";
        targetStatus = "unreviewed";
      }

      // Infer lostItemId and foundItemId if not directly passed
      let lostId = matchData?.lostItemId;
      let foundId = matchData?.foundItemId;

      if (!lostId || !foundId) {
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
        const matchedUuids = matchId.match(uuidRegex);
        if (matchedUuids && matchedUuids.length >= 2) {
          lostId = matchedUuids[0];
          foundId = matchedUuids[1];
        }
      }

      // Optimistic Match Status Update
      setMatchStatusMap((prev) => ({ ...prev, [matchId]: targetStatus }));

      // Optimistic Item Statuses Update
      if (lostId && foundId) {
        if (action === "claim") {
          setItemsList((prev) =>
            prev.map((item) => {
              if (item.id === lostId) return { ...item, status: "claimed", matchedItemId: foundId };
              if (item.id === foundId) return { ...item, status: "claimed", matchedItemId: lostId };
              return item;
            })
          );
        } else if (action === "verify") {
          setItemsList((prev) =>
            prev.map((item) => {
              if (item.id === lostId) return { ...item, status: "potential_match", matchedItemId: foundId };
              if (item.id === foundId) return { ...item, status: "potential_match", matchedItemId: lostId };
              return item;
            })
          );
        } else if (action === "reject" || action === "unverify") {
          setItemsList((prev) =>
            prev.map((item) => {
              if (
                (item.id === lostId && item.matchedItemId === foundId) ||
                (item.id === foundId && item.matchedItemId === lostId)
              ) {
                if (item.status !== "claimed") {
                  return { ...item, status: "open", matchedItemId: undefined };
                }
              }
              return item;
            })
          );
        }

        // Call backend API
        try {
          const res = await fetch("/api/matches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              matchId,
              lostItemId: lostId,
              foundItemId: foundId,
              action,
              overallScore: matchData?.overallScore,
              matchTier: matchData?.matchTier,
            }),
          });

          if (res.ok) {
            const data = (await res.json()) as ApiMatchActionResponse;
            if (data.lostItem && data.foundItem) {
              const normLost = normalizeDbItem(data.lostItem);
              const normFound = normalizeDbItem(data.foundItem);
              setItemsList((prev) =>
                prev.map((i) => {
                  if (i.id === normLost.id) return normLost;
                  if (i.id === normFound.id) return normFound;
                  return i;
                })
              );
            }
          }
        } catch (err: unknown) {
          console.error("Error updating match in database:", getErrorMessage(err));
        }
      }
    },
    []
  );

  const getItemById = useCallback(
    (id: string): LostFoundItem | undefined => {
      return itemsList.find((item) => item.id === id);
    },
    [itemsList]
  );

  const getMatchesForItem = useCallback(
    (id: string): MatchResult[] => {
      return matches.filter((m) => m.lostItem.id === id || m.foundItem.id === id);
    },
    [matches]
  );

  const findLiveMatchesForDraft = useCallback(
    (draft: Partial<LostFoundItem>, type: ReportType): MatchResult[] => {
      if (!draft.title && !draft.description) return [];

      const tempItem: LostFoundItem = {
        id: crypto.randomUUID(),
        type,
        title: draft.title || "Untitled",
        description: draft.description || "",
        category: draft.category || "other",
        color: draft.color || "",
        location: draft.location || "",
        campusZone: draft.campusZone || "Campus Green / Outdoors",
        date: draft.date || new Date().toISOString().split("T")[0],
        timeOfDay: draft.timeOfDay || "afternoon",
        status: "open",
        createdAt: new Date().toISOString(),
      };

      const candidates = type === "lost" ? foundItems : lostItems;
      const liveMatches: MatchResult[] = [];

      for (const candidate of candidates) {
        // Exclude already claimed items from live drafts
        if (candidate.status === "claimed") continue;

        const match =
          type === "lost"
            ? evaluateItemMatch(tempItem, candidate)
            : evaluateItemMatch(candidate, tempItem);

        if (match.overallScore >= 45) {
          liveMatches.push(match);
        }
      }

      return liveMatches.sort((a, b) => b.overallScore - a.overallScore);
    },
    [lostItems, foundItems]
  );

  const resetToMockData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as ApiSeedResponse;
        if (data.items) {
          setItemsList(data.items.map(normalizeDbItem));
        }
      }
      setMatchStatusMap({});
    } catch (err: unknown) {
      console.error("Error resetting database:", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <ItemsContext.Provider
      value={{
        lostItems,
        foundItems,
        allItems,
        matches,
        minMatchScore,
        isLoading,
        setMinMatchScore,
        addLostItem,
        addFoundItem,
        updateItemStatus,
        updateMatchStatus,
        getItemById,
        getMatchesForItem,
        findLiveMatchesForDraft,
        resetToMockData,
        refreshData: fetchAllData,
      }}
    >
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems(): ItemsContextType {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error("useItems must be used within an ItemsProvider");
  }
  return context;
}
