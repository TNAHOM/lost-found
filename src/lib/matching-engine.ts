import { CampusZone, LostFoundItem, MatchResult, MatchTier } from "./types";
import { cosineSimilarity, parseVector } from "./gemini-embedding";

// Synonym dictionary & semantic clusters for common campus lost & found items
const SEMANTIC_SYNONYMS: Record<string, string[]> = {
  airpods: ["earbuds", "earbud", "earphones", "headphones", "headset", "airpod", "buds", "wireless earbuds"],
  earbuds: ["airpods", "airpod", "earphones", "headphones", "wireless earbuds", "earbud"],
  headphones: ["earbuds", "airpods", "headset", "earphones", "beats", "over-ear"],
  backpack: ["bag", "bookbag", "knapsack", "rucksack", "pack", "satchel"],
  bag: ["backpack", "bookbag", "tote", "duffel", "satchel", "handbag", "purse"],
  wallet: ["cardholder", "purse", "billfold", "money clip", "pouch"],
  charger: ["cable", "cord", "adapter", "power brick", "powerbank", "magsafe", "usb-c", "usbc", "lightning"],
  laptop: ["macbook", "notebook", "chromebook", "computer", "thinkpad", "dell"],
  phone: ["iphone", "smartphone", "cellphone", "galaxy", "pixel", "mobile"],
  waterbottle: ["bottle", "flask", "hydroflask", "tumbler", "yeti", "thermos", "stanley", "canteen"],
  bottle: ["waterbottle", "flask", "hydroflask", "tumbler", "thermos"],
  jacket: ["coat", "hoodie", "sweater", "fleece", "windbreaker", "parka", "sweatshirt"],
  hoodie: ["jacket", "sweater", "sweatshirt", "pullover", "fleece"],
  calculator: ["ti-84", "ti84", "ti-89", "casio", "graphing calculator"],
  keys: ["keychain", "lanyard", "key fob", "fob", "car key"],
  keychain: ["keys", "lanyard", "fob", "ring"],
  glasses: ["sunglasses", "spectacles", "eyewear", "shades", "frames"],
  card: ["id", "student id", "badge", "driver license", "credit card", "campus card"],
  black: ["dark", "charcoal", "matte black", "jet black", "night"],
  dark: ["black", "navy", "charcoal", "dark grey", "dark gray"],
  white: ["light", "ivory", "cream", "silver", "off-white"],
  silver: ["grey", "gray", "metallic", "aluminum", "light grey"],
  blue: ["navy", "royal blue", "teal", "cyan", "dark blue"],
};

// Stop words to remove during text normalization
const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "by", "for", "with", "about", "against", "between",
  "into", "through", "during", "before", "after", "above", "below", "to", "from", "up",
  "down", "in", "out", "off", "over", "under", "again", "further", "then", "once", "here",
  "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more",
  "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
  "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "i",
  "my", "me", "myself", "we", "our", "you", "your", "he", "him", "she", "her", "it",
  "its", "they", "them", "lost", "found", "around", "near", "beside", "yesterday", "today"
]);

function extractTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

// Proximity matrix between campus zones (1.0 = identical, 0.8 = adjacent/connected, 0.4 = same quadrant, 0.15 = distant)
const CAMPUS_ZONE_PROXIMITY: Record<CampusZone, Record<CampusZone, number>> = {
  "Library Complex": {
    "Library Complex": 1.0,
    "Student Union & Dining": 0.85,
    "Science & Engineering Quad": 0.75,
    "Arts & Humanities Building": 0.8,
    "Administration Building": 0.7,
    "Campus Green / Outdoors": 0.8,
    "North Quad / Dormitories": 0.4,
    "South Campus / Parking": 0.35,
    "Athletic & Recreation Center": 0.25,
    "Other / Off-Campus": 0.1,
  },
  "Student Union & Dining": {
    "Student Union & Dining": 1.0,
    "Library Complex": 0.85,
    "Campus Green / Outdoors": 0.9,
    "Arts & Humanities Building": 0.8,
    "North Quad / Dormitories": 0.7,
    "Administration Building": 0.75,
    "Science & Engineering Quad": 0.65,
    "Athletic & Recreation Center": 0.4,
    "South Campus / Parking": 0.4,
    "Other / Off-Campus": 0.1,
  },
  "Science & Engineering Quad": {
    "Science & Engineering Quad": 1.0,
    "Library Complex": 0.75,
    "Student Union & Dining": 0.65,
    "Campus Green / Outdoors": 0.7,
    "Arts & Humanities Building": 0.5,
    "Administration Building": 0.6,
    "South Campus / Parking": 0.6,
    "North Quad / Dormitories": 0.3,
    "Athletic & Recreation Center": 0.3,
    "Other / Off-Campus": 0.1,
  },
  "Athletic & Recreation Center": {
    "Athletic & Recreation Center": 1.0,
    "South Campus / Parking": 0.8,
    "Campus Green / Outdoors": 0.5,
    "Student Union & Dining": 0.4,
    "North Quad / Dormitories": 0.35,
    "Science & Engineering Quad": 0.3,
    "Library Complex": 0.25,
    "Arts & Humanities Building": 0.2,
    "Administration Building": 0.2,
    "Other / Off-Campus": 0.1,
  },
  "Arts & Humanities Building": {
    "Arts & Humanities Building": 1.0,
    "Library Complex": 0.8,
    "Student Union & Dining": 0.8,
    "Campus Green / Outdoors": 0.75,
    "Administration Building": 0.85,
    "North Quad / Dormitories": 0.5,
    "Science & Engineering Quad": 0.5,
    "Athletic & Recreation Center": 0.2,
    "South Campus / Parking": 0.3,
    "Other / Off-Campus": 0.1,
  },
  "North Quad / Dormitories": {
    "North Quad / Dormitories": 1.0,
    "Student Union & Dining": 0.7,
    "Campus Green / Outdoors": 0.65,
    "Library Complex": 0.4,
    "Arts & Humanities Building": 0.5,
    "Administration Building": 0.4,
    "Science & Engineering Quad": 0.3,
    "Athletic & Recreation Center": 0.35,
    "South Campus / Parking": 0.2,
    "Other / Off-Campus": 0.1,
  },
  "South Campus / Parking": {
    "South Campus / Parking": 1.0,
    "Athletic & Recreation Center": 0.8,
    "Science & Engineering Quad": 0.6,
    "Campus Green / Outdoors": 0.5,
    "Student Union & Dining": 0.4,
    "Library Complex": 0.35,
    "Arts & Humanities Building": 0.3,
    "Administration Building": 0.3,
    "North Quad / Dormitories": 0.2,
    "Other / Off-Campus": 0.15,
  },
  "Administration Building": {
    "Administration Building": 1.0,
    "Arts & Humanities Building": 0.85,
    "Student Union & Dining": 0.75,
    "Library Complex": 0.7,
    "Campus Green / Outdoors": 0.75,
    "Science & Engineering Quad": 0.6,
    "North Quad / Dormitories": 0.4,
    "South Campus / Parking": 0.3,
    "Athletic & Recreation Center": 0.2,
    "Other / Off-Campus": 0.1,
  },
  "Campus Green / Outdoors": {
    "Campus Green / Outdoors": 1.0,
    "Student Union & Dining": 0.9,
    "Library Complex": 0.8,
    "Arts & Humanities Building": 0.75,
    "Administration Building": 0.75,
    "Science & Engineering Quad": 0.7,
    "North Quad / Dormitories": 0.65,
    "Athletic & Recreation Center": 0.5,
    "South Campus / Parking": 0.5,
    "Other / Off-Campus": 0.15,
  },
  "Other / Off-Campus": {
    "Other / Off-Campus": 1.0,
    "South Campus / Parking": 0.2,
    "North Quad / Dormitories": 0.15,
    "Campus Green / Outdoors": 0.15,
    "Student Union & Dining": 0.1,
    "Library Complex": 0.1,
    "Science & Engineering Quad": 0.1,
    "Athletic & Recreation Center": 0.1,
    "Arts & Humanities Building": 0.1,
    "Administration Building": 0.1,
  },
};

/**
 * Calculates Description Similarity Score (0 - 100) using Gemini text-embedding-001 vectors
 * with keyword attribute extraction for transparent explainability
 */
export function calculateDescriptionSimilarity(
  lost: LostFoundItem,
  found: LostFoundItem
): { score: number; sharedKeywords: string[]; isVectorComputed: boolean } {
  const lostTokens = extractTokens(`${lost.title} ${lost.description} ${lost.color || ""} ${lost.brand || ""}`);
  const foundTokens = extractTokens(`${found.title} ${found.description} ${found.color || ""} ${found.brand || ""}`);

  const shared: string[] = [];
  let matchPoints = 0;

  for (const lToken of lostTokens) {
    if (foundTokens.includes(lToken)) {
      matchPoints += 1.0;
      shared.push(lToken);
    } else {
      const synonyms = SEMANTIC_SYNONYMS[lToken] || [];
      for (const fToken of foundTokens) {
        if (synonyms.includes(fToken)) {
          matchPoints += 0.85;
          shared.push(`${lToken} ≈ ${fToken}`);
          break;
        }
      }
    }
  }

  // Category compatibility factor
  let categoryScore = 0.5;
  if (lost.category === found.category) {
    categoryScore = 1.0;
  } else if (lost.category === "other" || found.category === "other") {
    categoryScore = 0.7;
  } else {
    categoryScore = 0.1;
  }

  const lostVec = parseVector(lost.embedding);
  const foundVec = parseVector(found.embedding);

  let finalDescScore: number;
  let isVectorComputed = false;

  if (lostVec && foundVec) {
    // Pure vector cosine similarity (85% vector similarity + 15% category compatibility)
    const cosSim = cosineSimilarity(lostVec, foundVec);
    finalDescScore = Math.round((cosSim * 0.85 + categoryScore * 0.15) * 100);
    isVectorComputed = true;
  } else {
    // Semantic token overlap if vector is not yet generated
    const tokenOverlap = lostTokens.length > 0 ? matchPoints / Math.max(lostTokens.length, 1) : 0;
    const normalizedOverlap = Math.min(tokenOverlap, 1.0);
    finalDescScore = Math.round((normalizedOverlap * 0.7 + categoryScore * 0.3) * 100);
  }

  return {
    score: Math.min(Math.max(finalDescScore, 0), 100),
    sharedKeywords: Array.from(new Set(shared)),
    isVectorComputed,
  };
}

/**
 * Calculates Location Proximity Score (0 - 100)
 */
export function calculateLocationProximity(
  lost: LostFoundItem,
  found: LostFoundItem
): { score: number; reason: string } {
  // Check exact zone proximity matrix
  const zoneScore = CAMPUS_ZONE_PROXIMITY[lost.campusZone]?.[found.campusZone] ?? 0.3;

  // Check specific location text token overlap
  const lostLocTokens = extractTokens(lost.location);
  const foundLocTokens = extractTokens(found.location);
  const commonLocTokens = lostLocTokens.filter((t) => foundLocTokens.includes(t));

  let locBonus = 0;
  if (commonLocTokens.length > 0) {
    locBonus = 0.15;
  }

  const totalLocScore = Math.min(Math.round((zoneScore + locBonus) * 100), 100);

  let reason = "";
  if (totalLocScore >= 90) {
    reason = `Same campus area (${lost.campusZone})`;
  } else if (totalLocScore >= 70) {
    reason = `Adjacent campus zones (${lost.campusZone} ↔ ${found.campusZone})`;
  } else if (totalLocScore >= 40) {
    reason = `Moderate campus distance (${lost.campusZone} vs ${found.campusZone})`;
  } else {
    reason = `Distant locations (${lost.campusZone} vs ${found.campusZone})`;
  }

  return { score: totalLocScore, reason };
}

/**
 * Calculates Temporal Validity & Decay Score (0 - 100)
 * Evaluates chronology (item cannot be found before lost, with 2hr grace) and decay over elapsed days
 */
export function calculateTemporalScore(
  lostDateStr: string,
  foundDateStr: string
): { score: number; deltaHours: number; isValid: boolean; reason: string } {
  const lostDate = new Date(lostDateStr);
  const foundDate = new Date(foundDateStr);

  const diffMs = foundDate.getTime() - lostDate.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  // Hard disqualification if found before lost by more than 2 hours
  if (diffHours < -2) {
    return {
      score: 0,
      deltaHours: diffHours,
      isValid: false,
      reason: `Found date (${foundDateStr}) precedes reported lost date (${lostDateStr})`,
    };
  }

  let tempScore = 1.0;
  let reason = "";

  if (diffDays <= 0) {
    tempScore = 1.0;
    reason = diffHours <= 4 ? "Found within hours of loss" : "Found on the same day";
  } else if (diffDays <= 2) {
    tempScore = 0.9;
    reason = `Found ${diffDays} day${diffDays > 1 ? "s" : ""} later`;
  } else if (diffDays <= 5) {
    tempScore = 0.75;
    reason = `Found ${diffDays} days later`;
  } else if (diffDays <= 10) {
    tempScore = 0.5;
    reason = `Found ~1 week later (${diffDays} days)`;
  } else if (diffDays <= 21) {
    tempScore = 0.25;
    reason = `Significant time gap: found ${diffDays} days (~2-3 weeks) later`;
  } else {
    tempScore = 0.1;
    reason = `Found over a month later (${diffDays} days)`;
  }

  return {
    score: Math.round(tempScore * 100),
    deltaHours: diffHours,
    isValid: true,
    reason,
  };
}

/**
 * Computes full multi-factor matching score using the formula:
 * Overall Score = (0.50 * S_desc) + (0.25 * S_loc) + (0.25 * S_time)
 */
export function evaluateItemMatch(lost: LostFoundItem, found: LostFoundItem): MatchResult {
  const { score: descScore, sharedKeywords } = calculateDescriptionSimilarity(lost, found);
  const { score: locScore, reason: locReason } = calculateLocationProximity(lost, found);
  const { score: timeScore, deltaHours, isValid: isTimeValid, reason: timeReason } = calculateTemporalScore(
    lost.date,
    found.date
  );

  const categoryMatch = lost.category === found.category ? 100 : 30;

  let overallScore = 0;
  if (!isTimeValid) {
    overallScore = Math.round(descScore * 0.3);
  } else {
    overallScore = Math.round(0.5 * descScore + 0.25 * locScore + 0.25 * timeScore);
  }

  overallScore = Math.min(Math.max(overallScore, 0), 100);

  // Determine Tier
  let matchTier: MatchTier = "low";
  if (overallScore >= 80) matchTier = "strong";
  else if (overallScore >= 60) matchTier = "moderate";

  // Deterministic phrase-assembly engine
  const explanation = assembleDeterministicExplanation({
    overallScore,
    matchTier,
    descScore,
    locScore,
    timeScore,
    sharedKeywords,
    locReason,
    timeReason,
    lostTitle: lost.title,
    foundTitle: found.title,
  });

  return {
    id: `match-${lost.id}-${found.id}`,
    lostItem: lost,
    foundItem: found,
    overallScore,
    matchTier,
    breakdown: {
      descriptionSimilarity: descScore,
      locationProximity: locScore,
      temporalScore: timeScore,
      categoryMatch,
      timeDeltaHours: deltaHours,
      isTimeValid,
    },
    explanation,
    status: "unreviewed",
  };
}


function assembleDeterministicExplanation(data: {
  overallScore: number;
  matchTier: MatchTier;
  descScore: number;
  locScore: number;
  timeScore: number;
  sharedKeywords: string[];
  locReason: string;
  timeReason: string;
  lostTitle: string;
  foundTitle: string;
}): string {
  const parts: string[] = [];

  // Description clause
  if (data.descScore >= 85) {
    parts.push(
      `Strong semantic match between "${data.lostTitle}" and "${data.foundTitle}"${
        data.sharedKeywords.length ? ` (key attributes: ${data.sharedKeywords.slice(0, 3).join(", ")})` : ""
      }`
    );
  } else if (data.descScore >= 60) {
    parts.push(`Moderate item description similarity (${data.sharedKeywords.slice(0, 2).join(", ") || "compatible item type"})`);
  } else {
    parts.push(`Low keyword similarity between item descriptions`);
  }

  // Location clause
  if (data.locScore >= 85) {
    parts.push(`reported in the exact same campus location (${data.locReason})`);
  } else if (data.locScore >= 65) {
    parts.push(`located in closely adjacent campus zones`);
  } else {
    parts.push(`distant campus locations (${data.locReason})`);
  }

  // Time clause
  parts.push(data.timeReason.toLowerCase());

  // Stitch together with confidence header
  const tierPrefix =
    data.matchTier === "strong"
      ? `Strong Match (${data.overallScore}%): `
      : data.matchTier === "moderate"
      ? `Moderate Match (${data.overallScore}%): `
      : `Low Match (${data.overallScore}%): `;

  return `${tierPrefix}${parts.join(", ")}.`;
}

/**
 * Finds all potential matches across a list of lost and found items
 */
export function findMatches(
  lostItems: LostFoundItem[],
  foundItems: LostFoundItem[],
  minScore = 30
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const lost of lostItems) {
    if (lost.type !== "lost") continue;
    for (const found of foundItems) {
      if (found.type !== "found") continue;
      const match = evaluateItemMatch(lost, found);
      if (match.overallScore >= minScore) {
        results.push(match);
      }
    }
  }

  return results.sort((a, b) => b.overallScore - a.overallScore);
}
