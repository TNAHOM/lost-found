"use client";

import { useItems } from "@/lib/items-context";
import { Search, Sparkles, CheckCircle2, Inbox } from "lucide-react";

export function StatsOverview() {
  const { lostItems, foundItems, matches } = useItems();

  const activeMatches = matches.filter((m) => !m.isSuperseded && m.status !== "rejected");
  const strongMatches = activeMatches.filter((m) => m.overallScore >= 80 && m.status !== "claimed").length;
  const claimedCount = matches.filter((m) => m.status === "claimed").length;

  const stats = [
    {
      title: "Lost Reports",
      value: lostItems.length,
      description: "Active student inquiries",
      icon: Search,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
    },
    {
      title: "Found Items",
      value: foundItems.length,
      description: "Items logged in custody",
      icon: Inbox,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Potential Matches",
      value: activeMatches.filter((m) => m.status !== "claimed").length,
      badge: strongMatches > 0 ? `${strongMatches} Strong` : undefined,
      description: "Automated pairings found",
      icon: Sparkles,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
    },
    {
      title: "Reconciled / Claimed",
      value: claimedCount,
      description: "Verified returns to owners",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:shadow-md hover:border-slate-300"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgColor} ${stat.color} border ${stat.borderColor}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              {stat.badge && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  {stat.badge}
                </span>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-2xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </h4>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {stat.title}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {stat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
