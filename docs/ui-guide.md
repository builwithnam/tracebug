# Tracebug UI Guide

This project uses **@base-ui/react** (v1.4.1) as the headless component foundation with **shadcn/ui** patterns for component architecture and styling.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **@base-ui/react** (v1.4.1) | Headless component primitives |
| **Tailwind CSS v4** | Styling (via `@tailwindcss/vite`) |
| **lucide-react** | Icon library |
| **clsx**, **tailwind-merge**, **class-variance-authority** | Utility libraries |

## Component Structure (Tổng quan Kiến trúc: Shared UI Module)

```
packages/ui/
├── src/
│   ├── components/      # UI Components (Atomic components) - "heart" of the module
│   │   ├── button.tsx          # CVA variants
│   │   ├── card.tsx            # Compound components
│   │   ├── badge.tsx            # CVA variants
│   │   ├── input.tsx            # Styled input
│   │   ├── spinner.tsx           # Loading indicator
│   │   ├── separator.tsx         # Visual separator
│   │   ├── skeleton.tsx          # Loading placeholder
│   │   ├── alert.tsx             # Callout with variants
│   │   ├── avatar.tsx            # @base-ui Avatar
│   │   ├── tooltip.tsx           # @base-ui Tooltip
│   │   ├── popover.tsx           # @base-ui Popover
│   │   ├── select.tsx            # @base-ui Select
│   │   ├── tabs.tsx             # @base-ui Tabs
│   │   ├── accordion.tsx         # @base-ui Accordion
│   │   ├── form.tsx              # @base-ui Checkbox, Radio, Switch, Field
│   │   ├── scroll-area.tsx       # Custom scroll area
│   │   ├── dialog.tsx            # @base-ui Dialog
│   │   ├── collapsible.tsx       # Custom (not in @base-ui v1.4.1)
│   │   ├── json-tree.tsx          # Domain-specific
│   │   ├── timing-bar.tsx        # Domain-specific
│   │   └── pipeline-path.tsx     # Domain-specific
│   ├── lib/             # Utility functions, third-party library configs
│   │   └── utils.ts      # cn() utility, clsx/tailwind-merge config
│   ├── styles/          # Global CSS config, theme, Tailwind config
│   │   └── index.css     # Design tokens, base styles, Tailwind v4
│   ├── index.ts         # Public API exports
│   └── README.md        # Package documentation
```

## @base-ui/react vs Radix UI

We use **@base-ui/react** instead of Radix UI:

| Feature | @base-ui/react | Radix UI |
|---------|----------------|-----------|
| **Composition** | `render` prop | `asChild` prop |
| **API** | Namespace imports (`Tabs.Root`) | Named imports (`Tabs`) |
| **Package** | Single (`@base-ui/react`) | Multiple (`@radix-ui/*`) |
| **Stability** | v1.0 stable (Dec 2025) | Mature but slower updates |
| **Coverage** | More components (accordion, form primitives) | Good coverage |

### Render Prop Pattern (not asChild)

```tsx
// ❌ Radix UI - asChild pattern
import * as Dialog from '@radix-ui/react-dialog';
<Dialog.Trigger asChild>
  <Button>Open</Button>
</Dialog.Trigger>

// ✅ @base-ui/react - render prop pattern
import { Dialog } from '@base-ui/react';
<Dialog.Trigger render={<Button>Open</Button>} />
```

### Namespace Imports

```tsx
// @base-ui/react uses namespace imports
import * as Tabs from '@base-ui/react/tabs';

<Tabs.Root defaultValue="tab-1">
  <Tabs.List>
    <Tabs.Tab value="tab-1">Tab 1</Tabs.Tab>
    <Tabs.Tab value="tab-2">Tab 2</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="tab-1">Content 1</Tabs.Panel>
</Tabs.Root>
```

### Data Attributes for State Styling

| Component | Data Attributes |
|------------|-----------------|
| **Dialog** | `data-open`, `data-closed`, `data-nested-dialog-open` |
| **Select** | `data-open`, `data-closed` |
| **Popover** | `data-open`, `data-closed` |
| **Form/Field** | `data-valid`, `data-invalid` |
| **Checkbox/Radio/Switch** | `data-checked`, `data-unchecked` |
| **Accordion** | `data-expanded`, `data-collapsed` |

## Design System

Tracebug uses a custom "Technical Manuscript" design inspired by Claude:

- **Warm parchment tones** (not typical grays)
- **Editorial serif headings** (Georgia/Playfair style)
- **Soft, approachable feel** (rounded corners, gentle shadows)
- **Semantic color tokens** (bg-primary, text-muted-foreground)

Design tokens are defined in `packages/ui/src/styles/index.css` using `@theme { }`:

```css
@theme {
  /* Surface & Background */
  --color-background: oklch(0.96 0.01 85); /* Parchment */
  --color-card: oklch(0.98 0.008 85);        /* Ivory */
  --color-muted: oklch(0.92 0.012 85);        /* Warm Sand */

  /* Brand / Primary - Terracotta */
  --color-primary: oklch(0.52 0.12 35);
  --color-primary-hover: oklch(0.48 0.11 35);

  /* Semantic colors */
  --color-destructive: oklch(0.45 0.12 25);
  --color-success: oklch(0.55 0.08 145);
  --color-info: oklch(0.58 0.12 210);
}
```

## shadcn/ui Patterns

This project follows shadcn/ui patterns:

### 1. Use Existing Components First

```tsx
// ❌ Custom markup
<div className="border rounded p-4 shadow">...</div>

// ✅ Use Card
<Card>...</Card>
```

### 2. Compound Components

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### 3. cn() for Conditional Classes

```tsx
import { cn } from '@tracebug/ui/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  "always-present"
)} />
```

### 4. Semantic Colors (No Raw Values)

```tsx
// ❌ Raw colors
<div className="bg-blue-500 text-white" />

// ✅ Semantic tokens
<div className="bg-primary text-primary-foreground" />
```

### 5. Icons with data-icon Pattern

```tsx
// Icons use data-icon, not sizing classes
<Button>
  <SearchIcon data-icon="inline-start" />
  Search
</Button>
```

### 6. Equal Dimensions: size-*

```tsx
// ❌ Separate width/height
<Avatar className="w-10 h-10" />

// ✅ Combined size
<Avatar className="size-10" />
```

### 7. Spacing: gap-* (not space-y-*)

```tsx
// ❌ space-y classes
<div className="space-y-4">{/* wrong */}</div>

// ✅ gap-* with flex
<div className="flex flex-col gap-4">{/* correct */}</div>
```

## Component Reference

### Available Components

| Component | Source | Notes |
|-----------|---------|-------|
| Button | Custom + CVA | Variants: default, secondary, outline, dark, ghost, destructive, link |
| Card | Custom | Compound: Header, Title, Description, Content, Footer |
| Badge | Custom + CVA | Variants: default, secondary, destructive, outline |
| Input | Custom | Styled input field |
| Spinner | Custom | Loading indicator (uses `size-*` pattern) |
| Separator | Custom | Horizontal/vertical separator |
| Skeleton | Custom | Loading placeholder |
| Alert | Custom + CVA | Variants: default, destructive, success, info |
| Avatar | @base-ui | With fallback support |
| Tooltip | @base-ui | Hover tooltips |
| Popover | @base-ui | Dropdowns/popups |
| Select | @base-ui | Dropdown selects |
| Tabs | @base-ui | Tabbed content |
| Accordion | @base-ui | Collapsible sections |
| Dialog | @base-ui | Modals/dialogs |
| Checkbox | @base-ui | Form checkbox |
| Radio | @base-ui | Form radio (use with RadioGroup) |
| RadioGroup | @base-ui | Radio group container |
| Switch | @base-ui | Toggle switch |
| Field | @base-ui | Form field wrapper |
| FieldLabel | @base-ui | Field label |
| FieldDescription | @base-ui | Field description |
| FieldError | @base-ui | Field error message |
| ScrollArea | Custom | Scrollable area |
| Collapsible | Custom | Legacy - consider migrating to Accordion |

### Domain-Specific Components

- **JsonTree** - Trace JSON viewer
- **TimingBar** - Pipeline timing visualization
- **PipelinePath** - Pipeline path display

## Import Usage

```tsx
// Import from @tracebug/ui
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Dialog,
  DialogTrigger,
  DialogContent,
  Tabs,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipPopup,
  cn,
} from '@tracebug/ui';
```

## Usage Examples

### Dialog

```tsx
import {
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
} from '@tracebug/ui';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger render={<Button>Open Dialog</Button>} />
  <DialogPortal>
    <DialogBackdrop />
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Dialog Title</DialogTitle>
        <DialogDescription>
          Dialog description goes here.
        </DialogDescription>
      </DialogHeader>
      {/* Content */}
      <DialogFooter>
        <DialogClose render={<Button variant="secondary">Close</Button>} />
        <Button>Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </DialogPortal>
</Dialog>
```

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsPanel } from '@tracebug/ui';

<Tabs defaultValue="tab-1">
  <TabsList>
    <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsPanel value="tab-1">Content 1</TabsPanel>
  <TabsPanel value="tab-2">Content 2</TabsPanel>
</Tabs>
```

### Accordion

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from '@tracebug/ui';

<Accordion defaultValue="item-1">
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionPanel>
      Content for section 1
    </AccordionPanel>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Section 2</AccordionTrigger>
    <AccordionPanel>
      Content for section 2
    </AccordionPanel>
  </AccordionItem>
</Accordion>
```

### Select

```tsx
import { Select, SelectLabel, SelectTrigger, SelectPortal, SelectPopup, SelectGroup, SelectItem } from '@tracebug/ui';

<Select value={value} onValueChange={setValue}>
  <SelectLabel>Role</SelectLabel>
  <SelectTrigger render={<SelectTriggerDefault>Choose option</SelectTriggerDefault>} />
  <SelectPortal>
    <SelectPopup>
      <SelectGroup>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="user">User</SelectItem>
      </SelectGroup>
    </SelectPopup>
  </SelectPortal>
</Select>
```

### Form Components

```tsx
import { Field, FieldLabel, FieldDescription, Checkbox, Radio, RadioGroup, Switch } from '@tracebug/ui';

// Checkbox with Field
<Field>
  <Checkbox name="terms" defaultChecked={false} />
  <FieldLabel>I agree to the terms</FieldLabel>
  <FieldDescription>You must accept the terms to continue</FieldDescription>
</Field>

// Radio Group
<RadioGroup name="role" defaultValue="user">
  <Field>
    <Radio value="admin" />
    <FieldLabel>Admin</FieldLabel>
  </Field>
  <Field>
    <Radio value="user" />
    <FieldLabel>User</FieldLabel>
  </Field>
</RadioGroup>

// Switch
<Field>
  <Switch defaultChecked={false} onCheckedChange={setDarkMode} />
  <FieldLabel>Dark Mode</FieldLabel>
</Field>
```

## Adding New Components

### Option 1: Use shadcn CLI

The `components.json` config enables `npx shadcn@latest add`:

```bash
# Add a shadcn component
npx shadcn@latest add slider

# Note: This works for simple components. For @base-ui components,
# you'll need to adapt the code to use @base-ui's API.
```

### Option 2: Manual @base-ui Integration

For @base-ui components, follow this pattern:

```tsx
import * as React from "react";
import * as Primitive from "@base-ui/react/xyz";
import { cn } from "../lib/utils";

/* ---------- Component ---------- */

interface ComponentProps {
  // Props specific to your wrapper
}

const Component = ({ className, ...props }: ComponentProps) => {
  return (
    <Primitive.Component.Root
      className={cn("base-classes", className)}
      {...props}
    >
      {/* Children */}
    </Primitive.Component.Root>
  );
};

export { Component };
```

### Option 3: Custom Components

For simple presentational components:

```tsx
import * as React from "react";
import { cn } from "../lib/utils";

const MyComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("base-classes", className)} {...props} />
  ),
);
MyComponent.displayName = "MyComponent";
```

## Migration Status

| Component | Status | Notes |
|-----------|----------|-------|
| Button | ✅ Complete | Follows shadcn/ui patterns |
| Badge | ✅ Complete | CVA variants |
| Input | ✅ Complete | Styled input |
| Card | ✅ Complete | Full compound composition |
| Spinner | ✅ Complete | Uses `size-*` pattern |
| Separator | ✅ Complete | New component |
| Skeleton | ✅ Complete | New component |
| Alert | ✅ Complete | New component |
| Avatar | ✅ Complete | @base-ui Avatar |
| Tooltip | ✅ Complete | @base-ui Tooltip |
| Popover | ✅ Complete | @base-ui Popover |
| Select | ✅ Complete | @base-ui Select |
| Tabs | ✅ Complete | @base-ui Tabs |
| Accordion | ✅ Complete | @base-ui Accordion |
| Dialog | ✅ Complete | @base-ui Dialog |
| Form Components | ✅ Complete | Checkbox, Radio, Switch, Field |
| ScrollArea | ✅ Complete | Custom scroll area |
| Collapsible | ⚠️ Custom | Legacy - can migrate to Accordion |

## Building

```bash
# Build UI package
pnpm --filter @tracebug/ui build

# Type check UI
pnpm --filter @tracebug/ui type-check

# Watch mode during development
pnpm --filter @tracebug/ui dev
```

## shadcn CLI Configuration

`components.json` at project root enables `npx shadcn@latest add`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "packages/ui/src/styles/index.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@tracebug/ui/components",
    "utils": "@tracebug/ui/lib/utils"
  }
}
```

**Note:** CLI generates Radix UI code. For @base-ui components, adapt to use:
- Namespace imports: `Tabs.Root`, `Tabs.Tab`
- `render` prop instead of `asChild`
- Your custom design tokens

## References

- **@base-ui/react docs:** https://base-ui.com/react/components/
- **@base-ui react forms:** https://base-ui.com/react/handbook/forms
- **shadcn/ui components:** https://ui.shadcn.com/docs/components
- **shadcn/create (choose Radix or Base UI):** https://ui.shadcn.com/create
- **shadcn/ui powered by Base UI:** https://basecn.dev/
- **Tailwind CSS v4:** https://tailwindcss.com/blog/tailwindcss-v4-alpha
