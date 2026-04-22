import * as React from "react";
import * as SelectPrimitive from "@base-ui/react/select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../lib/utils";

/* ---------- Select ---------- */
/* @base-ui/react Select component for dropdowns.
 * Uses namespace imports: Select.Root, Select.Trigger, Select.Portal, Select.Positioner, Select.Popup, Select.Item.
 */

/* ---------- Select ---------- */

interface SelectProps {
  name?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string | null) => void;
  children: React.ReactNode;
}

const Select = ({ name, required, defaultValue, value, onValueChange, children }: SelectProps) => {
  return (
    <SelectPrimitive.Select.Root
      name={name}
      required={required}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
    >
      {children}
    </SelectPrimitive.Select.Root>
  );
};

/* ---------- SelectLabel ---------- */

interface SelectLabelProps extends React.HTMLAttributes<HTMLLabelElement> {}

const SelectLabel = React.forwardRef<HTMLLabelElement, SelectLabelProps>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium text-foreground", className)} {...props} />
  ),
);
SelectLabel.displayName = "SelectLabel";

/* ---------- SelectTrigger ---------- */

interface SelectTriggerProps {
  render?: React.ReactElement;
  children?: React.ReactNode;
}

const SelectTrigger = ({ render, children }: SelectTriggerProps) => {
  return (
    <SelectPrimitive.Select.Trigger render={render}>{children}</SelectPrimitive.Select.Trigger>
  );
};

/* ---------- SelectPortal ---------- */

interface SelectPortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

const SelectPortal = ({ children, container }: SelectPortalProps) => {
  return (
    <SelectPrimitive.Select.Portal container={container}>{children}</SelectPrimitive.Select.Portal>
  );
};

/* ---------- SelectPositioner ---------- */

interface SelectPositionerProps {
  children: React.ReactNode;
}

const SelectPositioner = ({ children }: SelectPositionerProps) => {
  return <SelectPrimitive.Select.Positioner>{children}</SelectPrimitive.Select.Positioner>;
};

/* ---------- SelectPopup ---------- */

interface SelectPopupProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectPopup = React.forwardRef<HTMLDivElement, SelectPopupProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Select.Popup
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md bg-popover border border-border shadow-md",
        "data-[closed]:opacity-0 data-[open]:opacity-100 transition-all duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Select.Popup>
  ),
);
SelectPopup.displayName = "SelectPopup";

/* ---------- SelectGroup ---------- */

interface SelectGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectGroup = React.forwardRef<HTMLDivElement, SelectGroupProps>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-1", className)} {...props} />,
);
SelectGroup.displayName = "SelectGroup";

/* ---------- SelectItem ---------- */

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled, ...props }, ref) => (
    <SelectPrimitive.Select.Item
      ref={ref}
      value={value}
      disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "data-[selected]:bg-muted data-[selected]:text-foreground",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.Select.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.Select.ItemIndicator>
      </span>
      {children}
    </SelectPrimitive.Select.Item>
  ),
);
SelectItem.displayName = "SelectItem";

/* Default trigger styling helper - use with render prop */

export function SelectTriggerDefault({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="ml-2 opacity-50" />
    </div>
  );
}

export {
  Select,
  SelectLabel,
  SelectTrigger,
  SelectPortal,
  SelectPositioner,
  SelectPopup,
  SelectGroup,
  SelectItem,
};
