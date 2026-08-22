import { NextResponse } from "next/server";
import { db, client } from "@/db";
import { items, Item } from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { CreateItemInput, ApiItemsResponse, ApiItemResponse, ApiResponse, ReportType } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { buildCanonicalItemText, generateEmbedding, hasGeminiApiKey } from "@/lib/gemini-embedding";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function ensureTableAndData(): Promise<Item[]> {
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
      embedding TEXT,
      created_at TEXT NOT NULL
    )
  `);

  const existing: Item[] = await db.select().from(items);
  if (existing.length === 0) {
    await seedDatabase();
    return await db.select().from(items);
  }
  return existing;
}

export async function GET(request: Request): Promise<NextResponse<ApiItemsResponse | ApiResponse<null>>> {
  try {
    await ensureTableAndData();
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");

    let allItems: Item[];
    if (typeParam === "lost" || typeParam === "found") {
      allItems = await db.select().from(items).where(eq(items.type, typeParam as ReportType));
    } else {
      allItems = await db.select().from(items);
    }

    return NextResponse.json({ items: allItems });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("GET /api/items error:", message);

    return NextResponse.json(
      { error: "Failed to fetch items from database", details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiItemResponse | ApiResponse<null>>> {
  try {
    await ensureTableAndData();
    const body = (await request.json()) as CreateItemInput;

    let embeddingJson: string | null = null;
    let warning: string | undefined = undefined;

    // 1. Determine embedding vector
    if (body.embedding) {
      embeddingJson = typeof body.embedding === "string" ? body.embedding : JSON.stringify(body.embedding);
    } else if (hasGeminiApiKey()) {
      const canonicalText = buildCanonicalItemText(body);
      const vector = await generateEmbedding(canonicalText);
      if (vector) {
        embeddingJson = JSON.stringify(vector);
      }
    } else {
      warning = "GEMINI_API_KEY is not configured in .env. Report saved without vector embedding.";
    }

    const newItem: Item = {
      id: body.id || crypto.randomUUID(),
      type: body.type,
      title: body.title,
      description: body.description,
      category: body.category,
      color: body.color || null,
      brand: body.brand || null,
      location: body.location,
      campusZone: body.campusZone,
      date: body.date || new Date().toISOString().split("T")[0],
      timeOfDay: body.timeOfDay || "afternoon",
      contactName: body.contactName || null,
      contactEmail: body.contactEmail || null,
      contactPhone: body.contactPhone || null,
      holdingLocation: body.holdingLocation || null,
      isAnonymous: body.isAnonymous ?? false,
      status: body.status || "open",
      embedding: embeddingJson,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    await db.insert(items).values(newItem);

    return NextResponse.json({ item: newItem, warning }, { status: 201 });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("POST /api/items error:", message);

    return NextResponse.json(
      { error: "Failed to create item", details: message },
      { status: 500 }
    );
  }
}
