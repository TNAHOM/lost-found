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
  updateMatchStatus: (matchId: string, status: MatchStatus) => void;
  getItemById: (id: string) => LostFoundItem | undefined;
  getMatchesForItem: (id: string) => MatchResult[];
  findLiveMatchesForDraft: (draft: Partial<LostFoundItem>, type: ReportType) => MatchResult[];
  resetToMockData: () => Promise<void>;
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
    embedding: raw.embedding || undefined,
    createdAt: raw.createdAt,
  };
}

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const [itemsList, setItemsList] = useState<LostFoundItem[]>([]);
  const [matchStatusMap, setMatchStatusMap] = useState<Record<string, MatchStatus>>({});
  const [minMatchScore, setMinMatchScore] = useState<number>(40);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;

    async function loadItems() {
      try {
        const res = await fetch("/api/items");
        if (res.ok) {
          const data = (await res.json()) as ApiItemsResponse;
          if (!ignore && data.items && Array.isArray(data.items)) {
            const normalized = data.items.map(normalizeDbItem);
            setItemsList(normalized);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("Failed to fetch items from SQLite DB:", getErrorMessage(err));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadItems();

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

  // Dynamically compute all matches based on database items
  const matches = useMemo(() => {
    const rawMatches = findMatches(lostItems, foundItems, minMatchScore);
    return rawMatches.map((m) => {
      const savedStatus = matchStatusMap[m.id];
      return savedStatus ? { ...m, status: savedStatus } : m;
    });
  }, [lostItems, foundItems, minMatchScore, matchStatusMap]);

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
    (matchId: string, status: MatchStatus) => {
      setMatchStatusMap((prev) => ({ ...prev, [matchId]: status }));
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
