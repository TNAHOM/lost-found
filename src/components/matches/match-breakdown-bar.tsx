import { MatchScoreBreakdown } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { FileText, MapPin, Clock } from "lucide-react";

export function MatchBreakdownBar({
  breakdown,
  compact = false,
}: {
  breakdown: MatchScoreBreakdown;
  compact?: boolean;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-600";
    if (score >= 60) return "bg-amber-500";
    return "bg-slate-400";
  };

  const metrics = [
    {
      label: "Description Similarity",
      weight: "50% weight",
      score: breakdown.descriptionSimilarity,
      icon: FileText,
    },
    {
      label: "Location Proximity",
      weight: "25% weight",
      score: breakdown.locationProximity,
      icon: MapPin,
    },
    {
      label: "Temporal Validity",
      weight: "25% weight",
      score: breakdown.temporalScore,
      icon: Clock,
      alert: !breakdown.isTimeValid ? "Time Conflict" : undefined,
    },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-lg bg-slate-50 p-2 border border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
              <span className="truncate font-medium">{m.label.split(" ")[0]}</span>
              <span className="font-bold text-slate-900">
                {m.score}%
              </span>
            </div>
            <Progress
              value={m.score}
              colorClass={getScoreColor(m.score)}
              className="h-1.5"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl bg-slate-50/90 p-4 border border-slate-200">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Multi-Factor Scoring Matrix
        </span>
        <span className="text-xs text-slate-500 font-mono">
          (0.50×Desc) + (0.25×Loc) + (0.25×Time)
        </span>
      </div>

      <div className="space-y-2.5">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                  <span>{m.label}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({m.weight})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {m.alert && (
                    <span className="text-[10px] font-bold text-rose-700 uppercase bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                      {m.alert}
                    </span>
                  )}
                  <span className="font-bold text-slate-900 font-mono">
                    {m.score}%
                  </span>
                </div>
              </div>
              <Progress
                value={m.score}
                colorClass={getScoreColor(m.score)}
                className="h-2"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
