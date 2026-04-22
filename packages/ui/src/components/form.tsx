import * as React from "react";
import * as CheckboxPrimitive from "@base-ui/react/checkbox";
import * as RadioPrimitive from "@base-ui/react/radio";
import * as RadioGroupPrimitive from "@base-ui/react/radio-group";
import * as SwitchPrimitive from "@base-ui/react/switch";
import * as FieldPrimitive from "@base-ui/react/field";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";

/* ---------- Form Components ---------- */
/* @base-ui/react Form components for checkboxes, radios, switches, and field labels.
 * Uses namespace imports for each component.
 */

/* ---------- Field ---------- */

const Field = FieldPrimitive.Field.Root;

/* ---------- FieldLabel ---------- */

interface FieldLabelProps extends React.HTMLAttributes<HTMLLabelElement> {}

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ className, ...props }, ref) => (
    <FieldPrimitive.Field.Label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  ),
);
FieldLabel.displayName = "FieldLabel";

/* ---------- FieldDescription ---------- */

interface FieldDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FieldDescription = React.forwardRef<HTMLParagraphElement, FieldDescriptionProps>(
  ({ className, ...props }, ref) => (
    <FieldPrimitive.Field.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  ),
);
FieldDescription.displayName = "FieldDescription";

/* ---------- FieldError ---------- */

interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, ...props }, ref) => (
    <FieldPrimitive.Field.Description
      ref={ref}
      className={cn("text-sm text-destructive", className)}
      {...props}
    />
  ),
);
FieldError.displayName = "FieldError";

/* ---------- Checkbox ---------- */

interface CheckboxProps {
  required?: boolean;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { required, value, checked, defaultChecked, onCheckedChange, disabled, className, ...props },
    ref,
  ) => (
    <CheckboxPrimitive.Checkbox.Root
      ref={ref}
      required={required}
      value={value}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[checked]:bg-primary data-[checked]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Checkbox.Indicator className="flex items-center justify-center text-current">
        <Check className="h-3.5 w-3.5" />
      </CheckboxPrimitive.Checkbox.Indicator>
    </CheckboxPrimitive.Checkbox.Root>
  ),
);
Checkbox.displayName = "Checkbox";

/* ---------- Radio ---------- */

interface RadioProps {
  value: string;
  disabled?: boolean;
  className?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ value, disabled, className, ...props }, ref) => (
    <RadioPrimitive.Radio.Root
      ref={ref}
      value={value}
      disabled={disabled}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[checked]:bg-primary data-[checked]:text-primary-foreground",
        "relative",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Radio.Indicator className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
      </RadioPrimitive.Radio.Indicator>
    </RadioPrimitive.Radio.Root>
  ),
);
Radio.displayName = "Radio";

/* ---------- RadioGroup ---------- */

interface RadioGroupProps {
  name?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const RadioGroup = ({
  name,
  defaultValue,
  value,
  onValueChange,
  required,
  disabled,
  children,
  className,
  ...props
}: RadioGroupProps) => {
  return (
    <RadioGroupPrimitive.RadioGroup
      name={name}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      required={required}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </RadioGroupPrimitive.RadioGroup>
  );
};

/* ---------- Switch ---------- */

interface SwitchProps {
  required?: boolean;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    { required, value, checked, defaultChecked, onCheckedChange, disabled, className, ...props },
    ref,
  ) => (
    <SwitchPrimitive.Switch.Root
      ref={ref}
      required={required}
      value={value}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[checked]:bg-primary data-[checked]:border-primary",
        "data-[unchecked]:bg-input data-[unchecked]:border-input",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Switch.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          "data-[checked]:translate-x-5 data-[unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Switch.Root>
  ),
);
Switch.displayName = "Switch";

export { Field, FieldLabel, FieldDescription, FieldError, Checkbox, Radio, RadioGroup, Switch };
