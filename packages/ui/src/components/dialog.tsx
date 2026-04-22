import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui/react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

/* ---------- Dialog ---------- */
/* @base-ui/react Dialog component with render prop support.
 * Use render prop (not asChild) for custom triggers.
 * Example: <DialogTrigger render={<Button>Open</Button>} />
 */

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </BaseDialog.Root>
  );
};

/* ---------- DialogTrigger ---------- */

interface DialogTriggerProps {
  render?: React.ReactElement;
  children?: React.ReactNode;
}

const DialogTrigger = ({ render, children }: DialogTriggerProps) => {
  return <BaseDialog.Trigger render={render}>{children}</BaseDialog.Trigger>;
};

/* ---------- DialogPortal ---------- */

interface DialogPortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

const DialogPortal = ({ children, container }: DialogPortalProps) => {
  return <BaseDialog.Portal container={container}>{children}</BaseDialog.Portal>;
};

/* ---------- DialogBackdrop ---------- */

interface DialogBackdropProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogBackdrop = React.forwardRef<HTMLDivElement, DialogBackdropProps>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Backdrop
      ref={ref}
      className={cn(
        "fixed inset-0 bg-black/50 data-[closed]:opacity-0 data-[open]:opacity-100 transition-opacity duration-200",
        className,
      )}
      {...props}
    />
  ),
);
DialogBackdrop.displayName = "DialogBackdrop";

/* ---------- DialogContent ---------- */

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => (
    <BaseDialog.Popup
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-6 data-[closed]:opacity-0 data-[open]:opacity-100 transition-all duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </BaseDialog.Popup>
  ),
);
DialogContent.displayName = "DialogContent";

/* ---------- DialogHeader ---------- */

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-between mb-4", className)} {...props} />
  ),
);
DialogHeader.displayName = "DialogHeader";

/* ---------- DialogTitle ---------- */

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Title
      ref={ref}
      className={cn("font-serif text-lg text-foreground", className)}
      {...props}
    />
  ),
);
DialogTitle.displayName = "DialogTitle";

/* ---------- DialogDescription ---------- */

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground mb-4", className)}
      {...props}
    />
  ),
);
DialogDescription.displayName = "DialogDescription";

/* ---------- DialogFooter ---------- */

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-end gap-3 mt-6", className)}
      {...props}
    />
  ),
);
DialogFooter.displayName = "DialogFooter";

/* ---------- DialogClose ---------- */

interface DialogCloseProps {
  render?: React.ReactElement;
  children?: React.ReactNode;
}

const DialogClose = ({ render, children }: DialogCloseProps) => {
  return <BaseDialog.Close render={render}>{children}</BaseDialog.Close>;
};

/* ---------- DialogCloseButton ---------- */

const DialogCloseButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <BaseDialog.Close
    render={
      <button
        ref={ref}
        className={cn(
          "rounded-md p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
          className,
        )}
        {...props}
      >
        <X className="size-4" />
      </button>
    }
  />
));
DialogCloseButton.displayName = "DialogCloseButton";

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogCloseButton,
};
