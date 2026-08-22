import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 - 100
  colorClass?: string;
  indicatorClassName?: string;
}

export function Progress({
  value,
  className,
  colorClass = "bg-blue-600",
  indicatorClassName,
  ...props
}: ProgressProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50",
        className
      )}
      {...props}
    >
      <div
        className={cn("h-full transition-all duration-500 ease-out rounded-full", colorClass, indicatorClassName)}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
