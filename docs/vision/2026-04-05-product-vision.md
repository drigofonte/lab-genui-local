---
date: 2026-04-05
status: draft
---

# GenUI Local — Product Vision

## What We Proved

The spike validated the core generative UI loop: a user types a natural language prompt, a local LLM produces structured JSONL patches, and React components render progressively in the browser. Key findings:

- Local models (7-70B) can reliably produce structured UI specs with the right system prompt
- json-render's JSONL patch streaming enables progressive rendering as the LLM generates
- The entire stack runs locally — no cloud backend, no API keys, no data leaving the device
- Thinking models work with streaming — the UX shows reasoning phase before content appears

The technology works. The question is now: **what product should this become?**

---

## Target Use Case: People Capacity Management

Inspired by [Runn.io](https://www.runn.io/) — a tool for resource planning, team allocation, and capacity forecasting.

**Why this use case:**
- High-value, underserved niche for team leads in regulated environments (the research doc's target)
- Naturally data-driven — schedules, allocations, utilisation rates, forecasts
- Requires multiple view types (timeline, table, metrics, charts) — exercises the full component catalog
- Real pain: most teams use spreadsheets because purpose-built tools are expensive or cloud-only
- Local-first is a genuine advantage — HR/capacity data is sensitive and often can't leave the org

**What "capacity management via generative UI" means:**
- Connect to your team data (spreadsheet, CSV, or future integrations)
- Ask natural language questions: "Show me who's overallocated in Q2", "What happens if we move the launch to June?", "Show utilisation by team for the last 3 months"
- Get rendered dashboards, tables, and charts that answer the question
- Pin the views you use daily — they become your personal capacity management tool
- Data stays local. Always.

---

## Product Layers

### Layer 1: Foundation (build next)

The technical base that every feature depends on.

| Area | What | Why |
|------|------|-----|
| **Framework** | React Router + TanStack Query | Multi-page app structure, data fetching/caching |
| **UI system** | Radix primitives + atomic design components | Consistent, accessible component library the LLM generates against |
| **Data layer** | Bring-your-own-data (CSV/JSON import, Google Sheets URL) | Without real data, every generated UI is a demo |
| **Persistence** | Pinned views in IndexedDB | Users must be able to save and return to generated UIs |
| **Config** | In-app settings (model selector, connection config) | No more editing TypeScript files |

### Layer 2: Intelligence (build after foundation)

What makes the tool smart, not just a renderer.

| Area | What | Why |
|------|------|-----|
| **Memory system** | Capture daily interactions → consolidate into long-term memory | The tool should learn your team structure, naming conventions, common queries — not start from zero every session. Inspired by compound engineering's memory approach: per-session observations auto-consolidated into durable context |
| **Conversational refinement** | Multi-turn prompt history with spec diffing | "Add a filter for Q2" shouldn't require re-describing the entire dashboard |
| **Data sync** | Keep rendered views in sync with source data. Explore zero-copy patterns — the app references the original data source rather than importing a snapshot. When the spreadsheet updates, the view reflects it | Stale data destroys trust faster than anything else |
| **Few-shot examples** | Auto-assembled from the component catalog | Dramatically improves LLM reliability on structured output |

### Layer 3: Design System (build alongside foundation)

How generated UIs look and compose.

| Area | What | Why |
|------|------|-----|
| **Every Layout primitives** | Intrinsically responsive layout system (Stack, Center, Cluster, Sidebar, Switcher, Cover, Grid) inspired by Heydon Pickering | LLM doesn't decide breakpoints — layouts adapt automatically. Fewer decisions = fewer failure modes |
| **Atomic design components** | Atoms → Molecules → Organisms hierarchy. The LLM composes atoms into molecules, molecules into organisms | Gives the LLM a structured vocabulary. Instead of generating arbitrary HTML, it composes from a well-defined set of building blocks |
| **Storybook / component registry** | Expose the component catalog as a browsable reference. Possibly let the LLM query Storybook for component documentation and examples | The LLM generates better output when it can "see" what components look like and how they're used |
| **Design tokens** | Spacing, color, typography as configurable tokens | Consistent visual language across all generated UIs |

### Layer 4: Platform (future — don't build yet)

Where this could go if Layers 1-3 prove out.

| Area | What | Why |
|------|------|-----|
| **App pinning + home screen** | Pin your most-used generated views. Set one as your "home" — the app opens to your capacity dashboard every morning | Transforms from a generation tool into a personal app |
| **Self-service app hosting** | Share your generated apps publicly or within a team. Like Mural boards or Pinterest — others can use, fork, and remix | Network effects. Your generated capacity planner becomes a template others build on |
| **Micro-economy** | Creators get paid based on usage of their shared apps. A marketplace of generated tools | Incentive layer that funds content creation and drives the platform |
| **Offline-first distribution** | Tauri packaging for USB/air-gapped deployment | The research doc's enterprise play — distributed on a USB drive, runs without network |

---

## Key Technical Questions

### Data Sync and Zero-Copy

The hardest unsolved problem. Options to explore:

1. **Snapshot + manual refresh** (simplest): Import data once, user clicks "Refresh" to re-import. The view re-renders against fresh data. No sync, just replacement.
2. **Polling**: Periodically re-fetch from the data source (Google Sheets CSV endpoint, local file watcher). Views auto-update.
3. **Zero-copy via virtual file references**: The app doesn't copy the data — it holds a reference to the source (File System Access API for local files, URL for remote). DuckDB-WASM queries the source directly. Views are always against live data.
4. **CRDT-based sync** (future): For multi-device scenarios. Research doc defers this to V2.

For MVP: start with snapshot + manual refresh. Explore zero-copy via File System Access API as a fast follow.

### Memory System

Inspired by compound engineering's memory approach:

1. **Session capture**: Each generation session records: prompts used, data sources connected, views pinned, model used, success/failure rate
2. **Daily consolidation**: At end of day (or on app close), auto-summarise session into durable memory: "User works with a 50-person engineering team. Common queries: utilisation by team, overallocation alerts, quarterly capacity forecast. Prefers Grid layouts with Metric cards."
3. **Long-term context**: Consolidated memory is injected into the system prompt on next session. The tool remembers your team structure, naming conventions, and preferred visualisations.
4. **Memory management**: User can view, edit, and delete memory entries. Privacy-first — all memory is local.

### Atomic Design + LLM Guidelines

The LLM needs guardrails for composing UI:

1. **Component hierarchy**: Define which components can contain which (e.g., a Card can contain Metrics but not another Card)
2. **Composition rules**: "A dashboard should have a Heading, a Grid of Metric cards, then detailed views below"
3. **Data binding patterns**: "When showing tabular data, use Table. When showing a single KPI, use Metric. When comparing categories, use BarGraph."
4. **Storybook integration**: The LLM could query a Storybook instance to discover available components, their props, and visual examples — making the catalog self-documenting

---

## Sequencing Recommendation

```
Spike (done)
  │
  ├─► Foundation: React Router + TanStack + Radix + CSV import + pinned views + config panel
  │
  ├─► Design System: Every Layout primitives + atomic components + few-shot examples
  │
  ├─► Intelligence: Memory system + conversational refinement + data sync
  │
  └─► Platform: App hosting + sharing + micro-economy (only if Layers 1-3 prove out)
```

Foundation and Design System can be built in parallel. Intelligence builds on both. Platform is a business decision, not a technical one.

---

## What This Is NOT

- Not a general-purpose AI chat app
- Not a low-code platform (the LLM generates, the user refines — no drag-and-drop builder)
- Not a cloud service (local-first is the core differentiator, not a compromise)
- Not a replacement for Runn.io (it's a local, AI-powered complement for teams who can't or won't use cloud tools)
