import { NextResponse } from "next/server";
import { db, client } from "@/db";
import { items, matches, Match } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MatchActionInput, ApiMatchesResponse, ApiMatchActionResponse, ApiResponse, MatchStatus } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function ensureMatchesTable(): Promise<void> {
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
}

export async function GET(): Promise<NextResponse<ApiMatchesResponse | ApiResponse<null>>> {
  try {
    await ensureMatchesTable();
    const allMatches: Match[] = await db.select().from(matches);

    return NextResponse.json({ matches: allMatches });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("GET /api/matches error:", message);

    return NextResponse.json(
      { error: "Failed to fetch matches from database", details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiMatchActionResponse | ApiResponse<null>>> {
  try {
    await ensureMatchesTable();
    const body = (await request.json()) as MatchActionInput;
    const { matchId, lostItemId, foundItemId, action, overallScore, matchTier } = body;

    if (!matchId || !lostItemId || !foundItemId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: matchId, lostItemId, foundItemId, and action are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let targetStatus: MatchStatus = "unreviewed";

    if (action === "claim") {
      targetStatus = "claimed";
    } else if (action === "verify") {
      targetStatus = "confirmed";
    } else if (action === "reject") {
      targetStatus = "rejected";
    } else if (action === "unverify") {
      targetStatus = "unreviewed";
    }

    // 1. Check if match record already exists in database
    const existingMatch = await db.select().from(matches).where(eq(matches.id, matchId));

    let savedMatch: Match;
    if (existingMatch.length > 0) {
      await db
        .update(matches)
        .set({
          status: targetStatus,
          overallScore: overallScore ?? existingMatch[0].overallScore,
          matchTier: matchTier ?? existingMatch[0].matchTier,
          updatedAt: now,
        })
        .where(eq(matches.id, matchId));

      savedMatch = {
        ...existingMatch[0],
        status: targetStatus,
        overallScore: overallScore ?? existingMatch[0].overallScore,
        matchTier: matchTier ?? existingMatch[0].matchTier,
        updatedAt: now,
      };
    } else {
      const newMatch: Match = {
        id: matchId,
        lostItemId,
        foundItemId,
        status: targetStatus,
        overallScore: overallScore ?? null,
        matchTier: matchTier ?? null,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(matches).values(newMatch);
      savedMatch = newMatch;
    }

    // 2. Cascade changes to items table based on action
    if (action === "claim") {
      // Mark both items as claimed and link them together
      await db
        .update(items)
        .set({ status: "claimed", matchedItemId: foundItemId })
        .where(eq(items.id, lostItemId));

      await db
        .update(items)
        .set({ status: "claimed", matchedItemId: lostItemId })
        .where(eq(items.id, foundItemId));
    } else if (action === "verify") {
      // Mark items as potential_match and link them
      await db
        .update(items)
        .set({ status: "potential_match", matchedItemId: foundItemId })
        .where(eq(items.id, lostItemId));

      await db
        .update(items)
        .set({ status: "potential_match", matchedItemId: lostItemId })
        .where(eq(items.id, foundItemId));
    } else if (action === "reject" || action === "unverify") {
      // If items were pointing to each other and are not claimed, reset matchedItemId and status
      const [lostResult] = await db.select().from(items).where(eq(items.id, lostItemId));
      const [foundResult] = await db.select().from(items).where(eq(items.id, foundItemId));

      if (lostResult && lostResult.matchedItemId === foundItemId && lostResult.status !== "claimed") {
        await db
          .update(items)
          .set({ status: "open", matchedItemId: null })
          .where(eq(items.id, lostItemId));
      }

      if (foundResult && foundResult.matchedItemId === lostItemId && foundResult.status !== "claimed") {
        await db
          .update(items)
          .set({ status: "open", matchedItemId: null })
          .where(eq(items.id, foundItemId));
      }
    }

    // Fetch updated items to return to client
    const [updatedLost] = await db.select().from(items).where(eq(items.id, lostItemId));
    const [updatedFound] = await db.select().from(items).where(eq(items.id, foundItemId));

    return NextResponse.json({
      success: true,
      match: savedMatch,
      lostItem: updatedLost,
      foundItem: updatedFound,
      message: `Match successfully updated to ${targetStatus}`,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("POST /api/matches error:", message);
    
    return NextResponse.json(
      { error: "Failed to update match status in database", details: message },
      { status: 500 }
    );
  }
}
