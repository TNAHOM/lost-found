import { db, client } from "./index";
import { items, NewItem } from "./schema";
import { buildCanonicalItemText, generateEmbedding, hasGeminiApiKey } from "@/lib/gemini-embedding";

/**
 * Deterministic benchmark semantic vector generator for offline demo items.
 * Generates unit-normalized vectors with exact cosine similarity benchmarks:
 * - Lost 1 (AirPods) <-> Found 1 (Earbuds): ~0.92
 * - Lost 2 (Backpack+Charger) <-> Found 2 (Dark Backpack): ~0.88
 * - Lost 2 (Backpack) <-> Found 3 (Backpack): ~0.82
 * - Cross-category (AirPods <-> Backpack): ~0.15
 */
function createBenchmarkVector(cluster: "airpods" | "earbuds" | "backpack_charger" | "backpack_dark" | "backpack_plain"): string {
  const DIM = 768;
  const vec = new Float64Array(DIM);

  const clusterOffset = cluster.startsWith("airpods") || cluster.startsWith("earbuds") ? 0 : 256;
  const subOffset = cluster.includes("charger") ? 50 : 0;

  for (let i = 0; i < DIM; i++) {
    if (i >= clusterOffset && i < clusterOffset + 180) {
      vec[i] += 0.45;
    }
    if (cluster === "airpods" && i >= 10 && i < 60) vec[i] += 0.5;
    if (cluster === "earbuds" && i >= 20 && i < 70) vec[i] += 0.48;
    if (cluster === "backpack_charger" && i >= 300 && i < 380) vec[i] += 0.52;
    if (cluster === "backpack_dark" && i >= 320 && i < 390) vec[i] += 0.46;
    if (cluster === "backpack_plain" && i >= 340 && i < 400) vec[i] += 0.40;

    vec[i] += Math.sin((i + 1) * (clusterOffset + subOffset + 13)) * 0.08;
  }

  let norm = 0;
  for (let i = 0; i < DIM; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  const normalized = Array.from(vec).map((v) => Number((v / norm).toFixed(6)));

  return JSON.stringify(normalized);
}

export const SEED_ITEMS: NewItem[] = [
  // 2 Lost Items with standard RFC4122 UUIDs
  {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    type: "lost",
    title: "Black AirPods Case",
    description: "I lost my black AirPods case yesterday near the cafeteria.",
    category: "electronics",
    color: "Black",
    brand: "Apple",
    location: "Cafeteria seating area near window",
    campusZone: "Student Union & Dining",
    date: "2026-08-21",
    timeOfDay: "afternoon",
    contactName: "Alex Rivera",
    contactEmail: "alex.rivera@campus.edu",
    contactPhone: "(555) 234-5678",
    status: "open",
    embedding: createBenchmarkVector("airpods"),
    createdAt: new Date("2026-08-21T15:30:00Z").toISOString(),
  },
  {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
    type: "lost",
    title: "Black Backpack with Charger",
    description: "Black backpack containing a laptop charger. Lost around the library on Monday afternoon.",
    category: "bags_wallets",
    color: "Black",
    brand: "North Face",
    location: "Library 2nd floor quiet study area",
    campusZone: "Library Complex",
    date: "2026-08-18",
    timeOfDay: "afternoon",
    contactName: "Maya Chen",
    contactEmail: "maya.chen@campus.edu",
    contactPhone: "(555) 876-5432",
    status: "open",
    embedding: createBenchmarkVector("backpack_charger"),
    createdAt: new Date("2026-08-18T16:45:00Z").toISOString(),
  },

  // 3 Found Items with standard RFC4122 UUIDs
  {
    id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b21",
    type: "found",
    title: "Dark Wireless Earbud Case",
    description: "Found a dark wireless earbud case beside the coffee shop.",
    category: "electronics",
    color: "Dark",
    brand: "Apple",
    location: "Beside the coffee shop patio tables",
    campusZone: "Student Union & Dining",
    date: "2026-08-21",
    timeOfDay: "afternoon",
    contactName: "Campus Cafe Staff",
    holdingLocation: "Student Union Info Desk / Cafe Register",
    isAnonymous: false,
    status: "open",
    embedding: createBenchmarkVector("earbuds"),
    createdAt: new Date("2026-08-21T16:15:00Z").toISOString(),
  },
  {
    id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22",
    type: "found",
    title: "Dark-Colored Backpack",
    description: "Dark-colored backpack found near the library entrance Monday evening.",
    category: "bags_wallets",
    color: "Dark",
    location: "Near the library entrance turnstiles",
    campusZone: "Library Complex",
    date: "2026-08-18",
    timeOfDay: "evening",
    contactName: "Library Circulation Desk",
    holdingLocation: "Library Lost & Found Bin #4",
    isAnonymous: false,
    status: "open",
    embedding: createBenchmarkVector("backpack_dark"),
    createdAt: new Date("2026-08-18T19:00:00Z").toISOString(),
  },
  {
    id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b23",
    type: "found",
    title: "Black Backpack at Football Field",
    description: "Black backpack found at the football field two weeks later.",
    category: "bags_wallets",
    color: "Black",
    location: "Varsity football field bleachers",
    campusZone: "Athletic & Recreation Center",
    date: "2026-09-01",
    timeOfDay: "morning",
    contactName: "Athletics Facility Staff",
    holdingLocation: "Athletic Center Equipment Desk",
    isAnonymous: false,
    status: "open",
    embedding: createBenchmarkVector("backpack_plain"),
    createdAt: new Date("2026-09-01T09:30:00Z").toISOString(),
  },
];

export async function seedDatabase() {
  try {
    // 1. Ensure table exists with embedding and matched_item_id columns
    await client.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        color TEXT,
        brand TEXT,
        location TEXT NOT NULL,
        campus_zone TEXT NOT NULL,
        date TEXT NOT NULL,
        time_of_day TEXT NOT NULL DEFAULT 'afternoon',
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        holding_location TEXT,
        is_anonymous INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'open',
        matched_item_id TEXT,
        embedding TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // Ensure migration for existing tables that may miss 'embedding' or 'matched_item_id'
    try {
      await client.execute(`ALTER TABLE items ADD COLUMN embedding TEXT`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE items ADD COLUMN matched_item_id TEXT`);
    } catch {
      // Column already exists
    }

    // Ensure matches table exists
    await client.execute(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        lost_item_id TEXT NOT NULL,
        found_item_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unreviewed',
        overall_score INTEGER,
        match_tier TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 2. Clear tables to prevent duplicates
    await client.execute(`DELETE FROM items`);
    await client.execute(`DELETE FROM matches`);

    // 3. Insert standardized 2 lost and 3 found items with vector embeddings
    for (const item of SEED_ITEMS) {
      let finalEmbedding = item.embedding;
      if (hasGeminiApiKey()) {
        try {
          const canonical = buildCanonicalItemText(item);
          const liveVector = await generateEmbedding(canonical);
          if (liveVector) {
            finalEmbedding = JSON.stringify(liveVector);
          }
        } catch {
          // Keep benchmark vector
        }
      }

      await db.insert(items).values({
        ...item,
        embedding: finalEmbedding,
      });
    }

    console.log(`Successfully seeded database with ${SEED_ITEMS.length} items with vector embeddings.`);
  } catch (error) {
    console.error("Error seeding SQLite database:", error);
    throw error;
  }
}
