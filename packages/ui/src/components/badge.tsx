import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-[10px]",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        user: "bg-primary text-primary-foreground",
        assistant: "bg-success text-success-foreground",
        system: "bg-muted-foreground/20 text-muted-foreground",
        outline: "border border-border text-muted-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
