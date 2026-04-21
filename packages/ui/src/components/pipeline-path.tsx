import * as React from "react";
import { cn } from "../lib/utils";

interface PipelineStage {
  name: string;
  active: boolean;
}

interface PipelinePathProps {
  stages: PipelineStage[];
  className?: string;
}

function PipelinePath({ stages, className }: PipelinePathProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 max-sm:gap-1.5", className)}>
      {stages.map((stage, i) => (
        <React.Fragment key={stage.name}>
          <span
            className={cn(
              "inline-flex items-center text-xs font-medium px-5 py-2 rounded-md transition-all duration-200 leading-none",
              stage.active
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-muted text-foreground-secondary",
            )}
          >
            {stage.name}
          </span>
          {i < stages.length - 1 && (
            <span
              className={cn(
                "text-sm transition-colors duration-200",
                stage.active ? "text-primary" : "text-foreground-tertiary",
              )}
            >
              →
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export { PipelinePath };
export type { PipelineStage, PipelinePathProps };
