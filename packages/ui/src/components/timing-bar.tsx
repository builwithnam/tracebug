import * as React from "react";
import { cn } from "../lib/utils";

interface TimingBarEntry {
  label: string;
  value: number; // ms
}

interface TimingBarProps {
  entries: TimingBarEntry[];
  className?: string;
}

function TimingBar({ entries, className }: TimingBarProps) {
  const total = entries.reduce((sum, e) => sum + e.value, 0);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {entries.map((entry) => {
        const pct = total > 0 ? (entry.value / total) * 100 : 0;
        return (
          <div key={entry.label} className="flex items-center gap-2">
            <div className="w-[120px] shrink-0 text-right text-xs text-muted-foreground truncate max-sm:w-[80px]">
              {entry.label}
            </div>
            <div className="flex-1 h-2 bg-muted rounded-sm overflow-hidden">
              <div
                className="h-full bg-primary rounded-sm min-w-0.5 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-[60px] shrink-0 text-xs text-muted-foreground">
              {Math.round(entry.value)}ms
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { TimingBar };
export type { TimingBarEntry, TimingBarProps };
