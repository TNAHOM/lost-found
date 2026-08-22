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
import { Sparkles, CheckCircle, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  CAMPUS_ZONES,
  CATEGORIES,
  TIME_OF_DAY_OPTIONS,
  HOLDING_LOCATIONS,
} from "@/lib/constants";
import {
  foundItemFormSchema,
  FoundItemFormData,
} from "@/lib/schemas/item-form-schema";

export function FoundItemForm() {
  const router = useRouter();
  const { addFoundItem, findLiveMatchesForDraft } = useItems();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FoundItemFormData>({
    resolver: zodResolver(foundItemFormSchema),
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
      holdingLocation: "Student Union Info Desk",
      contactName: "Campus Staff",
      isAnonymous: false,
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
    "found"
  );

  const onSubmit = async (data: FoundItemFormData) => {
    const newItem = await addFoundItem({
      title: data.title,
      category: data.category,
      color: data.color || "Not specified",
      brand: data.brand || undefined,
      description: data.description,
      campusZone: data.campusZone,
      location: data.location,
      date: data.date,
      timeOfDay: data.timeOfDay,
      holdingLocation: data.holdingLocation,
      contactName: data.isAnonymous ? "Anonymous Finder" : data.contactName,
      isAnonymous: data.isAnonymous,
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
            Found Item Registered!
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            Report{" "}
            <code className="font-mono text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
              #{createdItemId}
            </code>{" "}
            has been indexed and custody logged.
          </p>
        </div>

        {liveMatches.length > 0 ? (
          <div className="rounded-2xl bg-blue-50/70 p-5 border border-blue-200 text-left space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>{liveMatches.length} Matching Student Report(s) Found!</span>
            </div>
            <p className="text-xs text-blue-750">
              Students have actively reported losing an item matching this description.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/matches">
                <Button variant="glow" size="sm">
                  <span>Open Matches Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              {createdItemId && (
                <Link href={`/items/${createdItemId}?type=found`}>
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
              <Link href={`/items/${createdItemId}?type=found`}>
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
      {/* Form Left Columns */}
      <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
        <Card className="p-6 space-y-6 bg-white border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="found">FOUND ITEM LOG</Badge>
              <span className="text-xs text-slate-500">Step 1 of 1</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              Register a Turned-In or Found Item
            </h2>
            <p className="text-xs text-slate-500">
              Log items found around campus into the central registry to allow owners to reconcile and reclaim their property.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Found Item Title"
              placeholder="e.g. Dark Wireless Earbud Case..."
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
              label="Color / Appearance"
              placeholder="e.g. Dark, Charcoal, Silver..."
              error={errors.color?.message}
              {...register("color")}
            />

            <Input
              label="Brand (if identifiable)"
              placeholder="e.g. Apple, North Face, Dell..."
              error={errors.brand?.message}
              {...register("brand")}
            />
          </div>

          <Textarea
            label="Visual Description & Distinct Markings"
            placeholder="e.g. Found on table, contains charging cable inside, slight scuff mark on top lid..."
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Select
              label="Campus Zone where Found"
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
              label="Specific Location Found"
              placeholder="e.g. Beside the coffee shop, entrance bench..."
              error={errors.location?.message}
              {...register("location")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date Found"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              error={errors.date?.message}
              {...register("date")}
            />

            <Select
              label="Approximate Time Found"
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

          {/* Official Custody Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Official Campus Custody & Holding Location
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Current Storage / Custody Desk
                </label>
                <input
                  list="holding-locations"
                  placeholder="Select or enter holding desk..."
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-2xs"
                  {...register("holdingLocation")}
                />
                <datalist id="holding-locations">
                  {HOLDING_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
                {errors.holdingLocation && (
                  <p className="text-xs text-rose-600 font-medium">
                    {errors.holdingLocation.message}
                  </p>
                )}
              </div>

              <Input
                label="Logged by Staff / Finder Name"
                placeholder="e.g. Front Desk Staff, John Doe"
                error={errors.contactName?.message}
                {...register("contactName")}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="is-anon"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                {...register("isAnonymous")}
              />
              <label htmlFor="is-anon" className="text-xs text-slate-600 font-medium">
                Log finder as anonymous (hide finder identity on public cards)
              </label>
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
              {isSubmitting ? "Registering Item..." : "Register Found Item"}
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
                Live Lost Item Correlations
              </h4>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              As you enter item details, our matching engine detects existing student lost reports that may match this item.
            </p>

            <div className="mt-4 space-y-3">
              {liveMatches.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 bg-white">
                  Enter title & description to evaluate potential matches.
                </div>
              ) : (
                liveMatches.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 space-y-2 animate-in fade-in-50 duration-200 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800">
                        {m.overallScore}% Student Match
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Lost on {formatDate(m.lostItem.date)}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-900 line-clamp-1">
                      {m.lostItem.title}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {m.lostItem.description}
                    </p>
                    {m.lostItem.contactName && (
                      <p className="text-[10px] text-slate-600 font-medium">
                        Reported by: {m.lostItem.contactName}
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
