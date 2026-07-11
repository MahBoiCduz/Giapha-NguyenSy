<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: Collaborative PM & Communication Tool
description: A warm, focused workspace where mixed teams track work and stay aligned.
colors: {}
typography: {}
---

# Design System: Collaborative PM & Communication Tool

## 1. Overview

**Creative North Star: "The Warm Studio"**

This system is built around a single idea: the interface is the room, not the work. Like a well-lit studio in the afternoon — warm wood tones, crisp surfaces, natural light — the architecture recedes so the content comes forward. Tasks, conversations, and deadlines are the furniture; the chrome is the walls. Users in the middle of a sprint review or a client handoff should never have to think about the tool; they should only see the work.

The palette is restrained by design. One rose-adjacent primary carries the brand's warmth; everything else is neutral. Type carries the personality — a serif display at larger scales lends the editorial authority that makes mixed teams (engineers, PMs, creatives) feel equally at home. Motion is reactive, not performative: the product responds when touched, but it never initiates.

This system explicitly rejects the enterprise CRUD aesthetic: dense tables, tiny type, no visual breathing room, and a color palette that was never designed at all. It also refuses the 2023–2025 SaaS dark-mode cliché — no purple gradients, no neon accents. And it refuses decorative blur: glassmorphism is never used as a surface treatment. Every surface is flat and opaque; depth is conveyed through shadow, spacing, and tonal layering — not frosted glass.

**Key Characteristics:**
- Warm primary that earns its presence through restraint — ≤10% of any given screen
- Pure white background; warmth lives in the brand colors, not the surface
- Serif display + humanist sans pairing for editorial authority at scale and clarity in body
- Reactive motion only — hover, focus, and state transitions; no unsolicited animation
- Spatial generosity: breathing room is a feature, not waste

## 2. Colors

A restrained palette: one rose-mauve primary, one periwinkle accent, and a near-neutral ramp that keeps content foregrounded.

### Primary
- **Studio Rose** (oklch(0.62 0.18 343)): The brand's single voice. Used on primary CTAs, active navigation states, selection indicators, and progress markers. Never used as a background fill for large areas. White text on all filled uses.

### Secondary
*(omitted — single-accent strategy)*

### Tertiary
*(omitted)*

### Neutral
- **Ink** (oklch(0.18 0.01 343)): Body text, heading text, icon fills. Near-black with a whisper of rose hue — warm without being brown. ≥7:1 contrast on Background.
- **Muted** (oklch(0.52 0.01 343)): Secondary text, timestamps, helper labels, placeholder copy. Rose-tinted mid-gray. Minimum 3.5:1 contrast on Background.
- **Background** (oklch(1.000 0.000 0)): Pure white. No warmth tint — the primary carries warmth; the background doesn't.
- **Surface** (oklch(0.975 0.004 343)): Cards, sidebars, panels, secondary containers. Near-white with the faintest rose trace. Distinct from Background without shouting.
- **Border** (oklch(0.90 0.005 343)): Dividers, input strokes, subtle separators.

### Accent
- **Periwinkle Dusk** (oklch(0.72 0.14 220)): Status badges, links, read receipts, info states, secondary interactive elements. Hue 220° pushes distinctly away from the rose primary. White text on filled badge use; Ink text on light-tinted background uses.

### Named Rules
**The One Voice Rule.** Studio Rose appears on ≤10% of any given screen at any given moment. Its rarity is exactly what gives it authority. When everything is brand-colored, nothing is.

**The Warm Background Fallacy Rule.** Warmth in this product lives in the primary color and typography — not in a cream or sand body background. The background is pure white. Using a tinted bg alongside a warm primary is doubling down on the same channel; it produces a "cozy AI product" aesthetic, which this product is not.

## 3. Typography

**Display Font:** [Serif with editorial warmth — e.g. Fraunces, Playfair Display, or DM Serif Display; to be chosen at implementation]
**Body Font:** [Humanist sans — e.g. Plus Jakarta Sans, Inter, or Geist; to be chosen at implementation]

*[font pairing to be confirmed during implementation]*

**Character:** The serif display brings editorial authority — it signals that this product thinks carefully about presentation, not just function. The humanist sans body is chosen for legibility at small sizes under cognitive load; it's the workhorse. The pairing should feel like a well-designed annual report: the headlines have presence, the body text disappears into reading.

### Hierarchy
- **Display** (light or regular weight, large clamp scale, tight tracking): Page-level hero states, onboarding moments, empty state headers. Used sparingly.
- **Headline** (medium weight, clamp 1.5–2.5rem, ~1.2 line-height): Section headers, modal titles, dashboard panel names.
- **Title** (medium weight, ~1.125rem, ~1.35 line-height): Card titles, task names, thread subjects. The most common heading scale.
- **Body** (regular weight, 1rem / 16px, 1.5 line-height): Task descriptions, comment threads, prose content. Max line length 65–75ch.
- **Label** (medium weight, 0.75rem, ~0.02em letter-spacing): Tags, status chips, metadata rows, timestamps. Never all-caps as a system default.

### Named Rules
**The Serif Restraint Rule.** The display serif appears only at display and headline scale. It is never used for body copy, labels, or UI text smaller than 1.25rem. Its job is presence at large scale; it becomes illegible decoration below that threshold.

## 4. Elevation

Flat by default. Surfaces rest at zero elevation; shadow is a response to interaction state (hover, drag, open modal), not a default decoration. Depth is conveyed primarily through tonal layering (Background → Surface → elevated panel) and generous spacing, not shadow stacks.

When shadows appear, they are ambient and diffuse — never the sharp drop-shadow of 2014 UI. A single `box-shadow` level is the maximum for most components. Modal backdrops use a semi-opaque overlay, not a blur.

**The Flat-By-Default Rule.** Cards and panels have no shadow at rest. A shadow appears on hover (drag affordance) or when a panel is actively elevated above the canvas (floating dropdowns, active modals). Ambient blur is prohibited as a surface treatment.

## 5. Components

*[Components to be documented on first /impeccable document scan-mode pass once code exists. Core components expected: primary button, ghost button, task row, status chip, input field, top navigation, sidebar navigation, comment thread, avatar stack.]*

## 6. Do's and Don'ts

### Do:
- **Do** use Studio Rose only on interactive affordances — buttons, active states, selection indicators. Its scarcity makes it meaningful.
- **Do** give content generous breathing room. 24px–48px internal padding on cards; 32px+ between sections. The density budget goes to information, not chrome.
- **Do** use the serif display font only at 1.25rem and above. Below that threshold, switch to the sans stack unconditionally.
- **Do** apply `text-wrap: balance` to all h1–h3 headings for even line breaks across screen widths.
- **Do** provide `:focus-visible` rings for all interactive elements — high-contrast, 2px minimum, using the primary or accent color. Never suppress focus rings.
- **Do** accompany every animation with a `@media (prefers-reduced-motion: reduce)` alternative (crossfade or instant swap).
- **Do** ensure body text meets 4.5:1 contrast vs background at all times (WCAG 2.1 AA). Muted text must meet 3.5:1 minimum.

### Don't:
- **Don't** use dark mode with purple gradients or neon accents. This product is not a crypto dashboard or a developer-tool landing page. The anti-reference is immediate and recognizable.
- **Don't** use glassmorphism or backdrop-filter blur as a surface treatment. Cards and panels are flat and opaque. Blur is never decorative.
- **Don't** use a cream, sand, beige, or warm-tinted body background. The background is pure white; warmth lives in the primary color.
- **Don't** create Jira — dense tables with 8px padding, microscopic labels, no hierarchy, no breathing room. Every screen should pass the "40-minutes-into-a-sprint-review" test: scannable at a glance.
- **Don't** use `border-left` or `border-right` wider than 1px as a colored accent stripe on cards or list items. Use a full background tint, a leading icon, or nothing.
- **Don't** apply gradient text (`background-clip: text`). Color emphasis is weight, size, or the primary/accent fill — never a gradient.
- **Don't** put identical-sized icon + heading + text cards in an endless grid. That's the default AI scaffold. Use genuine hierarchy and vary card weight based on information importance.
- **Don't** use Monday.com-style multi-color column headers or ClickUp-style color overload. Color in this system has one voice (Studio Rose) plus one support (Periwinkle Dusk). Everything else is neutral.
