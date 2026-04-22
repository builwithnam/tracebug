import * as React from "react";
import * as TooltipPrimitive from "@base-ui/react/tooltip";
import { cn } from "../lib/utils";

/* ---------- Tooltip ---------- */
/* @base-ui/react Tooltip component for hover information.
 * Uses namespace imports: Tooltip.Root, Tooltip.Trigger, Tooltip.Portal, Tooltip.Positioner, Tooltip.Popup.
 */

/* ---------- Tooltip ---------- */

interface TooltipProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Tooltip = ({ open, onOpenChange, children }: TooltipProps) => {
  return (
    <TooltipPrimitive.Tooltip.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </TooltipPrimitive.Tooltip.Root>
  );
};

/* ---------- TooltipTrigger ---------- */

interface TooltipTriggerProps {
  render?: React.ReactElement;
  children?: React.ReactNode;
}

const TooltipTrigger = ({ render, children }: TooltipTriggerProps) => {
  return (
    <TooltipPrimitive.Tooltip.Trigger render={render}>{children}</TooltipPrimitive.Tooltip.Trigger>
  );
};

/* ---------- TooltipPositioner ---------- */

interface TooltipPositionerProps {
  children: React.ReactNode;
}

const TooltipPositioner = ({ children }: TooltipPositionerProps) => {
  return <TooltipPrimitive.Tooltip.Positioner>{children}</TooltipPrimitive.Tooltip.Positioner>;
};

/* ---------- TooltipPopup ---------- */

interface TooltipPopupProps extends React.HTMLAttributes<HTMLDivElement> {}

const TooltipPopup = React.forwardRef<HTMLDivElement, TooltipPopupProps>(
  ({ className, ...props }, ref) => (
    <TooltipPrimitive.Tooltip.Popup
      ref={ref}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-foreground text-background px-3 py-1.5 text-sm shadow-md",
        "data-[closed]:opacity-0 data-[open]:opacity-100 transition-opacity duration-200",
        "max-w-xs",
        className,
      )}
      {...props}
    />
  ),
);
TooltipPopup.displayName = "TooltipPopup";

export { Tooltip, TooltipTrigger, TooltipPositioner, TooltipPopup };
