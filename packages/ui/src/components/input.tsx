import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground",
          "transition-all duration-200",
          "placeholder:text-foreground-tertiary",
          "focus-visible:outline-none focus-visible:border-focus focus-visible:shadow-[0px_0px_0px_1px_var(--color-focus)]",
          "hover:border-border-strong",
          "disabled:pointer-events-none disabled:opacity-50 disabled:border-border",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
