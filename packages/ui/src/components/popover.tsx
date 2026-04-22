import * as React from "react";
import * as PopoverPrimitive from "@base-ui/react/popover";
import { cn } from "../lib/utils";

/* ---------- Popover ---------- */
/* @base-ui/react Popover component for dropdowns and popups.
 * Uses namespace imports: Popover.Root, Popover.Trigger, Popover.Portal, Popover.Positioner, Popover.Popup.
 */

/* ---------- Popover ---------- */

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Popover = ({ open, onOpenChange, children }: PopoverProps) => {
  return (
    <PopoverPrimitive.Popover.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </PopoverPrimitive.Popover.Root>
  );
};

/* ---------- PopoverTrigger ---------- */

interface PopoverTriggerProps {
  render?: React.ReactElement;
  children?: React.ReactNode;
}

const PopoverTrigger = ({ render, children }: PopoverTriggerProps) => {
  return (
    <PopoverPrimitive.Popover.Trigger render={render}>{children}</PopoverPrimitive.Popover.Trigger>
  );
};

/* ---------- PopoverPortal ---------- */

interface PopoverPortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

const PopoverPortal = ({ children, container }: PopoverPortalProps) => {
  return (
    <PopoverPrimitive.Popover.Portal container={container}>
      {children}
    </PopoverPrimitive.Popover.Portal>
  );
};

/* ---------- PopoverPositioner ---------- */

interface PopoverPositionerProps {
  children: React.ReactNode;
}

const PopoverPositioner = ({ children }: PopoverPositionerProps) => {
  return <PopoverPrimitive.Popover.Positioner>{children}</PopoverPrimitive.Popover.Positioner>;
};

/* ---------- PopoverPopup ---------- */

interface PopoverPopupProps extends React.HTMLAttributes<HTMLDivElement> {}

const PopoverPopup = React.forwardRef<HTMLDivElement, PopoverPopupProps>(
  ({ className, ...props }, ref) => (
    <PopoverPrimitive.Popover.Popup
      ref={ref}
      className={cn(
        "z-50 w-72 rounded-md bg-popover border border-border p-4 text-popover-foreground shadow-md",
        "data-[closed]:opacity-0 data-[open]:opacity-100 transition-all duration-200",
        className,
      )}
      {...props}
    />
  ),
);
PopoverPopup.displayName = "PopoverPopup";

/* ---------- PopoverClose ---------- */

interface PopoverCloseProps {
  render?: React.ReactElement;
  children?: React.ReactNode;
}

const PopoverClose = ({ render, children }: PopoverCloseProps) => {
  return (
    <PopoverPrimitive.Popover.Close render={render}>{children}</PopoverPrimitive.Popover.Close>
  );
};

export { Popover, PopoverTrigger, PopoverPortal, PopoverPositioner, PopoverPopup, PopoverClose };
