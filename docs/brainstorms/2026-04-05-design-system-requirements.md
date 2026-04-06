---
date: 2026-04-05
topic: design-system-foundation
---

# Design System Foundation: Every Layout + CUBE CSS + Utopia + Design Tokens + Storybook

## Problem Frame

The spike uses raw Tailwind utility classes for layout — both in the app shell and in the LLM-generated UI catalog. This creates two problems:

1. **For the LLM**: Tailwind's infinite utility class vocabulary gives the model too many decisions (which gap class? which breakpoint? which flex direction?). Generation reliability suffers because the decision surface is unbounded.
2. **For the app**: No systematic spacing, typography, or layout scale. Values are hardcoded and inconsistent. Adding new components means inventing sizing decisions each time.

The solution is a coherent design system stack based on established methodologies:

| Layer | Tool | Role |
|-------|------|------|
| **Values** | Design Tokens (JSON) | Single source of truth for colors, sizes, fonts |
| **Scales** | Utopia (fluid type + space) | Fluid responsive scales via CSS `clamp()` — no breakpoints |
| **Layout** | Every Layout primitives | Intrinsic, composable layout components |
| **Methodology** | CUBE CSS | CSS organization: Composition → Utility → Block → Exception |
| **Catalog** | Storybook | Visual component development, documentation, and testing |
| **Philosophy** | "Be the browser's mentor, not its micromanager" |

This dramatically reduces the LLM's decision surface: instead of choosing from infinite CSS possibilities, it composes from a constrained vocabulary of layout primitives + Utopia tokens + data-state exceptions.

## Requirements

**Design Tokens**

- R1. Design tokens defined in a JSON file as the single source of truth for colors, spacing, typography, and other visual attributes
- R2. Tokens consumed by CSS custom properties — the JSON file generates (or directly maps to) CSS custom properties used throughout the app
- R3. Token categories: colors (brand, semantic), spacing (from Utopia scale), typography (from Utopia scale), borders, radii, shadows

**Utopia Fluid Scales**

- R4. Fluid type scale generated via the Utopia calculator — CSS custom properties like `--step-0` through `--step-5` (and negative steps for small text) that scale fluidly between a min viewport (320px) and max viewport (1240px)
- R5. Fluid space scale generated via the Utopia calculator — CSS custom properties like `--space-s`, `--space-m`, `--space-l` (and pairs like `--space-s-l`) that scale fluidly
- R6. Every Layout primitives use Utopia spacing tokens for their `--space` custom property values instead of hardcoded rem/px values

**Every Layout Primitives**

- R7. Implement all core Every Layout primitives as React components: Stack, Box, Center, Cluster, Sidebar, Switcher, Cover, Grid, Frame, Reel
- R8. Each primitive accepts CSS custom property values as props (e.g., `space="var(--space-m)"`) — intrinsic design, no breakpoints
- R9. Primitives compose naturally: Stack inside Sidebar, Cluster inside Box, Grid inside Center — no conflicts
- R10. Primitives registered in the json-render catalog with Zod schemas so the LLM can generate specs using them
- R11. Primitives registered in SimpleRenderer's COMPONENTS map for rendering

**CUBE CSS Methodology**

- R12. CSS organized following CUBE layers: global composition rules first, utility classes second, block-specific styles third, exceptions via data attributes
- R13. Exceptions use `data-state` or `data-variant` attributes (not CSS class modifiers) for component variants — e.g., `<Card data-state="highlighted">`
- R14. Composition classes (like `.flow > * + *` for vertical rhythm) defined globally and available to all components

**Storybook**

- R15. Storybook set up for the project with stories for each Every Layout primitive
- R16. Each primitive story demonstrates: default usage, key prop variations, composition with other primitives
- R17. Data components (Metric, BarGraph, Table, Badge) also have Storybook stories
- R18. Storybook serves as the visual reference catalog for the design system

## Success Criteria

- Every Layout primitive renders correctly with Utopia spacing tokens
- The LLM can generate specs using Every Layout primitives and Utopia tokens — the system prompt vocabulary comes from the design system, not ad-hoc Tailwind classes
- Storybook runs and displays all components with interactive prop controls
- No hardcoded px/rem values in layout components — all sizing references design tokens or Utopia scale values
- CSS follows CUBE methodology: composition → utility → block → exception layers are visibly organized in the stylesheet

## Scope Boundaries

- No Tailwind CSS removal — Tailwind remains available for utility-level styling (colors, borders, typography) alongside CUBE CSS. The goal is to add the design system on top, not replace Tailwind entirely
- No changes to the Ollama adapter, streaming, or json-render patch logic
- No assistant-ui integration (that's the next phase of the UX overhaul plan)
- No app shell restructure — the layout primitives are built and cataloged, but the app shell continues using the current flat layout until the UX overhaul
- Icon and Imposter primitives are optional — include if straightforward, defer if complex

## Key Decisions

- **Full stack approach**: Every Layout + Utopia + Design Tokens + CUBE CSS + Storybook together, not incrementally. These tools are designed to work as a coherent system — implementing them piecemeal loses the composability benefits.
- **Utopia calculator output, not custom formulas**: Use utopia.fyi to generate the CSS custom properties. Simpler, well-tested, and the output is plain CSS that doesn't need a build step.
- **Design tokens in JSON**: A JSON file that maps to CSS custom properties. This is the simplest token format that works for a browser-only app. No Style Dictionary or Theo build pipeline — just JSON → CSS.
- **CUBE CSS alongside Tailwind**: CUBE CSS organizes our custom CSS (composition, blocks, exceptions). Tailwind handles utilities (colors, borders, text). No conflict — CUBE's composition layer and Tailwind's utility layer are complementary.
- **Storybook for development and cataloging**: Storybook is the component workbench during development and the visual catalog afterward. It naturally documents the design system for both humans and (potentially) the LLM.
- **Plain CSS classes (CUBE methodology) for components**: Global composition classes (`.stack`, `.sidebar`, `.cluster`) in `src/index.css`, organized by CUBE layers. Custom properties set via React `style` prop. No CSS Modules (fights CUBE philosophy), no CSS-in-JS (unnecessary runtime). The Switcher's dynamic `nth-child` selector uses a rendered `<style>` element inside the component. Class names are the design system vocabulary — the LLM generates component types that map to these classes.

## Dependencies / Assumptions

- Storybook is compatible with Vite + React 19 (Storybook 8.x supports Vite natively)
- Utopia calculator output is plain CSS that doesn't conflict with Tailwind v4
- Reference implementations in `.every-layout/` are for conceptual guidance only — our implementation will be adapted for React 19, CUBE CSS methodology, and Utopia tokens

## Outstanding Questions

### Deferred to Planning

- [Affects R1][Resolved] Token format: Simple flat JSON with W3C-compatible naming. CSS custom properties are the runtime format. No build step. JSON serves as documentation and single source of truth.
- [Affects R4, R5][Resolved] Utopia settings: 320px-1240px viewport, 16px-20px base font, 1.2 (Minor Third) min ratio, 1.25 (Major Third) max ratio, 5 positive steps + 2 negative steps. Generates --step--2 through --step-5 for type, and --space-3xs through --space-3xl for space.
- [Affects R15][Resolved] Storybook addons: @storybook/addon-essentials (Controls, Docs, Actions, Viewport) + @storybook/addon-a11y. Three story types per primitive: Default, Playground (all props as controls), Composition (nested with other primitives). MDX docs pages explaining when to use each primitive.
- [Affects R10][Technical] How to reconcile the existing shadcn-based Stack/Grid catalog entries with the new Every Layout versions — straight replacement, or aliased names?

## Next Steps

→ `/ce:plan` for structured implementation planning
