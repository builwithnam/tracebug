import * as React from "react";
import { cn } from "../lib/utils";

/* ---------- ScrollArea ---------- */
/* Custom scrollable area with styled scrollbars.
 * @base-ui/react v1.4.1 does not include ScrollArea.
 * This component provides consistent scrolling behavior with custom scrollbar styling.
 */

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("relative overflow-auto", className)} {...props}>
      <div className="h-full w-full">{children}</div>
    </div>
  ),
);
ScrollArea.displayName = "ScrollArea";

/* ---------- ScrollBar ---------- */

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ className, orientation = "vertical", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
        "hover:bg-muted/50 active:bg-muted/80",
        className,
      )}
      {...props}
    >
      <div className="relative flex-1 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 active:bg-muted-foreground/40" />
    </div>
  ),
);
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
