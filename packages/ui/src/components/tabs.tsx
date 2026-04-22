import * as React from "react";
import * as TabsPrimitive from "@base-ui/react/tabs";
import { cn } from "../lib/utils";

/* ---------- Tabs ---------- */
/* @base-ui/react Tabs component for tabbed content.
 * Uses namespace imports: Tabs.Root, Tabs.Tab, Tabs.List, Tabs.Panel, Tabs.Indicator.
 */

/* ---------- Tabs ---------- */

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Tabs = ({ defaultValue, value, onValueChange, children }: TabsProps) => {
  return (
    <TabsPrimitive.Tabs.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
    >
      {children}
    </TabsPrimitive.Tabs.Root>
  );
};

/* ---------- TabsList ---------- */

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Tabs.List
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
);
TabsList.displayName = "TabsList";

/* ---------- TabsTrigger ---------- */

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => (
    <TabsPrimitive.Tabs.Tab
      ref={ref}
      value={value}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background",
        "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-sm",
        className,
      )}
      {...props}
    />
  ),
);
TabsTrigger.displayName = "TabsTrigger";

/* ---------- TabsPanel ---------- */

interface TabsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsPanel = React.forwardRef<HTMLDivElement, TabsPanelProps>(
  ({ className, value, ...props }, ref) => (
    <TabsPrimitive.Tabs.Panel
      ref={ref}
      value={value}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  ),
);
TabsPanel.displayName = "TabsPanel";

export { Tabs, TabsList, TabsTrigger, TabsPanel };
