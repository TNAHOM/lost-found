import { CampusZone, ItemCategory, TimeOfDay } from "./types";

/**
 * Standard campus zones recognized across the university
 */
export const CAMPUS_ZONES: CampusZone[] = [
  "Student Union & Dining",
  "Library Complex",
  "Science & Engineering Quad",
  "Athletic & Recreation Center",
  "Arts & Humanities Building",
  "North Quad / Dormitories",
  "South Campus / Parking",
  "Administration Building",
  "Campus Green / Outdoors",
  "Other / Off-Campus",
];


export const CAMPUS_ZONE_FILTER_OPTIONS: { value: CampusZone | "all"; label: string }[] = [
  { value: "all", label: "All Campus Zones" },
  { value: "Library Complex", label: "Library Complex" },
  { value: "Student Union & Dining", label: "Student Union & Dining" },
  { value: "Science & Engineering Quad", label: "Science & Engineering Quad" },
  { value: "Athletic & Recreation Center", label: "Athletic & Recreation Center" },
  { value: "Arts & Humanities Building", label: "Arts & Humanities Building" },
  { value: "North Quad / Dormitories", label: "North Quad / Dormitories" },
  { value: "South Campus / Parking", label: "South Campus / Parking" },
  { value: "Administration Building", label: "Administration Building" },
  { value: "Campus Green / Outdoors", label: "Campus Green / Outdoors" },
  { value: "Other / Off-Campus", label: "Other / Off-Campus" },
];


export const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "electronics", label: "Electronics & Tech (AirPods, Laptops, Chargers)" },
  { value: "bags_wallets", label: "Bags & Wallets (Backpacks, Totes, Purses)" },
  { value: "ids_cards", label: "Cards & IDs (Student ID, Transit, Licenses)" },
  { value: "keys", label: "Keys & Keychains (Car keys, Lanyards, Fobs)" },
  { value: "clothing_apparel", label: "Clothing & Apparel (Jackets, Hoodies, Hats)" },
  { value: "sports_waterbottles", label: "Bottles & Sports Gear (Hydro Flasks, Gym bags)" },
  { value: "books_stationery", label: "Books & Stationery (Calculators, Notebooks)" },
  { value: "jewelry_accessories", label: "Jewelry & Accessories (Watches, Glasses)" },
  { value: "other", label: "Other / Miscellaneous" },
];

export const CATEGORY_FILTER_OPTIONS: { value: ItemCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "electronics", label: "Electronics & Tech" },
  { value: "bags_wallets", label: "Bags & Wallets" },
  { value: "ids_cards", label: "Cards & IDs" },
  { value: "keys", label: "Keys & Keychain" },
  { value: "clothing_apparel", label: "Clothing & Apparel" },
  { value: "sports_waterbottles", label: "Bottles & Gear" },
  { value: "books_stationery", label: "Books & Stationery" },
  { value: "jewelry_accessories", label: "Jewelry & Accessories" },
  { value: "other", label: "Other" },
];

export const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "morning", label: "Morning (8:00 AM - 12:00 PM)" },
  { value: "afternoon", label: "Afternoon (12:00 PM - 5:00 PM)" },
  { value: "evening", label: "Evening (5:00 PM - 9:00 PM)" },
  { value: "night", label: "Night / Late (9:00 PM+)" },
  { value: "unknown", label: "Approximate / Not Sure" },
];

export const HOLDING_LOCATIONS: string[] = [
  "Student Union Info Desk",
  "Campus Safety & Police Desk",
  "Main Library Circulation Desk",
  "Athletic Center Front Desk",
  "Engineering Building Admin Office",
  "Student Housing Central Office",
];
