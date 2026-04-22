import * as React from "react";
import { cn } from "../lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg";
}

const sizeMap = {
  sm: "size-4",
  default: "size-6",
  lg: "size-8",
};

function Spinner({ size = "default", className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("relative", sizeMap[size], className)}
      {...props}
    >
      {/* Main spinner circle - warm terracotta */}
      <svg
        className="animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Track */}
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="text-muted opacity-25" />
        {/* Progress */}
        <path
          d="M12 2C6.48 2 2 6.48 2 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-primary"
        />
      </svg>
    </div>
  );
}

/* ---------- Size Support ---------- */
/* Use size-* when width and height are equal (size-4 not w-4 h-4) */

export { Spinner };
