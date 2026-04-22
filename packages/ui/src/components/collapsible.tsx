import * as React from "react";
import { cn } from "../lib/utils";

/* ---------- Custom Collapsible Component ---------- */
/* Custom implementation since @base-ui/react v1.4.1 does not include Collapsible.
 * This provides simple expand/collapse functionality.
 * When @base-ui/react adds Collapsible, consider migrating to it.
 */

/* ---------- Collapsible ---------- */

interface CollapsibleContextValue {
  open: boolean;
  toggle: () => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

function useCollapsible() {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx) throw new Error("Collapsible compound components must be used inside <Collapsible>");
  return ctx;
}

interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

function Collapsible({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  className,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;

  const toggle = React.useCallback(() => {
    const next = !open;
    setInternalOpen(next);
    onOpenChange?.(next);
  }, [open, onOpenChange]);

  return (
    <CollapsibleContext value={{ open, toggle }}>
      <div className={className}>{children}</div>
    </CollapsibleContext>
  );
}

/* ---------- CollapsibleTrigger ---------- */

interface CollapsibleTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ onClick, ...props }, ref) => {
    const { toggle } = useCollapsible();
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          toggle();
          onClick?.(e);
        }}
        {...props}
      />
    );
  },
);
CollapsibleTrigger.displayName = "CollapsibleTrigger";

/* ---------- CollapsibleContent ---------- */

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, ...props }, ref) => {
    const { open } = useCollapsible();
    if (!open) return null;
    return <div ref={ref} className={className} {...props} />;
  },
);
CollapsibleContent.displayName = "CollapsibleContent";

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  useCollapsible as useCollapsibleContext,
};
