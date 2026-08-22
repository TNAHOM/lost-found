"use client";

import Link from "next/link";
import { useItems } from "@/lib/items-context";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { MatchRadar } from "@/components/dashboard/match-radar";
import { ItemGrid } from "@/components/items/item-grid";
import { Button } from "@/components/ui/button";
import { PlusCircle, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { lostItems, foundItems, matches } = useItems();

  return (
    <div className="space-y-10">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-300 border border-blue-400/30 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Semantic Reconciliation Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Lost something on campus? <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              We&apos;ll automatically connect the dots.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Eliminating manual lost & found logs. Our multi-factor engine compares semantic descriptions, campus location proximity, and timeline sequence to find your items instantly.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Link href="/report/lost">
              <Button
                variant="glow"
                size="lg"
                className="gap-2 shadow-lg shadow-blue-500/30"
              >
                <PlusCircle className="h-5 w-5" />
                <span>I Lost an Item</span>
              </Button>
            </Link>

            <Link href="/report/found">
              <Button
                variant="secondary"
                size="lg"
                className="gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
              >
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>I Found an Item</span>
              </Button>
            </Link>

            <Link href="/matches">
              <Button
                variant="ghost"
                size="lg"
                className="gap-2 text-slate-300 hover:text-white hover:bg-white/10"
              >
                <span>View Match Studio ({matches.length})</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 -bottom-12 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
      </section>

      {/* KPI */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            System Metrics & Reconciliation Overview
          </h2>
        </div>
        <StatsOverview />
      </section>

      {/* AI Match */}
      <section className="space-y-4">
        <MatchRadar />
      </section>

      {/* Reports Explorer & Filter Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Campus Reports Feed
            </h3>
            <p className="text-xs text-slate-500">
              Browse, search, and filter all registered lost and found items across university buildings.
            </p>
          </div>
        </div>

        <ItemGrid lostItems={lostItems} foundItems={foundItems} />
      </section>
    </div>
  );
}
