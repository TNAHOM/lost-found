import { NextResponse } from "next/server";
import { generateEmbedding, hasGeminiApiKey } from "@/lib/gemini-embedding";
import { ApiEmbedResponse } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse<ApiEmbedResponse>> {
  try {
    const hasKey = hasGeminiApiKey();
    if (!hasKey) {
      return NextResponse.json({
        vector: null,
        hasKey: false,
        error: "GEMINI_API_KEY is not configured in environment variables.",
      });
    }

    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim() || "";

    if (!text) {
      return NextResponse.json({ vector: null, hasKey: true });
    }

    const vector = await generateEmbedding(text);
    return NextResponse.json({ vector, hasKey: true });

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("POST /api/embed error:", message);

    return NextResponse.json(
      { vector: null, hasKey: hasGeminiApiKey(), error: message },
      { status: 500 }
    );
  }
}
