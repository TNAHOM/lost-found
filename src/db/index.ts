import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

let rawUrl = process.env.DATABASE_URL || "file:sqlite.db";
if (!rawUrl.startsWith("file:") && !rawUrl.startsWith("http://") && !rawUrl.startsWith("https://") && !rawUrl.startsWith("libsql://")) {
  rawUrl = `file:${rawUrl}`;
}

const globalForDb = globalThis as unknown as {
  libsql: ReturnType<typeof createClient> | undefined;
};

export const client =
  globalForDb.libsql ??
  createClient({
    url: rawUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.libsql = client;
}

export const db = drizzle(client, { schema });
export * from "./schema";
