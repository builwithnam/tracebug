import * as React from "react";
import { cn } from "../lib/utils";

/* ---------- Card ---------- */

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-card shadow-[rgba(0,0,0,0.03)_0px_4px_24px]",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/* ---------- CardHeader ---------- */

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-3 p-6 pb-3", className)} {...props} />
  ),
);
Card.displayName = "CardHeader";

/* ---------- CardTitle ---------- */

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-serif font-normal text-lg text-foreground leading-tight", className)}
      {...props}
    />
  ),
);
Card.displayName = "CardTitle";

/* ---------- CardDescription ---------- */

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-foreground-secondary leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/* ---------- CardContent ---------- */

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-2", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
