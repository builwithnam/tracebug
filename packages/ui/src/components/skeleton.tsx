import * as React from "react";
import { cn } from "../lib/utils";

/* ---------- Skeleton ---------- */
/* Loading placeholder for content. Use instead of custom animate-pulse divs.
 * Provides consistent loading states across the application.
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
));
Skeleton.displayName = "Skeleton";

export { Skeleton };
