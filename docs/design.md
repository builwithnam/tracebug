# Tracebug Design System — Claude-Inspired "Technical Manuscript"

This document defines Tracebug's visual language and interaction specifications. All UI development must follow these standards.

The interface treats pipeline traces as a kind of literary code documentation on parchment — warm, unhurried, and quietly intellectual.

---

## 1. Design Philosophy

Tracebug is an **AI pipeline tracing and debugging tool** — developers use it in production to quickly locate inputs/outputs and performance bottlenecks at each stage of a chatbot pipeline. Inspired by Claude's warm, editorial aesthetic:

1. **Restraint is sophistication.** Default to subtraction. A debugging tool should let data speak, not distract with decoration. Whitespace itself is design. Superfluous dividers, decorative icons, and "just in case" hint text are noise.

2. **Warmth through consistency.** Every color has a yellow-brown undertone — no cool blues, no pure blacks. The palette feels lived-in and trustworthy, like a well-used notebook.

3. **Editorial hierarchy.** Serif headlines (Georgia) carry gravitas, while sans-serif UI elements serve utility with quiet efficiency. Generous line-height (1.60) creates a reading experience closer to a book than a dashboard.

4. **Color as signal, not decoration.** The interface is predominantly neutral. Terracotta appears only for primary CTAs and brand moments. Semantic colors (user/assistant/system) are warm, earthy variants.

---

## 2. Color System

Using OKLCh color space via CSS custom properties. All colors have warm undertones.

### 2.1 Neutral Scale — Warm Tones Only

95% of interface is neutral with yellow-brown undertones:

| Role | OKLCh | Hex | Usage |
|------|-------|-----|-------|
| Parchment background | `oklch(0.96 0.01 85)` | `#f5f4ed` | Primary page background |
| Ivory card | `oklch(0.98 0.008 85)` | `#faf9f5` | Message cards, containers |
| Warm sand | `oklch(0.92 0.012 85)` | `#e8e6dc` | Secondary backgrounds, buttons |
| Border cream | `oklch(0.93 0.01 85)` | `#f0eee6` | Standard borders |
| Border warm | `oklch(0.88 0.015 85)` | `#e8e6dc` | Prominent borders, dividers |
| Dark surface | `oklch(0.20 0.01 70)` | `#30302e` | Dark containers |
| Deep dark | `oklch(0.10 0.008 70)` | `#141413` | Dark theme background |

**Text Colors — All Warm:**

| Role | OKLCh | Hex | Usage |
|------|-------|-----|-------|
| Near black | `oklch(0.10 0.01 70)` | `#141413` | Primary text, headlines |
| Olive gray | `oklch(0.38 0.015 70)` | `#5e5d59` | Secondary body text |
| Stone gray | `oklch(0.55 0.02 65)` | `#87867f` | Tertiary text, footnotes |
| Charcoal warm | `oklch(0.32 0.012 70)` | `#4d4c48` | Button text |
| Warm silver | `oklch(0.70 0.015 85)` | `#b0aea5` | Text on dark surfaces |

**Rule:** No cool blue-grays anywhere. Every gray must have a yellow-brown undertone. Within a single screen, text color should use at most 3 levels.

### 2.2 Brand & Semantic Colors

| Role | OKLCh | Hex | Usage |
|------|-------|-----|-------|
| Terracotta brand | `oklch(0.52 0.12 35)` | `#c96442` | Primary CTAs, brand moments |
| Coral accent | `oklch(0.58 0.12 35)` | `#d97757` | Text highlights |
| User messages | `oklch(0.58 0.08 45)` | Warm amber-brown | User type badges, borders |
| Assistant messages | `oklch(0.52 0.12 35)` | Terracotta | Assistant type badges, borders |
| System messages | `oklch(0.42 0.015 70)` | Dark charcoal | System type badges, borders |
| Error crimson | `oklch(0.45 0.12 25)` | `#b53333` | Error states |
| Muted green | `oklch(0.55 0.08 145)` | Success states |
| Muted blue-green | `oklch(0.58 0.12 210)` | JSON strings |
| Muted teal | `oklch(0.58 0.14 210)` | JSON numbers |

**Rules:**
- Semantic colors are for small-area elements (badges, left borders, timing bars). Large-area fills use 5-10% opacity variants.
- Terracotta is reserved for primary CTAs and highest-signal brand moments only.
- No more than 2–3 semantic colors should appear simultaneously on any single screen.

### 2.3 Focus & Ring Colors

| Role | OKLCh | Hex | Usage |
|------|-------|-----|-------|
| Focus blue | `oklch(0.58 0.14 230)` | `#3898ec` | Input focus rings (only cool color for accessibility) |
| Ring warm | `oklch(0.70 0.02 85)` | `#d1cfc5` | Hover/focus rings on buttons, cards |
| Ring subtle | `oklch(0.85 0.015 85)` | Lighter ring variant |
| Ring deep | `oklch(0.65 0.025 85)` | `#c2c0b6` | Active/pressed states |

**Rule:** The only cool color in the entire system is Focus Blue (`#3898ec`), used purely for keyboard accessibility on input focus states.

---

## 3. Typography

### 3.1 Font Families

| Role | Font | Usage |
|------|------|-------|
| Headlines | `Georgia, "Times New Roman", Times, serif` | All headings, titles — editorial gravitas |
| Body / UI | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif` | Default for all interface text, buttons, labels |
| Code / Data | `"SF Mono", "Cascadia Code", "Fira Code", Consolas, ui-monospace, monospace` | JSON tree, IDs, timestamps, monospaced data |

**Principles:**
- Serif for authority (headlines), sans for utility (UI).
- Monospace strictly for code/data — never for non-code content.

### 3.2 Font Size Discipline

| Size | Role | Usage |
|------|------|-------|
| 48px (3rem) | Landing hero | Only large heading — serif |
| 20px (1.25rem) | Page headings | Session header, card titles — serif |
| 16px (1rem) | Default | Main interface — message body, form inputs |
| 14px (0.88rem) | Body large | Landing subtitle, descriptions |
| 13px (0.81rem) | Metadata | Summary values, session meta |
| 12px (0.75rem) | Auxiliary | Badges, timestamps, labels |
| 10px (0.63rem) | Overline | Section labels, metadata keys — uppercase, tracked |

**Rules:**
- Aside from landing hero (48px), interface should not use sizes above 20px.
- No more than 2 font sizes per block. If a 3rd size seems necessary, try `font-weight` or color first.

### 3.3 Font Weight

| Weight | Usage |
|--------|-------|
| `400` (normal) | Body text, descriptions, serif headings |
| `500` (medium) | Labels, badges, sans-serif buttons, small text |

**Rules:**
- Single weight for serifs (400/normal) — no bold, no light. Creates consistent "voice."
- Sans-serif uses 400 or 500 — never 600 or 700.

### 3.4 Line Height & Letter Spacing

| Element | Line Height | Letter Spacing |
|---------|--------------|----------------|
| Serif headings | 1.10 – 1.20 (tight) | Normal |
| Body text | 1.60 (relaxed) | Normal |
| Code | 1.60 | -0.01em |
| Labels/badges (≤12px) | 1.25 – 1.60 | 0.1em |

**Principles:**
- Generous body line-height (1.60) creates literary reading experience.
- Tight heading line-heights (1.10–1.20) feel editorial, not cramped.
- Letter-spacing on small labels (0.1em) maintains readability at tiny sizes.

---

## 4. Spacing System

Based on an 8px grid. Spacing conveys information — it tells the user "what belongs with what."

### 4.1 Spacing Semantics

| Spacing | Meaning | Usage |
|---------|---------|-------|
| 4px | Tight association | Badge with meta, icon with text |
| 6px | Within component | Between pipeline pills, summary grid gap |
| 8px | Same group, different items | Message header gap, session meta gap |
| 12px | Within section | Timeline gap, trace-panel margin |
| 16px | Card interior | Message-card padding |
| 20px | Form gap | Landing form gap |
| 24px | Between sections | Session-header padding, loading padding |
| 32px – 40px | Page level | Landing-card padding |

### 4.2 Container Strategy (by priority)

When visually separating two areas:

1. **Spacing only** — increase gap (preferred)
2. **Background color change** — one area gets different base
3. **Single divider** — thin border-top (`1px solid Border Cream`)
4. **Full card** — border + radius + padding + shadow (heaviest)

Use lightest tool to achieve separation.

---

## 5. Border Radius — Soft & Approachable

| Value | Usage |
|-------|-------|
| 6px | Subtly rounded — small buttons, secondary elements |
| 8px | Comfortably rounded — standard buttons, cards, containers |
| 12px | Generously rounded — primary buttons, inputs |
| 16px | Very rounded — featured containers, video players |
| 999px | Full — pills, circular elements |

**Principle:** Soft corners (8-12px) create approachable, human-scale feel. No sharp edges (<6px).

---

## 6. Depth & Elevation

Depth comes from warm-toned ring shadows, not traditional drop shadows.

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, no border | Parchment background, inline text |
| Contained (Level 1) | `1px solid Border Cream` | Standard cards, sections |
| Ring (Level 2) | `0px 0px 0px 1px` ring shadows | Interactive cards, buttons, hover states |
| Whisper (Level 3) | `rgba(0,0,0,0.03) 0px 4px 24px` | Elevated cards, content islands |
| Inset (Level 4) | `inset 0px 0px 0px 1px` at 15% opacity | Active/pressed buttons |

**Shadow Philosophy:** Ring shadows (`0px 0px 0px 1px`) create a border-like halo that's softer than an actual border. Drop shadows are extremely soft (0.03 opacity) — barely visible lifts.

---

## 7. Interaction States

### 7.1 State Hierarchy

```
Rest → Hover → Selected → Focused → Disabled
```

### 7.2 Hover State

Hover says "I notice you" — visual changes should be subtle and immediate:

| Element | Hover Effect |
|---------|-------------|
| Message card | Shadow deepens, background warms slightly |
| Back button | Text color shifts to terracotta, underline appears |
| Stage header | Background deepens to warm sand |
| Primary button (terracotta) | Background darkens (`oklch(0.48 0.11 35)`) |
| Secondary button | Background darkens to border warm |
| JSON toggle | Underline appears |

**Rules:**
- No size changes on hover (no `scale`).
- Hover visual changes must always be lighter than selected.
- All hovers use `transition: 200ms` (slower, more deliberate).

### 7.3 Selected State

Selected says "I am chosen" — visually heavier than hover:

| Element | Selected Effect |
|---------|----------------|
| Message card (user) | Background `bg-user/5` + border thickened + whisper shadow |
| Message card (assistant) | Background `bg-assistant/5` + border thickened + whisper shadow |
| Message card (system) | Background `bg-system/5` + border thickened + whisper shadow |

**Key distinction:** Hover = shadow slight deepens. Selected = background color change + border thickened + shadow. Selected has more visual dimensions.

### 7.4 Focus State

Inputs use Focus Blue border for accessibility:

```css
box-shadow: 0px 0px 0px 1px var(--color-background), 0px 0px 0px 3px var(--color-focus);
```

This is the **only cool color** in the system, reserved for keyboard accessibility.

### 7.5 Error State

Errors use warm crimson palette:

```css
/* Inline error */
color: oklch(0.45 0.12 25); /* Error Crimson */

/* Error panel */
background: rgba(oklch(0.45 0.12 25), 0.1);
border: 1px solid rgba(oklch(0.45 0.12 25), 0.2);
color: oklch(0.45 0.12 25);
```

---

## 8. Motion

### 8.1 Principles

- **Deliberate, unhurried.** Motion helps users understand change — it doesn't show off.
- **Fade in/out preferred.** Element appearance/disappearance uses opacity transitions.
- **No bounce, no spring.** Animations use ease-out, never ease-in-out bounce.

### 8.2 Durations

| Scenario | Duration | Implementation |
|----------|----------|----------------|
| Color / opacity change | 200ms | `transition: all 0.2s` |
| Arrow rotation | 200ms | `transition: transform 0.2s` |
| Shadow change | 200ms | `transition: box-shadow 0.2s` |
| Timing bar width | 300ms | `transition: width 0.3s ease-out` |
| Loading spin | 600ms (infinite) | CSS spin animation |
| Fade in up | 400ms | Page entry, card appearance |
| Page transition | 500ms | Editorial chapter change feel |

---

## 9. Component Specifications

### 9.1 Landing Card

Entry form — centered, warm, editorial:

- **Background:** Ivory (`#faf9f5`)
- **Border:** Border Cream (`1px solid #f0eee6`)
- **Radius:** 8px (comfortably rounded)
- **Shadow:** Whisper (`rgba(0,0,0,0.03) 0px 4px 24px`)
- **Title:** 48px Georgia, Near Black, line-height 1.10
- **Subtitle:** 14px sans-serif, Olive Gray, line-height 1.60
- **Input:** 12px radius, border cream, blue focus ring
- **Button:** Terracotta, Ivory text, 8px radius, ring shadow
- **Padding:** 40px horizontal, 32px vertical

### 9.2 Session Header

Sticky top navigation — warm, editorial:

- **Background:** Ivory (`#faf9f5`)
- **Border-bottom:** Border Cream
- **Brand name:** 20px Georgia, Near Black
- **Subtitle:** 12px sans-serif, Stone Gray
- **Meta badges:** 10px uppercase tracked, warm sand background

### 9.3 Message Card

The core component — displays each message:

- **Left border:** 3px thick, color by type (user/assistant/system)
- **Background:** Ivory (`#faf9f5`) on rest, 5% opacity variant on selected
- **Border:** Border Cream (`1px solid #f0eee6`)
- **Radius:** 8px
- **Shadow:** Whisper (`rgba(0,0,0,0.02) 0px 2px 12px`) on rest, enhanced on selected
- **Badge:** Small (10px), uppercase, 0.1em tracking, radius 6px
- **Timestamp:** 12px, Stone Gray, right-aligned
- **Body:** 14px monospace, Near Black, line-height 1.60
- **Trace panel:** Separated by `border-top`, warm sand header background

### 9.4 Pipeline Path Indicator

Pipeline visualization:

- All 6 stages always displayed
- Active stage: Terracotta background (`bg-primary/10`), Terracotta text, border
- Inactive stage: Warm sand background, Stone Gray text
- Stages connected by `→` arrows
- Gap: 8px

### 9.5 Timing Bars

Stage duration visualization:

- Horizontal bar chart, labels right-aligned at 100px width
- Fill color: Terracotta (`#c96442`)
- Duration values: 12px monospace, Near Black, right-aligned
- Bar height: 10px (2.5 Tailwind), rounded 6px
- Track background: Warm sand
- Animation: 300ms ease-out width transition

### 9.6 Stage Section

Pipeline stage details, collapsible:

- **Header:** Warm sand background (`#e8e6dc`), 12px padding
- **Arrow:** 10px, rotates 90deg on expand
- **Body:** Summary grid + JSON tree toggle
- **Border:** Border cream, 8px radius
- **Hover:** Background darkens slightly

### 9.7 Summary Grid

Key-value grid for stage summaries:

- Key right-aligned at 110px, 10px uppercase tracked, Stone Gray
- Value left-aligned, 12px monospace, Near Black
- Hover on row: Warm sand background at 30% opacity
- Responsive: key shrinks to 80px on small screens

### 9.8 JSON Tree

Raw data browser:

- Monospace font, Ivory background
- Collapsible/expandable nodes
- Syntax colors: key (muted blue-green), string (muted green), number (muted teal), boolean (terracotta), null (stone gray italic)
- Max depth 4 levels, max string length 300 characters (click to expand)
- Hover on row: Warm sand background at 30% opacity

---

## 10. Responsive Design

Breakpoint: `640px`

Small-screen adaptations (`@media (max-width: 640px)`):

| Element | Change |
|---------|--------|
| Session header | Horizontal → vertical layout, left-aligned |
| Session meta | Wraps allowed |
| Summary key | `110px → 80px` |
| Summary value | `500px → 300px` max-width |
| Timing label | `100px → 70px` |
| Pipeline path | Gap reduced `8px → 6px` |

---

## 11. Anti-patterns

The following are **prohibited** in the codebase:

| Prohibited | Reason | Alternative |
|------------|--------|-------------|
| Cool blue-grays | Breaks warm palette consistency | Use defined warm neutral scale |
| Pure white background (`#fff`) | Lacks warmth, feels sterile | Use Ivory (`#faf9f5`) or Parchment (`#f5f4ed`) |
| Pure black text (`#000`) | Harsh, lacks warmth | Use Near Black (`#141413`) |
| Sharp corners (<6px) | Conflicts with soft, approachable identity | Use 8-12px radius scale |
| Bold serif headings (700+) | Breaks single-weight serif principle | Use weight 400 (normal) for all serifs |
| `transform: scale()` on hover | Jarring, conflicts with restrained style | Use background color or shadow changes |
| Multi-color gradient backgrounds | Decorative, distracting | Solid colors only |
| Hard drop shadows | Too harsh for editorial feel | Use ring shadows (`0px 0px 0px 1px`) or whisper shadows |
| Saturated colors beyond terracotta | Breaks muted palette | Stick to defined semantic colors |
| Spring/bounce animations | Too playful, not editorial | Use ease-out or ease-in |
| Skeleton loading | Conflicts with minimalist style | SVG spinner with warm colors |

---

## 12. Tech Stack

| Layer | Technology | Location |
|-------|-----------|----------|
| Framework | Next.js 15 (App Router) | `apps/web/src/app/` |
| Styles | Tailwind CSS + custom CSS variables | `packages/ui/src/styles.css` |
| Components | React | `packages/ui/src/components/` |
| Business logic | `@tracebug/core` | `packages/core/src/` |
| API | Express + Node.js (ESM) | `server/src/` |
| Database | MySQL (`mysql2`) | `server/src/db.ts` |

**Design tokens:** All colors, spacing, and typography defined as CSS custom properties in `packages/ui/src/styles.css` using OKLCh color space.

---

## 13. Checklist

Before submitting any UI change:

- [ ] Do all colors have warm undertones? No cool blues or pure blacks?
- [ ] Is Terracotta reserved only for primary CTAs and brand moments?
- [ ] Are serif headings at weight 400 (normal) — no bold?
- [ ] Do small labels (≤12px) use letter-spacing (0.1em)?
- [ ] Is body line-height 1.60 (relaxed)?
- [ ] Are border radii 8-12px (soft, approachable)?
- [ ] Do shadows use ring pattern (`0px 0px 0px 1px`) or whisper softness?
- [ ] Is Focus Blue (`#3898ec`) only used for input accessibility?
- [ ] Are animations ≥200ms (deliberate, unhurried)?
- [ ] Does spacing use multiples of 8px grid?
- [ ] Do new interactions include `transition: 200ms`?
- [ ] Does layout work on small screens (≤640px)?
- [ ] Are semantic colors used only for small areas, not large fills?
- [ ] Is Ivory (`#faf9f5`) or Parchment (`#f5f4ed`) used for backgrounds, not pure white?
