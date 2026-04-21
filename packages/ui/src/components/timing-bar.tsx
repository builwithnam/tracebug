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
    <div className={cn("flex flex-col gap-2", className)}>
      {entries.map((entry, i) => {
        const pct = total > 0 ? (entry.value / total) * 100 : 0;
        return (
          <div
            key={entry.label}
            className={cn("flex items-center gap-3", "animate-fade-in-up")}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="w-[100px] shrink-0 text-right text-xs text-foreground-secondary truncate max-sm:w-[70px]">
              {entry.label}
            </div>
            <div className="flex-1 h-2.5 bg-muted rounded-md overflow-hidden">
              <div
                className={cn(
                  "h-full bg-primary rounded-md min-w-0.5 transition-all duration-300 ease-out",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-[55px] shrink-0 text-xs text-foreground text-right font-mono">
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
