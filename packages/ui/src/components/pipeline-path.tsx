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
    <div className={cn("flex flex-wrap items-center gap-1.5 max-sm:gap-1", className)}>
      {stages.map((stage, i) => (
        <React.Fragment key={stage.name}>
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-xl border transition-colors duration-150",
              stage.active
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted text-muted-foreground border-border",
            )}
          >
            {stage.name}
          </span>
          {i < stages.length - 1 && (
            <span className="text-muted-foreground/50 text-xs">→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export { PipelinePath };
export type { PipelineStage, PipelinePathProps };
