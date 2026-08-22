export type ReportType = "lost" | "found";

export type ItemCategory =
  | "electronics"
  | "bags_wallets"
  | "clothing_apparel"
  | "keys"
  | "ids_cards"
  | "books_stationery"
  | "jewelry_accessories"
  | "sports_waterbottles"
  | "other";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night" | "unknown";

export type ItemStatus = "open" | "potential_match" | "resolved" | "claimed";

export type MatchStatus = "unreviewed" | "confirmed" | "rejected" | "claimed";

export type MatchTier = "strong" | "moderate" | "low";

export type CampusZone =
  | "Library Complex"
  | "Student Union & Dining"
  | "Science & Engineering Quad"
  | "Athletic & Recreation Center"
  | "Arts & Humanities Building"
  | "North Quad / Dormitories"
  | "South Campus / Parking"
  | "Administration Building"
  | "Campus Green / Outdoors"
  | "Other / Off-Campus";

export interface LostFoundItem {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  category: ItemCategory;
  color?: string | null;
  brand?: string | null;
  location: string;
  campusZone: CampusZone;
  date: string; // ISO format date (YYYY-MM-DD)
  timeOfDay: TimeOfDay;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  holdingLocation?: string | null; // For found items (e.g. "Security Desk", "Front Desk")
  isAnonymous?: boolean | null;
  status: ItemStatus;
  embedding?: string | null; // JSON string of number[] (768-dim float vector)
  createdAt: string;
  imageUrl?: string | null;
  matchCount?: number;
  matchedItemId?: string | null;
  searchRelevanceScore?: number; // 0 - 100 for feed search ranking
}

export interface CreateItemInput {
  id?: string;
  type: ReportType;
  title: string;
  description: string;
  category: ItemCategory;
  color?: string | null;
  brand?: string | null;
  location: string;
  campusZone: CampusZone;
  date?: string;
  timeOfDay?: TimeOfDay;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  holdingLocation?: string | null;
  isAnonymous?: boolean | null;
  status?: ItemStatus;
  embedding?: string | null;
  createdAt?: string;
}

export interface UpdateItemInput {
  status?: ItemStatus;
  holdingLocation?: string;
}

export interface MatchScoreBreakdown {
  descriptionSimilarity: number; // 0 - 100
  locationProximity: number; // 0 - 100
  temporalScore: number; // 0 - 100
  categoryMatch: number; // 0 - 100
  timeDeltaHours: number; // calculated hours difference
  isTimeValid: boolean; // false if found date significantly precedes lost date
}

export interface MatchHighlights {
  sharedKeywords: string[];
  locationMatchReason: string;
  temporalReason: string;
  categoryMatchReason: string;
}

export interface MatchResult {
  id: string;
  lostItem: LostFoundItem;
  foundItem: LostFoundItem;
  overallScore: number; // 0 - 100
  matchTier: MatchTier;
  breakdown: MatchScoreBreakdown;
  explanation: string;
  highlights: MatchHighlights;
  status: MatchStatus;
}

export interface FilterState {
  searchQuery: string;
  searchMode: "hybrid" | "keyword";
  type: "all" | ReportType;
  category: "all" | ItemCategory;
  campusZone: "all" | CampusZone;
  status: "all" | ItemStatus;
  minMatchScore: number;
  sortBy: "relevance" | "newest" | "oldest" | "highest_match";
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string;
  warning?: string;
  success?: boolean;
}

export interface ApiItemsResponse {
  items: LostFoundItem[];
}

export interface ApiItemResponse {
  item: LostFoundItem;
  warning?: string;
}

export interface ApiSeedResponse {
  success: boolean;
  message: string;
  count: number;
  items: LostFoundItem[];
}

export interface ApiEmbedResponse {
  vector: number[] | null;
  hasKey: boolean;
  error?: string;
}
