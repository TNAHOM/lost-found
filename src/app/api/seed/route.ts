import { NextResponse } from "next/server";
import { seedDatabase } from "@/db/seed";
import { db } from "@/db";
import { items, Item } from "@/db/schema";
import { ApiSeedResponse, ApiResponse } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<NextResponse<ApiSeedResponse | ApiResponse<null>>> {
  try {
    await seedDatabase();
    const allItems: Item[] = await db.select().from(items);

    return NextResponse.json({
      success: true,
      message: "Database successfully reset and seeded with 2 lost items and 3 found items.",
      count: allItems.length,
      items: allItems,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("POST /api/seed error:", message);

    return NextResponse.json(
      { error: "Failed to seed database", details: message },
      { status: 500 }
    );
  }
}
