import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center text-[10px] font-medium uppercase tracking-[0.1em] px-2.5 py-1 rounded-md",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground-secondary",
        user: "bg-user text-user-foreground",
        assistant: "bg-assistant text-assistant-foreground",
        system: "bg-system text-system-foreground",
        outline: "border border-border text-foreground-secondary bg-transparent hover:bg-muted",
        destructive: "bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
