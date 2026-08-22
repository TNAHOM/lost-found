import { GoogleGenAI } from "@google/genai";
import { LostFoundItem } from "./types";

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function buildCanonicalItemText(item: Partial<LostFoundItem>): string {
  const parts: string[] = [];
  if (item.title) parts.push(`Item: ${item.title}`);
  if (item.category) parts.push(`Category: ${item.category}`);
  if (item.color) parts.push(`Color: ${item.color}`);
  if (item.brand) parts.push(`Brand: ${item.brand}`);
  if (item.description) parts.push(`Details: ${item.description}`);
  if (item.location) parts.push(`Campus Area: ${item.location}`);
  return parts.join(". ");
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const ai = getAiClient();
  if (!ai || !text.trim()) return null;

  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });
    const values = response.embeddings?.[0]?.values;
    return values && Array.isArray(values) ? values : null;
  } catch (error) {
    console.error("Gemini gemini-embedding-001 API error:", error);
    return null;
  }
}

/**
 * Computes Cosine Similarity between two dense float vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Safe parsing helper for vectors stored in SQLite as JSON TEXT.
 */
export function parseVector(raw: string | number[] | null | undefined): number[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as number[]) : null;
  } catch {
    return null;
  }
}
