import * as React from "react";
import * as AvatarPrimitive from "@base-ui/react/avatar";
import { cn } from "../lib/utils";

/* ---------- Avatar ---------- */
/* @base-ui/react Avatar component with fallback support.
 * Uses namespace imports: Avatar.Root, Avatar.Image, Avatar.Fallback.
 * AvatarFallback is required for when the image fails to load.
 */

/* ---------- Avatar ---------- */

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Avatar.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Avatar.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Avatar.Root
    ref={ref}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full",
      "h-10 w-10", // Default size - override with size-* classes
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Avatar.Root.displayName;

/* ---------- AvatarImage ---------- */

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Avatar.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Avatar.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Avatar.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Avatar.Image.displayName;

/* ---------- AvatarFallback ---------- */

interface AvatarFallbackProps {
  className?: string;
  delay?: number;
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Avatar.Fallback>,
  AvatarFallbackProps
>(({ className, delay, ...props }, ref) => (
  <AvatarPrimitive.Avatar.Fallback
    ref={ref}
    delay={delay}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Avatar.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
