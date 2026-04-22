import * as React from "react";
import * as AccordionPrimitive from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

/* ---------- Accordion ---------- */
/* @base-ui/react Accordion component for collapsible sections.
 * Uses namespace imports: Accordion.Root, Accordion.Item, Accordion.Header, Accordion.Trigger, Accordion.Panel.
 */

/* ---------- Accordion ---------- */

interface AccordionProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string | null) => void;
  children: React.ReactNode;
}

const Accordion = ({ defaultValue, value, onValueChange, children }: AccordionProps) => {
  return (
    <AccordionPrimitive.Accordion.Root
      defaultValue={defaultValue ? [defaultValue] : undefined}
      value={value ? [value] : undefined}
      onValueChange={(values) => {
        const newValue = values && values.length > 0 ? values[0] : null;
        onValueChange?.(newValue);
      }}
    >
      {children}
    </AccordionPrimitive.Accordion.Root>
  );
};

/* ---------- AccordionItem ---------- */

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, ...props }, ref) => (
    <AccordionPrimitive.Accordion.Item
      ref={ref}
      value={value}
      className={cn("border-b border-border", className)}
      {...props}
    />
  ),
);
AccordionItem.displayName = "AccordionItem";

/* ---------- AccordionHeader ---------- */

interface AccordionHeaderProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const AccordionHeader = React.forwardRef<HTMLHeadingElement, AccordionHeaderProps>(
  ({ className, ...props }, ref) => (
    <AccordionPrimitive.Accordion.Header ref={ref} className={cn("flex", className)} {...props} />
  ),
);
AccordionHeader.displayName = "AccordionHeader";

/* ---------- AccordionTrigger ---------- */

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, value, children, ...props }, ref) => (
    <AccordionPrimitive.Accordion.Trigger
      ref={ref}
      value={value}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all",
        "hover:underline",
        "[&[data-expanded]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Accordion.Trigger>
  ),
);
AccordionTrigger.displayName = "AccordionTrigger";

/* ---------- AccordionPanel ---------- */

interface AccordionPanelProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionPanel = React.forwardRef<HTMLDivElement, AccordionPanelProps>(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Accordion.Panel
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all data-[collapsed]:animate-accordion-up data-[expanded]:animate-accordion-down",
        className,
      )}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </AccordionPrimitive.Accordion.Panel>
  ),
);
AccordionPanel.displayName = "AccordionPanel";

export { Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionPanel };
