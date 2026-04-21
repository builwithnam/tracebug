import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 font-medium",
  {
    variants: {
      variant: {
        // Brand Terracotta - primary CTA
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:translate-y-px shadow-[0px_0px_0px_0px_var(--color-primary),_0px_0px_0px_1px_var(--color-primary)]",

        // Warm Sand - secondary, warm unassuming
        secondary: "bg-muted text-secondary-foreground hover:bg-muted-hover shadow-[0px_0px_0px_0px_var(--color-muted),_0px_0px_0px_1px_var(--color-ring)]",

        // White Surface - clean, elevated
        outline:
          "bg-card text-foreground border border-border hover:bg-card-hover active:bg-muted",

        // Dark Charcoal - inverted for light surfaces
        dark:
          "bg-dark-surface text-dark-foreground hover:opacity-90 active:translate-y-px shadow-[0px_0px_0px_0px_var(--color-dark-surface),_0px_0px_0px_1px_var(--color-border-dark)]",

        // Ghost - subtle interactive
        ghost: "hover:bg-muted-hover hover:text-foreground active:bg-muted",

        // Destructive - warm red
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive-dim",

        // Link style
        link: "text-primary hover:text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 text-sm rounded-md",
        sm: "h-8 px-4 text-xs rounded-md",
        lg: "h-12 px-6 text-base rounded-lg",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
