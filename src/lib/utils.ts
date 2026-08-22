import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ItemCategory, MatchTier, TimeOfDay } from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTimeOfDay(time: TimeOfDay | string): string {
  switch (time) {
    case "morning":
      return "Morning (8 AM - 12 PM)";
    case "afternoon":
      return "Afternoon (12 PM - 5 PM)";
    case "evening":
      return "Evening (5 PM - 9 PM)";
    case "night":
      return "Night (9 PM - 8 AM)";
    default:
      return "Time Unknown";
  }
}

export function getCategoryLabel(category: ItemCategory): string {
  const map: Record<ItemCategory, string> = {
    electronics: "Electronics & Tech",
    bags_wallets: "Bags & Wallets",
    clothing_apparel: "Clothing & Apparel",
    keys: "Keys & Keychain",
    ids_cards: "Cards & IDs",
    books_stationery: "Books & Stationery",
    jewelry_accessories: "Jewelry & Watches",
    sports_waterbottles: "Bottles & Gear",
    other: "Other Items",
  };
  return map[category] || category;
}

export function getCategoryColor(category: ItemCategory): {
  bg: string;
  text: string;
  border: string;
} {
  const map: Record<ItemCategory, { bg: string; text: string; border: string }> = {
    electronics: {
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    bags_wallets: {
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      text: "text-amber-800",
      border: "border-amber-200",
    },
    clothing_apparel: {
      bg: "bg-purple-50 text-purple-700 border-purple-200",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    keys: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    ids_cards: {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      text: "text-rose-700",
      border: "border-rose-200",
    },
    books_stationery: {
      bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    jewelry_accessories: {
      bg: "bg-teal-50 text-teal-700 border-teal-200",
      text: "text-teal-700",
      border: "border-teal-200",
    },
    sports_waterbottles: {
      bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
      text: "text-cyan-700",
      border: "border-cyan-200",
    },
    other: {
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      text: "text-slate-700",
      border: "border-slate-200",
    },
  };
  return map[category] || map.other;
}

export interface MatchTierStyle {
  label: string;
  badgeClass: string;
  borderClass: string;
  indicatorColor: string;
  textColor: string;
  glowClass: string;
}

export function getMatchTierMeta(tier: MatchTier, score: number): MatchTierStyle {
  if (score >= 80 || tier === "strong") {
    return {
      label: "Strong Match",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      borderClass: "border-emerald-300",
      indicatorColor: "bg-emerald-600",
      textColor: "text-emerald-700",
      glowClass: "shadow-sm shadow-emerald-500/10",
    };
  }
  if (score >= 60 || tier === "moderate") {
    return {
      label: "Moderate Match",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      borderClass: "border-amber-300",
      indicatorColor: "bg-amber-500",
      textColor: "text-amber-800",
      glowClass: "shadow-sm shadow-amber-500/10",
    };
  }
  return {
    label: "Low Match",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    borderClass: "border-slate-200",
    indicatorColor: "bg-slate-400",
    textColor: "text-slate-600",
    glowClass: "",
  };
}
