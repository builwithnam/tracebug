# Tracebug Design System

This document defines Tracebug's visual language and interaction specifications. All UI development must follow these standards.

---

## 1. Design Philosophy

Tracebug is an **AI pipeline tracing and debugging tool** — developers use it in production to quickly locate the inputs/outputs and performance bottlenecks at each stage of a chatbot pipeline. Three core principles:

1. **Restraint is sophistication.** Default to subtraction. A debugging tool should let data speak, not distract with decoration. Superfluous dividers, decorative icons, and "just in case" hint text are noise. Whitespace itself is design.
2. **Hierarchy through grayscale, color as signal.** The interface is predominantly neutral. Color appears only to convey semantics (message type, pipeline stage status, errors). If two areas compete for attention, the solution is to push one back — not color both.
3. **Consistency over individuality.** Similar interactions must have identical visual feedback. A hover effect should "feel the same" across message cards, stage sections, and buttons.

---

## 2. Color System

Currently using CSS custom properties. When migrating to shadcn tokens, the following semantics must be preserved.

### 2.1 Neutral Scale

90% of the interface is neutral. Grayscale levels convey information hierarchy:

| Role | Current Value | Usage |
|------|--------------|-------|
| Page background | `#f5f5f5` | Page base color |
| Card / container | `#fff` | Message cards, stage sections, landing card |
| Secondary surface | `#fafafa` / `#f3f4f6` | Stage header background, hover backgrounds |
| Border | `#e5e7eb` | Dividers, input borders, card borders |
| Primary text | `#333` / `#111` | Headings, body text |
| Secondary text | `#6b7280` | Descriptions, metadata, badges |
| Lightest text | `#9ca3af` | Timestamps, summary keys, placeholders |

**Rule:** Within a single screen, text color should use at most 3 levels (`#333` / `#6b7280` / `#9ca3af` or one semantic color). More than 3 levels indicates a hierarchy problem.

### 2.2 Semantic Colors

Color is only used to convey meaning, never decoration:

| Value | Meaning | Usage |
|-------|---------|-------|
| `#3b82f6` (blue) | User messages, pipeline active state | `user` type message left border, badge, active pipeline pill, timing bar, links |
| `#10b981` (green) | Assistant messages, success | `assistant` type message left border, badge, JSON strings |
| `#6b7280` (gray) | System messages, neutral state | `system` type message left border, badge, default pipeline pill |
| `#ef4444` (red) | Error / danger | Error text, summary errors, landing errors |
| `#2563eb` (dark blue) | Interactive emphasis | Button hover, JSON numbers |
| `#9333ea` (purple) | Data markers | JSON booleans |

**Rules:**
- Semantic colors are for small-area elements (badges, left borders, icons, timing bars). Large-area fills use 10% opacity variants (e.g., `selected` state: `#f0f7ff` / `#eff6ff` / `#ecfdf5`).
- No more than 2–3 semantic colors should appear simultaneously on any single screen.

### 2.3 Dark Mode

Currently not supported. When implemented:
- Background should use dark gray, not pure black — pure black is harsh on LCD screens.
- Borders should use white at low opacity (e.g., `rgba(255,255,255,0.1)`), more subtle than light mode.
- Semantic colors should be lightened to ensure contrast.

---

## 3. Typography

### 3.1 Font Families

| Role | Font | Usage |
|------|------|-------|
| Body / UI | System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`) | Default for all interface text |
| Code / Data | Monospace stack (`"SF Mono", "Cascadia Code", "Fira Code", "Consolas", monospace`) | JSON tree, IDs, timestamps, monospaced data |

Font stacks are declared in `body` and `.json-tree` selectors.

### 3.2 Font Size Discipline

**The entire project uses only 3 core sizes:**

| Size | Role | Usage |
|------|------|-------|
| 16px | Page titles, emphasis | Landing title, input fields, primary button text |
| 14px (13–15px) | Default | Main interface font — message body, stage names, forms, landing subtitle |
| 12px (11px) | Auxiliary | Badge text, timestamps, timing labels/values, summary keys, pipeline pills |

**Current implementation mapping:**

| CSS Declaration | Size | Element |
|-----------------|------|---------|
| `font-size: 32px` | Landing title | `.landing-title` (only large text element) |
| `font-size: 18px` | Session title | `.session-title` |
| `font-size: 16px` | Form inputs | `.landing-input`, `.landing-btn` |
| `font-size: 15px` | Landing subtitle | `.landing-subtitle` |
| `font-size: 14px` | Body text | `.message-text`, `.stage-name`, `.session-error`, `.landing-error` |
| `font-size: 13px` | Metadata | `.session-meta-value`, `.summary-value` |
| `font-size: 12px` | Auxiliary labels | `.message-timestamp`, `.pipeline-pill`, `.timing-label`, `.timing-value`, `.summary-key`, `.json-tree`, `.stage-duration-badge`, `.trace-empty` |
| `font-size: 11px` | Smallest labels | `.message-type-badge`, `.session-meta-label`, `.json-tree-toggle` |

**Rules:**
- Aside from the landing page title (`32px`), the interface should not use sizes above `18px`. Debugging tools prioritize information density.
- No more than 2 font sizes per block. If a 3rd size seems necessary, try `font-weight` or color first.

### 3.3 Font Weight

Only two weights:

| Weight | Usage |
|--------|-------|
| `font-weight: 400` (normal) | Body text, descriptions, most text |
| `font-weight: 500–600` (medium/semibold) | Labels, badges, buttons, stage names, headings |

**Note:** The current implementation uses `font-weight: 600` for `.landing-btn` and `.stage-name`, and `font-weight: 700` for `.landing-title`. In future iterations, the landing title's `700` should be reduced to `500` to maintain the tool's overall "light" feel.

---

## 4. Spacing System

Based on a 4px grid. Spacing conveys information — it tells the user "what belongs with what."

### 4.1 Spacing Semantics

| Spacing | Meaning | Current Usage |
|---------|---------|---------------|
| 4px | **Tight association** | Icon with text, badge with meta |
| 6px | **Within component** | Between pipeline pills, timing row `margin-bottom`, summary grid `gap` |
| 8px | **Same group, different items** | `.message-header` gap, session-meta gap, stage-header gap, timing row gap |
| 12px | **Within section** | Landing form gap, timeline gap, trace-panel `margin-top` |
| 14–18px | **Card interior** | Message-card padding `14px 18px`, stage-body padding `14px` |
| 24px | **Between sections** | Timeline padding, session-header padding, loading padding |
| 40–48px | **Page level** | Landing-card padding `48px 40px` |

**Rule:** Dividers (`border-top`) are only for semantically clear content separation (e.g., trace-panel vs. message body, stage header vs. stage body). If spacing alone works, don't add a divider.

### 4.2 Container Strategy (by priority)

When visually separating two areas:

1. **Spacing only** — increase the gap (preferred, e.g., timeline `gap: 12px` between cards)
2. **Background color change** — one area gets a different base (e.g., `.stage-header` uses `#fafafa`)
3. **Single divider** — a thin `border-top: 1px solid #e5e7eb` (e.g., `.trace-panel`)
4. **Full card** — border + radius + padding + shadow (heaviest, e.g., `.message-card`)

Use the lightest tool to achieve separation.

---

## 5. Interaction States

### 5.1 State Hierarchy

```
Rest → Hover → Selected → Focused → Disabled
```

### 5.2 Hover State

Hover says "I notice you" — visual changes should be subtle and immediate:

| Element | Hover Effect | Implementation |
|---------|-------------|----------------|
| Message card | Shadow deepens | `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` (from `0 1px 3px 0.04`) |
| Back button | Light gray bg + darker text | `background: #f3f4f6; color: #333` |
| Stage header | Background deepens | `background: #f3f4f6` (from `#fafafa`) |
| Primary button | Background deepens | `background: #2563eb` (from `#3b82f6`) |
| JSON toggle | Underline appears | `text-decoration: underline` |

**Rules:**
- No size changes on hover (no `scale`).
- Hover visual changes must always be lighter than selected. Users should distinguish "hovering" from "selected."
- All hovers use `transition: 0.15s`.

### 5.3 Selected State

Selected says "I am chosen" — visually heavier than hover:

| Element | Selected Effect |
|---------|----------------|
| Message card (user) | Background `#eff6ff` + left border thickened to `5px` + shadow enhanced |
| Message card (assistant) | Background `#ecfdf5` + left border thickened to `5px` + shadow enhanced |
| Message card (default) | Background `#f0f7ff` + left border thickened to `5px` + shadow enhanced |

**Key distinction:** Hover = shadow slightly deepened. Selected = background color change + border thickened + shadow. Selected always has more visual dimensions than hover.

### 5.4 Focus State

Inputs use brand blue border on focus:

```css
border-color: #3b82f6;
```

### 5.5 Error State

Errors use a red palette:

```css
/* Inline error (landing) */
color: #ef4444;

/* Error panel (session) */
background: #fef2f2;
border: 1px solid #fecaca;
color: #991b1b;

/* Summary error */
color: #ef4444;
font-style: italic;
```

---

## 6. Icons

The project does not use an icon library. All "icons" are implemented with characters:

| Element | Implementation | Description |
|---------|---------------|-------------|
| Back arrow | `&larr;` HTML entity | Session header back button |
| Expand/collapse arrow | `▶` character + CSS `transform: rotate(90deg)` | Stage section expand/collapse indicator |
| Pipeline arrow | `→` character | Stage connectors in pipeline path |
| JSON collapse marker | `▼` / `▶` characters | JSON tree node expand/collapse |
| Loading animation | CSS spinner (`border + border-top-color + animation: spin`) | Data loading |

**Rules:**
- Character icons inherit parent text color by default. Use light gray for de-emphasis (e.g., `#9ca3af`, `#d1d5db`).
- Arrow rotation uses `transition: transform 0.15s` for consistency with global animation timing.

---

## 7. Border Radius

| Value | Usage |
|-------|-------|
| `6px` | Stage sections, back button, JSON tree |
| `8px` | Inputs, buttons, stage section inner borders, error panels |
| `10px` | Message cards, badges |
| `12px` | Pipeline pills, landing card, timing bar track/fill |
| `50%` | Spinner (circle) |

**Rule:** Do not hardcode non-standard pixel values. Border radius should be selected from the `6px → 8px → 10px → 12px` scale.

---

## 8. Motion

### 8.1 Principles

- **Fast, restrained.** Motion helps users understand change — it doesn't show off.
- **Fade in/out preferred.** Element appearance/disappearance uses opacity transitions, not slides.
- **No bounce.** No spring/bounce easing.

### 8.2 Durations

| Scenario | Duration | Implementation |
|----------|----------|----------------|
| Color / opacity change | 150ms | `transition: border-color 0.15s` / `transition: background 0.15s` |
| Arrow rotation | 150ms | `transition: transform 0.15s` |
| Shadow change | 150ms | `transition: box-shadow 0.15s` |
| Timing bar width | 300ms | `transition: width 0.3s` |
| Loading spin | 600ms (infinite) | `animation: spin 0.6s linear infinite` |
| Page transition | No motion | View switching via `hidden` class, instant show/hide |

---

## 9. Component Specifications

### 9.1 Message Card

The core component — displays each message in the pipeline:

- **Left border color** by message type: blue (user), green (assistant), gray (system)
- **Badge** uses the same color with white text
- **Timestamp** right-aligned, light gray
- **Body** supports truncation (over 200px height), with "Show more" button
- **Trace panel** collapsed at the bottom, separated by `border-top`

### 9.2 Pipeline Path Indicator

Pipeline visualization — shows which stages are active:

- All 6 stages always displayed (`querier → router → scenario_selector → agent → generator → questioner`)
- Active stage: blue background, blue text `background: #eff6ff; color: #3b82f6; border-color: #bfdbfe`
- Inactive stage: gray background, gray text `background: #f3f4f6; color: #9ca3af`
- Stages connected by `→` arrows

### 9.3 Timing Bars

Stage duration visualization:

- Horizontal bar chart, labels right-aligned at `120px` width
- Fill color uniform blue `#3b82f6`
- Duration values displayed on the right
- Minimum width `2px` to ensure very short durations are visible

### 9.4 Stage Section

Pipeline stage details, collapsible:

- **Header:** Arrow + stage name + duration badge (right side)
- **Body:** Summary grid + JSON tree toggle
- Collapse/expand via CSS `display: none` toggle
- Arrow uses `transform: rotate(90deg)` to indicate expanded state

### 9.5 Summary Grid

Key-value grid for stage summaries:

- Key right-aligned at `120px`, light gray
- Value left-aligned, hover to expand long text
- Responsive: key width shrinks to `80px` on small screens

### 9.6 JSON Tree

Raw data browser:

- Monospace font, light gray background
- Collapsible/expandable nodes
- Syntax-colored by data type: key (gray), string (green), number (blue), boolean (purple), null (gray italic)
- Max depth 4 levels, max string length 300 characters (click to expand)
- Hidden by default, toggled by "Show raw JSON" button

### 9.7 Landing Card

Entry form:

- Centered white card, max-width `440px`
- Title + subtitle + input + button + error message
- Error message always reserves space (`min-height: 20px`) to prevent layout shifts

---

## 10. Responsive Design

Breakpoint: `640px`

Small-screen adaptations (`@media (max-width: 640px)`):

| Element | Change |
|---------|--------|
| Session header | Horizontal → vertical layout, left-aligned |
| Session meta | Wraps allowed |
| Summary key | `120px → 80px` |
| Summary value | `500px → 300px` max-width |
| Timing label | `120px → 80px` |
| Pipeline path | Gap reduced `6px → 4px` |

---

## 11. Anti-patterns

The following are **prohibited** in the codebase:

| Prohibited | Reason | Alternative |
|------------|--------|-------------|
| Non-standard grayscale values | Breaks hierarchy consistency | Use the defined neutral scale (`#333`, `#6b7280`, `#9ca3af`, `#e5e7eb`, `#f3f4f6`, `#fafafa`) |
| Arbitrary pixel font sizes | Escapes the design system | Use the defined font size scale |
| `transform: scale()` on hover | Jarring, conflicts with restrained style | Use background color or shadow changes |
| Multi-color gradient backgrounds | Decorative, distracting | Solid colors |
| Skeleton loading | Conflicts with minimalist style | CSS spinner (current implementation) |
| Toast for action confirmation | Fleeting, easily missed | Inline error/status text |
| Fixed-width dropdowns | Text wrapping is unpredictable | Auto-width |
| Pure black background `#000` | Harsh on LCD screens | Use `#333` or dark gray |
| Adding an icon library | Character icons suffice for current needs | Continue using HTML entities / Unicode characters |

---

## 12. Current Tech Stack

| Layer | Technology | Location |
|-------|-----------|----------|
| Styles | Plain CSS (no framework) | `apps/web/src/public/style.css` |
| Markup | HTML | `apps/web/src/public/index.html` |
| Interaction | Vanilla JavaScript (no framework) | `apps/web/src/public/app.js` |
| Business logic | `@tracebug/core` | `packages/core/src/` |
| API | Node.js + `http` module | `apps/web/src/api/session.ts` |
| Database | MySQL (`mysql2`) | `apps/web/src/db.ts` |

**Migration path:** For more complex UI needs, migrate to React + Tailwind + shadcn/ui. The color, spacing, font size, and interaction specifications in this document should be re-implemented through CSS variables / Tailwind tokens with the same semantics.

---

## 13. Checklist

Before submitting any UI change:

- [ ] Do all colors come from the defined palette? Any non-standard colors introduced?
- [ ] Are font sizes within the `11px – 16px` range (landing title `32px` excluded)?
- [ ] Are font weights limited to `400` and `500–600`?
- [ ] Is the hover state lighter than the selected state?
- [ ] Does spacing use multiples of the 4px grid?
- [ ] Do new interactions include `transition: 0.15s` (timing bars excluded)?
- [ ] Are border radii selected from `6px / 8px / 10px / 12px`?
- [ ] Are there unnecessary dividers (spacing or background color could replace)?
- [ ] Does the layout work on small screens (≤640px)?
- [ ] Are new semantic colors used only to convey meaning, not decoration?
