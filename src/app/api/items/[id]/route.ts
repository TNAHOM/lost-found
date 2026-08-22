import { NextResponse } from "next/server";
import { db } from "@/db";
import { items, NewItem, Item } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UpdateItemInput, ApiItemResponse, ApiResponse } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean; id: string; updated: Partial<NewItem> } | ApiResponse<null>>> {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateItemInput;

    const updateData: Partial<NewItem> = {};
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.holdingLocation !== undefined) {
      updateData.holdingLocation = body.holdingLocation;
    }
    if (body.matchedItemId !== undefined) {
      updateData.matchedItemId = body.matchedItemId;
    }

    await db.update(items).set(updateData).where(eq(items.id, id));

    return NextResponse.json({ success: true, id, updated: updateData });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("PATCH /api/items/[id] error:", message);

    return NextResponse.json(
      { error: "Failed to update item", details: message },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiItemResponse | ApiResponse<null>>> {
  try {
    const { id } = await params;
    const result: Item[] = await db.select().from(items).where(eq(items.id, id));

    if (result.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: result[0] });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("GET /api/items/[id] error:", message);

    return NextResponse.json(
      { error: "Failed to fetch item", details: message },
      { status: 500 }
    );
  }
}
