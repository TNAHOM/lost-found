"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useItems } from "@/lib/items-context";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  CAMPUS_ZONES,
  CATEGORIES,
  TIME_OF_DAY_OPTIONS,
} from "@/lib/constants";
import {
  lostItemFormSchema,
  LostItemFormData,
} from "@/lib/schemas/item-form-schema";

export function LostItemForm() {
  const router = useRouter();
  const { addLostItem, findLiveMatchesForDraft } = useItems();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LostItemFormData>({
    resolver: zodResolver(lostItemFormSchema),
    defaultValues: {
      title: "",
      category: "electronics",
      color: "",
      brand: "",
      description: "",
      campusZone: "Student Union & Dining",
      location: "",
      date: new Date().toISOString().split("T")[0],
      timeOfDay: "afternoon",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  // Real-time live candidate matches as the user types
  const watchedFields = useWatch({ control });
  const liveMatches = findLiveMatchesForDraft(
    {
      title: watchedFields.title,
      description: watchedFields.description,
      category: watchedFields.category,
      color: watchedFields.color,
      campusZone: watchedFields.campusZone,
      location: watchedFields.location,
      date: watchedFields.date,
    },
    "lost"
  );

  const onSubmit = async (data: LostItemFormData) => {
    const newItem = await addLostItem({
      title: data.title,
      category: data.category,
      color: data.color || "Not specified",
      brand: data.brand || undefined,
      description: data.description,
      campusZone: data.campusZone,
      location: data.location,
      date: data.date,
      timeOfDay: data.timeOfDay,
      contactName: data.contactName,
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
    });

    setCreatedItemId(newItem.id);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center space-y-6 bg-white border border-slate-200 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle className="h-8 w-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Lost Report Logged Successfully!
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            Your report{" "}
            <code className="font-mono text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
              #{createdItemId}
            </code>{" "}
            has been indexed into the automated campus matcher.
          </p>
        </div>

        {liveMatches.length > 0 ? (
          <div className="rounded-2xl bg-blue-50/70 p-5 border border-blue-200 text-left space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>{liveMatches.length} Immediate Potential Match(es) Detected!</span>
            </div>
            <p className="text-xs text-blue-750">
              Found items in university custody already align with your lost description.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/matches">
                <Button variant="glow" size="sm">
                  <span>View Matches Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              {createdItemId && (
                <Link href={`/items/${createdItemId}?type=lost`}>
                  <Button variant="outline" size="sm">
                    View Report Details
                  </Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-3">
            {createdItemId && (
              <Link href={`/items/${createdItemId}?type=lost`}>
                <Button variant="default" size="sm">
                  View Report Details
                </Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="outline" size="sm">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Left/Center Columns */}
      <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
        <Card className="p-6 space-y-6 bg-white border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="lost">LOST ITEM REPORT</Badge>
              <span className="text-xs text-slate-500">Step 1 of 1</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              Tell us what you lost
            </h2>
            <p className="text-xs text-slate-500">
              Describe your missing item in natural language. Our semantic matcher will correlate it with turned-in items across campus.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Item Title / Short Name"
              placeholder="e.g. Black AirPods Case, Hydro Flask..."
              error={errors.title?.message}
              {...register("title")}
            />

            <Select
              label="Category"
              error={errors.category?.message}
              {...register("category")}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Color"
              placeholder="e.g. Black, Matte Dark, Navy, Teal..."
              error={errors.color?.message}
              {...register("color")}
            />

            <Input
              label="Brand / Make (Optional)"
              placeholder="e.g. Apple, North Face, Hydro Flask..."
              error={errors.brand?.message}
              {...register("brand")}
            />
          </div>

          <Textarea
            label="Detailed Description & Distinguishing Features"
            placeholder="Describe scratches, stickers, contents, case type, or anything unique..."
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Select
              label="Campus Zone / Area"
              error={errors.campusZone?.message}
              {...register("campusZone")}
            >
              {CAMPUS_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </Select>

            <Input
              label="Specific Location / Landmark"
              placeholder="e.g. Cafeteria near window, 2nd floor library desk..."
              error={errors.location?.message}
              {...register("location")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date Lost"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              error={errors.date?.message}
              {...register("date")}
            />

            <Select
              label="Approximate Time of Day"
              error={errors.timeOfDay?.message}
              {...register("timeOfDay")}
            >
              {TIME_OF_DAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Contact Details */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Your Contact Information (for match notification)
              </h4>
              <p className="text-xs text-slate-500">
                Please provide at least your student email or phone number.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Your Name"
                placeholder="e.g. Alex Rivera"
                error={errors.contactName?.message}
                {...register("contactName")}
              />

              <Input
                label="Student Email"
                type="email"
                placeholder="e.g. alex@campus.edu"
                error={errors.contactEmail?.message}
                {...register("contactEmail")}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="e.g. (555) 234-5678"
                error={errors.contactPhone?.message}
                {...register("contactPhone")}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="px-6 font-semibold"
            >
              {isSubmitting ? "Logging Report..." : "Submit Lost Report"}
            </Button>
          </div>
        </Card>
      </form>

      {/* Live Match Engine Radar Sidebar */}
      <div className="space-y-4">
        <div className="sticky top-24 space-y-4">
          <Card className="p-5 border-blue-200 bg-gradient-to-br from-white to-blue-50/30 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Live Match Suggestion Radar
              </h4>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              As you type, our matching engine evaluates potential matches against active turned-in campus items.
            </p>

            <div className="mt-4 space-y-3">
              {liveMatches.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 bg-white">
                  Fill in title & description to see live match correlations.
                </div>
              ) : (
                liveMatches.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 space-y-2 animate-in fade-in-50 duration-200 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800">
                        {m.overallScore}% Potential Match
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {formatDate(m.foundItem.date)}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-900 line-clamp-1">
                      {m.foundItem.title}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {m.foundItem.description}
                    </p>
                    {m.foundItem.holdingLocation && (
                      <p className="text-[10px] text-emerald-700 font-semibold">
                        Held at: {m.foundItem.holdingLocation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
