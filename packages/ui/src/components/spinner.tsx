import * as React from "react";
import { cn } from "../lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg";
}

const sizeMap = {
  sm: "size-4 border-2",
  default: "size-6 border-3",
  lg: "size-8 border-4",
};

function Spinner({ size = "default", className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin rounded-full border-border border-t-primary",
        sizeMap[size],
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };
