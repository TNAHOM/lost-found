import { z } from "zod";

export const campusZoneEnum = z.enum([
  "Library Complex",
  "Student Union & Dining",
  "Science & Engineering Quad",
  "Athletic & Recreation Center",
  "Arts & Humanities Building",
  "North Quad / Dormitories",
  "South Campus / Parking",
  "Administration Building",
  "Campus Green / Outdoors",
  "Other / Off-Campus",
]);

export const itemCategoryEnum = z.enum([
  "electronics",
  "bags_wallets",
  "clothing_apparel",
  "keys",
  "ids_cards",
  "books_stationery",
  "jewelry_accessories",
  "sports_waterbottles",
  "other",
]);

export const timeOfDayEnum = z.enum([
  "morning",
  "afternoon",
  "evening",
  "night",
  "unknown",
]);

export const itemDateSchema = z
  .string()
  .trim()
  .min(1, { message: "Please provide the date." })
  .refine(
    (val) => {
      const parsed = new Date(val);
      return !isNaN(parsed.getTime());
    },
    { message: "Please enter a valid calendar date." }
  )
  .refine(
    (val) => {
      const parsed = new Date(val);
      // Allow today + 1 day buffer to accommodate timezones
      const maxAllowed = new Date();
      maxAllowed.setDate(maxAllowed.getDate() + 1);
      return parsed <= maxAllowed;
    },
    { message: "Date cannot be in the future." }
  )
  .refine(
    (val) => {
      const parsed = new Date(val);
      const minAllowed = new Date();
      minAllowed.setFullYear(minAllowed.getFullYear() - 1);
      return parsed >= minAllowed;
    },
    { message: "Date cannot be more than 1 year in the past." }
  );

export const optionalEmailSchema = z
  .string()
  .trim()
  .refine(
    (val) => !val || /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(val),
    { message: "Please enter a valid email address (e.g. name@campus.edu)." }
  );

export const optionalPhoneSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true;
      const digitsOnly = val.replace(/\D/g, "");
      const isValidPattern = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,18}$/.test(val);
      return isValidPattern && digitsOnly.length >= 7 && digitsOnly.length <= 15;
    },
    { message: "Please enter a valid phone number (at least 7 digits, e.g. (555) 234-5678)." }
  );



export const lostItemFormSchema = z
  .object({
    title: z.string().trim().min(2, { message: "Item title must be at least 2 characters." }),
    category: itemCategoryEnum,
    color: z.string().trim(),
    brand: z.string().trim(),
    description: z
      .string()
      .trim()
      .min(5, { message: "Please provide a description (at least 5 characters)." }),
    campusZone: campusZoneEnum,
    location: z
      .string()
      .trim()
      .min(2, { message: "Please specify where on campus you lost the item." }),
    date: itemDateSchema,
    timeOfDay: timeOfDayEnum,
    contactName: z
      .string()
      .trim()
      .min(2, { message: "Please provide your name or alias." }),
    contactEmail: optionalEmailSchema,
    contactPhone: optionalPhoneSchema,
  })
  .superRefine((data, ctx) => {
    const email = data.contactEmail?.trim();
    const phone = data.contactPhone?.trim();
    if (!email && !phone) {
      ctx.addIssue({
        code: "custom",
        message: "Please provide at least one contact method (email or phone) to notify you.",
        path: ["contactEmail"],
      });
    }
  });

export type LostItemFormData = z.infer<typeof lostItemFormSchema>;

export const foundItemFormSchema = z.object({
  title: z.string().trim().min(2, { message: "Item title must be at least 2 characters." }),
  category: itemCategoryEnum,
  color: z.string().trim(),
  brand: z.string().trim(),
  description: z
    .string()
    .trim()
    .min(5, { message: "Please describe the found item (at least 5 characters)." }),
  campusZone: campusZoneEnum,
  location: z
    .string()
    .trim()
    .min(2, { message: "Please specify where the item was found." }),
  date: itemDateSchema,
  timeOfDay: timeOfDayEnum,
  holdingLocation: z
    .string()
    .trim()
    .min(2, { message: "Please specify where the item is held (e.g. Info Desk)." }),
  contactName: z.string().trim(),
  isAnonymous: z.boolean(),
});

export type FoundItemFormData = z.infer<typeof foundItemFormSchema>;
