# @tracebug/ui

Atomic UI components for tracebug — zero business logic.

## Structure (Tổng quan Kiến trúc: Shared UI Module)

```
src/
├── components/      # UI Components (Atomic components) - "heart" of the module
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── lib/            # Utility functions, third-party library configs
│   └── utils.ts    # clsx, tailwind-merge configuration
├── styles/         # Global CSS config, theme, Tailwind config
│   └── index.css   # Design tokens, base styles
├── index.ts        # Public API exports
└── styles.css      # (legacy, use styles/index.css)
```

## Installation

```bash
pnpm add @tracebug/ui
```

## Usage

```tsx
import { Button, Card, Dialog } from '@tracebug/ui';

// Import styles once in your app
import '@tracebug/ui/styles.css';
```

## Components

- **Button** - CVA variants (default, secondary, outline, ghost, destructive, link)
- **Card** - Compound (Header, Title, Description, Content, Footer)
- **Badge** - CVA variants
- **Input** - Styled input field
- **Spinner** - Loading indicator
- **Separator** - Visual separator
- **Skeleton** - Loading placeholder
- **Alert** - Callout with variants
- **Avatar** - User avatar with fallback
- **Tooltip** - Hover tooltips (@base-ui/react)
- **Popover** - Dropdowns/popups (@base-ui/react)
- **Select** - Dropdown selects (@base-ui/react)
- **Tabs** - Tabbed content (@base-ui/react)
- **Accordion** - Collapsible sections (@base-ui/react)
- **Dialog** - Modals/dialogs (@base-ui/react)
- **Checkbox** - Form checkbox (@base-ui/react)
- **Radio** - Form radio (@base-ui/react)
- **RadioGroup** - Radio group container (@base-ui/react)
- **Switch** - Toggle switch (@base-ui/react)
- **Field** - Form field wrapper (@base-ui/react)
- **FieldLabel** - Field label (@base-ui/react)
- **FieldDescription** - Field description (@base-ui/react)
- **FieldError** - Field error message (@base-ui/react)
- **ScrollArea** - Custom scrollable area
- **Collapsible** - Custom collapsible (legacy)

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm type-check
```

## Design System

Warm "Technical Manuscript" design inspired by Claude:
- **Warm parchment tones** (not typical grays)
- **Editorial serif headings** (Georgia/Playfair style)
- **Soft, approachable feel** (rounded corners, gentle shadows)
- **Semantic color tokens** (bg-primary, text-muted-foreground)

## Tech Stack

- **@base-ui/react** (v1.4.1) - Headless component primitives
- **Tailwind CSS v4** - Styling
- **lucide-react** - Icons
- **clsx**, **tailwind-merge**, **class-variance-authority** - Utilities
