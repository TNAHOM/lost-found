import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { CampusZone, ItemCategory, ItemStatus, ReportType, TimeOfDay } from "@/lib/types";

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  type: text("type").$type<ReportType>().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").$type<ItemCategory>().notNull(),
  color: text("color"),
  brand: text("brand"),
  location: text("location").notNull(),
  campusZone: text("campus_zone").$type<CampusZone>().notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  timeOfDay: text("time_of_day").$type<TimeOfDay>().notNull().default("afternoon"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  holdingLocation: text("holding_location"),
  isAnonymous: integer("is_anonymous", { mode: "boolean" }).default(false),
  status: text("status").$type<ItemStatus>().notNull().default("open"),
  embedding: text("embedding"), // JSON stringified array of float values
  createdAt: text("created_at").notNull(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
