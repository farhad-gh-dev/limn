# Limn — Product Requirements Document

> A local, account-free MCP server that turns data into clean, presentation-ready charts — design judgment baked into the defaults.

| | |
|---|---|
| **Project** | Limn |
| **npm package** | `limn-mcp` (CLI/bin: `limn`) · *see [§3 Naming & Identity](#3-naming--identity)* |
| **Document** | PRD v1.0 |
| **Owner** | Farhad (farhad.dev.contact@gmail.com) |
| **Date** | 2026-06-11 |
| **Status** | Approved — build target **v1.0** |
| **License** | MIT (open-source, free) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision, Strategy & Business Model](#2-vision-strategy--business-model)
3. [Naming & Identity](#3-naming--identity)
4. [Problem & Motivation](#4-problem--motivation)
5. [Target Users & Personas](#5-target-users--personas)
6. [Use Cases & User Stories](#6-use-cases--user-stories)
7. [Competitive Landscape](#7-competitive-landscape)
8. [Goals & Non-Goals](#8-goals--non-goals)
9. [Design Principles](#9-design-principles)
10. [Product Requirements](#10-product-requirements)
11. [The Design System (the moat)](#11-the-design-system-the-moat)
12. [Technical Requirements](#12-technical-requirements)
13. [Functional Requirements (per tool)](#13-functional-requirements-per-tool)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Success Metrics & Definition of Done](#15-success-metrics--definition-of-done)
16. [Adoption & Distribution Plan](#16-adoption--distribution-plan)
17. [Testing & Evaluation](#17-testing--evaluation)
18. [Milestones & Roadmap](#18-milestones--roadmap)
19. [Risks & Mitigations](#19-risks--mitigations)
20. [Resolved Decisions](#20-resolved-decisions)
21. [Appendix A — Representative Schema](#appendix-a--representative-schema)
22. [Appendix B — Glossary](#appendix-b--glossary)

---

## 1. Executive Summary

**Limn** is a Model Context Protocol (MCP) server that lets an LLM (Claude Desktop, Cursor, VS Code, and any MCP client) turn data into well-designed charts. It exposes a small, curated set of chart tools. Each tool takes **data plus a few semantic encodings** — never raw rendering config — and returns a finished chart in three forms: a **PNG** image, an editable **SVG**, and the **resolved spec** used to produce it.

The defining product decision is **constraint as the product**: like Datawrapper, Limn exposes very few styling knobs and makes it nearly impossible to produce an ugly chart. Quality comes from defaults — typography, color, spacing, labeling, formatting — that the model never has to reason about.

Everything runs **locally**: no hosted rendering service, no third-party account, no data leaving the machine.

**The wedge, in one sentence:** clean defaults + fully local + zero-account + a genuinely better design system than the current "clean" entrant.

**This release targets a complete v1.0** (see [§18](#18-milestones--roadmap)), built in the phased order v0.1 → v1.0, and ships free under an MIT license.

---

## 2. Vision, Strategy & Business Model

### 2.1 Vision

> Make "ask an LLM for a chart" produce something you'd put in a board deck — without the user, or the model, touching a single style knob.

The long-term vision is to be the **default design layer for LLM-generated charts**: the server people install precisely because they don't want to think about visual design, and trust that whatever comes out will look professional and stay private.

### 2.2 Strategic positioning

Limn competes on **design judgment and privacy**, not feature breadth. The market is crowded with chart MCP servers, but they fall into two buckets — those that surface a charting library's default look, and those that phone home. Limn is positioned in the gap: *design-first, local-only, account-free.* Every product and engineering decision is subordinate to that positioning. When in doubt, we remove a knob, not add one.

### 2.3 Business model & licensing

Limn is **open-source and free**, released under the **MIT license** (permissive, maximal adoption; Apache-2.0 is the fallback if an explicit patent grant becomes desirable). Rationale: an MCP server's value compounds with adoption and registry presence, and the "local, account-free" ethos is incompatible with gated access. Free + permissive is how this category spreads.

**Sustainability (non-blocking, post-v1.0).** The free, local core is never compromised. Optional future revenue paths that do *not* require phoning home or an account:

- **Premium theme packs / brand presets** — additional themes beyond the bundled `light`/`dark`/`print`.
- **Domain packs** — opinionated presets for financial reporting, scientific figures, etc. (already noted as "future" in the roadmap).
- **GitHub Sponsors** for ongoing maintenance.

These are explicitly out of scope for v1.0 and listed only to confirm that the OSS-free stance does not foreclose a later open-core path.

---

## 3. Naming & Identity

**Chosen name: Limn.** "Limn" is a literary verb meaning *to depict, portray, or draw* — an apt fit for a tool that draws data — and it's short (4 letters) and distinctive. Critically, there is **no other "Limn" MCP server**, so it carries no same-ecosystem confusion.

### 3.1 Availability findings (verified 2026-06-11)

| Asset | Status | Notes |
|---|---|---|
| npm `limn-mcp` | ✅ **Free** | **Chosen package name** — follows the standard MCP `-mcp` convention. |
| npm `limn-charts` | ✅ Free | Alternative. |
| npm `limn` (bare) | ❌ Taken | Unrelated, dormant package (v0.2.2): *"Reactive library for drawing 2D."* Not an MCP server, so no ecosystem collision — and we use `limn-mcp`, not the bare name. |

*Why not the earlier working name, "Folio"? `folio-mcp` is already taken by an unrelated documents/RAG MCP server — a same-ecosystem name-twin that would muddy registry discovery. Limn has no such conflict.*

**Decision:** brand **Limn**, npm package **`limn-mcp`**, CLI command **`limn`**.

> **Honest tradeoff.** Limn's strength — distinctive and uncontested — is also its risk: it's an uncommon word, pronounced /lɪm/ (silent *n*, like "limb"/"hymn"), and many people won't recognize it on sight. That can dampen word-of-mouth and search recall. Mitigation: always pair the name with a plain tagline (e.g., *"Limn — clean charts for LLMs, fully local"*) and let the gallery do the explaining. See risk **R8** in [§19](#19-risks--mitigations).
>
> **One-tap off-ramp (verified free):** **Sightline** (`sightline-mcp`) — plainer and self-explanatory — if Limn's obscurity proves a friction at launch.

### 3.2 Identity to-do (pre-launch)

- [ ] Trademark sanity-check for "Limn" in software/data-viz classes (non-blocking for OSS, but worth a search).
- [ ] GitHub repo: `github.com/farhad-gh-dev/limn` (or `limn-mcp`).
- [ ] Optional domain: `limn.dev` / `getlimn.dev` / `limncharts.com` — confirm availability.
- [ ] Reserve the npm name early (publish a placeholder `0.0.0` to hold `limn-mcp`).

---

## 4. Problem & Motivation

LLMs are good at choosing a chart type and mapping fields, but **bad at visual design**. Existing MCP chart servers reflect this in two ways:

1. **They expose their underlying library's defaults.** Wrapping Chart.js, ECharts, or matplotlib gives you those libraries' default look — functional, but not "designed." The model is then asked to fix aesthetics through deep config objects, which it does poorly and inconsistently.
2. **Many phone home.** The most popular server renders remotely and returns an image URL, which means data leaves the machine unless you self-host a renderer. Others require a third-party account and API token.

**The gap:** a server whose *entire reason to exist* is design quality, delivered locally with no account. Limn fills it.

---

## 5. Target Users & Personas

Limn serves people who generate charts *through* an LLM client and want the output to look professional **without** doing design work themselves.

### P1 — The LLM-assisted analyst/developer *(primary)*
Works inside Claude Desktop, Cursor, or VS Code. Has data on hand (CSV, SQL results, JSON, a dataframe). Asks the model to "chart this" and wants something they can paste into a deck, doc, or PR **without manual restyling**.
- **Pain:** existing servers produce library-default-looking charts or require fiddly config the model gets wrong.
- **Win with Limn:** clean output on the first try; refine by re-prompting ("highlight Q4").

### P2 — The privacy-constrained professional *(primary, sharp differentiator)*
Handles sensitive data — finance, health, internal metrics — and **cannot** send it to a hosted renderer. Often behind a firewall or offline.
- **Pain:** the dominant chart MCP phones home; compliance forbids it.
- **Win with Limn:** zero network calls, verifiable offline. No account, no token.

### P3 — The editorial/content creator *(secondary)*
Writes reports, newsletters, internal memos. Values title/subtitle/source lines, direct labeling, and "highlight one thing."
- **Win with Limn:** editorial framing is first-class, not an afterthought.

### Anti-personas (explicitly **not** the target)
- **BI/dashboard builders** who need multi-chart layouts, filters, cross-filtering → that's Vizro's space.
- **Power users who want pixel-level control** over fonts, gridlines, ticks → Limn deliberately withholds those knobs.
- **Interactive/animated viz needs** → out of scope for v1 (static SVG/PNG only).

---

## 6. Use Cases & User Stories

**Core "data in → designed chart out":**
- *As an analyst,* I want to say "chart revenue by region" and get a clean, value-sorted bar chart with a zero baseline and direct labels, **so that** I can drop it into a deck immediately.
- *As a developer,* I want "plot latency over the last 30 days for each service" to produce a multi-series line chart with end-of-line labels instead of a legend, **so that** it reads at a glance.

**Signature / "designed" charts (the reasons to choose Limn):**
- *As a founder,* I want "show the before/after of the pricing change" to produce a **slope chart**, **so that** the direction of change is the message.
- *As a finance user,* I want "build a P&L bridge" to produce a **waterfall**, **so that** increases/decreases/totals are color-coded and correct.
- *As an analyst,* I want "compare 2019 vs 2024 by category" to produce a **dumbbell plot**, **so that** the gap per category is obvious.

**Editorial refinement (the resolved-spec loop):**
- *As a user,* after seeing a bar chart, I want to say "now highlight just the Q4 bar," **so that** the tool re-renders from the prior spec plus one change instead of regenerating from scratch.
- *As a user,* I want to add a subtitle and source line by asking, **so that** the chart reads as professionally framed.

**Privacy:**
- *As a compliance-bound professional,* I want to generate charts from sensitive data while **fully offline**, **so that** no data ever leaves my machine — and I can prove it.

**Escape hatch:**
- *As an advanced user,* I want to hand the model a themed Vega-Lite spec for a chart type outside the hero set, **so that** I still get Limn's look on a long-tail chart.

---

## 7. Competitive Landscape

Research into the MCP ecosystem (PulseMCP, Glama, Smithery, awesome-mcp lists, GitHub) shows a crowded field. Limn is positioned deliberately against it:

| Competitor | Approach | How Limn differs |
|---|---|---|
| **antvis/mcp-server-chart** (~4K★, dominant) | 25+ tools; renders on a hosted service, returns image URL | Local-only (no phone-home); far smaller, more opinionated tool surface; design-first defaults |
| **mckinsey/vizro-mcp** (~3.4K★) | Validated Plotly dashboards, PyCafe links | Limn targets polished **single** charts, not BI dashboards; no account/preview-host dependency |
| **Charta MCP** (small, recent) | "Beautiful, presentation-ready" SVG/PNG, themes | Closest by positioning. Limn out-positions with a **sharper opinion** (fewer knobs) and a rigorous, colorblind-safe design system |
| **datawrapper-mcp** | Wraps Datawrapper | Inherits a great look but needs a Datawrapper account/token and their branding; Limn is self-contained and account-free |
| **Vega-Lite servers** (several, small) | Return Vega-Lite spec / PNG | Raw Vega-Lite defaults aren't beautiful; Limn's wedge is a custom theme on top so output looks designed by default |

**Defensibility (the moat):** the design system + the resolved-spec refinement loop + the signature chart types. These are hard to copy *as a coherent opinion*, even though any individual piece is replicable.

---

## 8. Goals & Non-Goals

Because Limn is an opinionated tool, the non-goals are as important as the goals.

### Goals
- Produce charts that look professionally designed **with zero styling input** from the model.
- Run locally via `npx` with **no account, no API key, and no network calls**.
- Keep the tool surface small (~8 chart tools) so the model reliably picks the right one.
- Return editable SVG and the resolved spec so charts can be refined and re-rendered.
- Ship a coherent, accessible (colorblind-safe) design system.

### Non-Goals
- **Not a configuration engine.** No exposed font choice, gridline styling, tick controls, per-element colors, padding, or theme internals.
- **Not a dashboard/BI tool.** No multi-chart layouts, filters, or cross-filtering.
- **Not a charting-library wrapper that surfaces the library's full API.** The library is an implementation detail, hidden behind our schema.
- **Not maximal chart-type coverage.** A curated hero set plus one escape hatch, not 25+ tools.
- **No interactivity/animation** in v1 (static SVG/PNG only).

---

## 9. Design Principles

1. **Constraint is the product.** Every knob we *don't* expose is a way the output can't be made worse. Default to "no option" unless an option is clearly necessary and safe.
2. **Data in, not config in.** Tools accept records + semantic field mappings (`x`, `y`, `series`). Models are excellent at this and terrible at nested style objects.
3. **Great by default, minimal required fields.** Required inputs are data + one or two encodings. Everything else has an opinionated default.
4. **Editorial framing is first-class.** Title, subtitle, source line, direct labeling, and "highlight one thing" are core features — they account for much of the "this looks professional" effect.
5. **Determinism.** Same input → same output. Bundled fonts, fixed palettes, no system-dependent rendering.
6. **Local and private by construction.** No code path makes a network request.

---

## 10. Product Requirements

### 10.1 Rendering approach

The tool layer is **engine-agnostic**. Tools accept data + encodings + a constrained style object and never expose the rendering engine. Requests route to one of two renderer paths behind a single interface, so the engine can deepen over time without changing the tool contract.

- **Path A — themed Vega-Lite (ship first).** Use `vega` + `vega-lite` to compile a chart (built from our theme + the tool inputs) directly to **SVG**, then rasterize to PNG. This gives axes, scales, legends, and the long tail of chart behavior for free; a single theme file governs the look. Used for the full hero set initially and permanently for the `render_vega_spec` escape hatch.
- **Path B — hand-built D3/SVG generators (differentiation).** For hero chart types, replace Path A with bespoke D3/SVG renderers that control every pixel — direct labeling, annotation placement, editorial layout. More to build/maintain, so reserved for the hero set and swapped in per type as each is tuned.

**Rule:** start every chart on Path A; migrate hero types to Path B individually. The tool schema is unaware of which path served a request.

**Constraints that hold for both paths:**
- **No headless browser.** Rasterize SVG → PNG with a Rust-backed rasterizer (**`resvg-js`**, see [§12](#12-technical-requirements)). Puppeteer/Chromium is explicitly disallowed: heavy, slow, unreliable under stdio/MCP, and it breaks clean `npx` install.
- **Bundle and embed the font.** Ship **Inter** and embed it in the SVG so output is deterministic and never falls back to host fonts. The model cannot choose fonts.

### 10.2 Output contract

Every chart tool returns three artifacts:

1. **PNG (base64)** — returned as an MCP image content block so it renders inline in every client.
2. **SVG (text)** — crisp, scalable, web-embeddable, editable.
3. **Resolved spec** — the full spec actually used to render.

The resolved spec is the mechanism that makes refinement work: *"now highlight the second bar"* re-calls the tool with the prior spec plus the change, instead of regenerating from scratch. Few competitors do this and it materially improves the iteration loop.

### 10.3 Tool surface

Roughly **8 chart tools + 1 escape hatch + 1 (deferred) advisor**, organized around the decision the model actually makes (data shape / the question), not one-tool-per-chart-type.

**Curated hero set**
1. `bar_chart` — vertical/horizontal/grouped/stacked via params; auto-sorts by value; zero baseline.
2. `line_chart` — multi-series, optional area fill.
3. `scatter_plot` — optional size/color encodings (covers bubble charts without a separate tool).
4. `distribution` — histogram / box / density behind one tool.
5. `part_to_whole` — donut or stacked bar; schema discourages too many slices.

**Signature "designed" charts** (things generic libraries do badly — they signal quality and give people a reason to choose this server)

6. `slope_chart` — two-point before/after comparison.
7. `dumbbell_plot` — paired values per category.
8. `waterfall` — build-up / bridge.

**Escape hatch**
- `render_vega_spec` — accepts themed Vega-Lite **JSON** for anything outside the hero set, run through our theme. Vega-Lite specifically because it's pure JSON that passes cleanly across the tool boundary and models generate it reliably (Observable Plot would require evaluating arbitrary JS — awkward and a security smell).

**Optional advisor — deferred to v1.1** *(see [§20](#20-resolved-decisions))*
- `suggest_chart(data_preview, question)` — recommends a chart type and the tool to call. Improves selection measurably but adds surface; deferred until eval data justifies it.

**Theming is a parameter on every tool, not a separate stateful tool** — keeps the surface flat and avoids hidden state.

### 10.4 Schema design

This is where chart servers live or die.

- **Data in, not config in.** `data` is an array of records; fields referenced by name (`x`, `y`, `series`).
- **Minimal required fields.** Required = data + one or two encodings.
- **Per-type schemas encode the right data shape**, so the tool description teaches the model when to use it (e.g., a slope chart requires exactly two time points).
- **A small, closed `style` object** exposing only knobs that cannot make a chart ugly: `theme`, `accentColor`, `width`/`height`, `title`/`subtitle`/`source`. **Deliberately no** font, gridline, or tick micro-controls.

`highlight` and `valueLabels` are the editorial moves (emphasize one thing; label directly instead of forcing the eye to a legend) that make output read as *designed*. They are first-class across tools where they apply. See [Appendix A](#appendix-a--representative-schema) for an illustrative schema.

---

## 11. The Design System (the moat)

This is where "clean" is won or lost — all in defaults the model never touches. The specifics below are the **starting opinion**; they may be tuned during visual-regression review, but the *rigor* is non-negotiable.

- **Color**
  - **Categorical:** one colorblind-safe palette based on the **Okabe-Ito** 8-color set (the recognized standard for categorical distinguishability across deuter/protan/tritan vision).
  - **Sequential:** a perceptually-uniform ramp (**Viridis**-family) for continuous data.
  - **Diverging:** a colorblind-safe diverging ramp (e.g., blue ↔ grey ↔ orange) for signed/centered data.
  - **Accent + mute:** a single accent color drives the "highlight one thing" pattern; everything non-highlighted falls to muted grays.
- **Direct labeling over legends** wherever layout allows (end-of-line labels, on-bar values).
- **Restraint by default:** thin or no gridlines; no chart borders; no 3D; no drop shadows; generous margins.
- **Typography:** bundled **Inter**, with a fixed type scale (title / subtitle / axis / label / source) — sizes, weights, and line-heights are theme-owned, not user-settable.
- **Smart formatting:** SI / currency / percent number formats; thousands separators; sensible axis tick counts; readable date formatting (via `Intl.NumberFormat` / `Intl.DateTimeFormat` and `d3-format`/`d3-time-format`).
- **Opinionated correctness:** bar axes start at zero; line axes don't unless sensible; bars sort by value; pie/donut slices are capped with the remainder grouped into **"Other."**
- **Editorial framing as first-class:** `title` / `subtitle` / `source` / footnote available on every chart. A real subtitle and a source line are a surprising share of the "professional" effect.
- **Themes:** `light`, `dark`, `print` — each independently contrast-checked (see [§14](#14-non-functional-requirements)).

---

## 12. Technical Requirements

- **Language / SDK:** **TypeScript** with the official **MCP TypeScript SDK** (SDK quality, model familiarity, static typing, clean packaging).
- **Schemas:** **Zod** for input schemas with constraints and example-bearing field descriptions. Define output schemas / structured content where supported.
- **Transport:** **stdio** for local use (primary mode). Optional **streamable HTTP** (stateless JSON) for an optional self-hosted remote mode — still **no third-party calls**.
- **Distribution:** runnable via **`npx` with zero config**; also installable globally. Non-negotiable — install friction kills MCP server adoption.
- **Rendering deps:** `vega` + `vega-lite` (Path A), `d3` modules (Path B), **`resvg-js`** for rasterization, a bundled **Inter** font file.
  - *Rasterizer decision:* **`resvg-js`** (closest SVG fidelity, Rust-backed, deterministic). `sharp` is the documented fallback if font-embedding or packaging issues arise. Confirm `resvg-js` font-embedding behavior during v0.1.
- **No browser dependency.** No Puppeteer / Chromium / Playwright.
- **Network lockdown (privacy by construction):** no code path opens a socket. For the Vega-Lite escape hatch, **the Vega data loader / URL fetching must be disabled** so a spec cannot trigger a network request via `data.url` (see [§13](#13-functional-requirements-per-tool) and [§19](#19-risks--mitigations)).
- **Tool annotations:** all chart tools are `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`.
- **Errors:** actionable messages that guide the model to a fix (e.g., *"field `revenue` not found in data; available fields: …"*).
- **Node version:** target an actively-supported **LTS** (Node 20 or 22).
- **Font license:** **Inter** under **SIL Open Font License 1.1** — redistribution- and embed-safe inside the package and the SVG.

---

## 13. Functional Requirements (per tool)

Each tool must: validate inputs against its Zod schema; apply design-system defaults; render via the active path; and return **PNG + SVG + resolved spec**. Tool-specific default behavior:

- **`bar_chart`** — default vertical; auto-switch to horizontal when category count is high or labels are long; sort by value descending by default; zero baseline always; grouped/stacked via `series`; `highlight` + `valueLabels`.
- **`line_chart`** — multi-series with direct end-of-line labels (preferred over a legend); optional area fill; non-zero y-baseline allowed; sensible date handling on the x-axis.
- **`scatter_plot`** — optional `size` and `color` encodings; sensible point opacity for overplotting; optional reference/trend line.
- **`distribution`** — histogram / box / density via a `kind` param; sensible binning defaults for histograms.
- **`part_to_whole`** — donut or stacked-bar via a param; cap slice count and group remainder into "Other"; direct labels with values/percentages.
- **`slope_chart`** — exactly two categorical time points; line per series connecting them; labeled endpoints; emphasis on direction of change.
- **`dumbbell_plot`** — two values per category drawn as connected dots; sorted by gap or by value; clear labeling of both endpoints.
- **`waterfall`** — running total with start/end totals and signed intermediate steps; color encodes increase/decrease/total; optional connector lines.
- **`render_vega_spec`** — accept Vega-Lite **JSON** only; inject the theme; render through Path A. **Reject** specs that (a) try to override protected theme tokens, or (b) declare remote data (`data.url`) or otherwise require the network. No arbitrary Vega / JS expressions.

---

## 14. Non-Functional Requirements

- **Privacy:** zero network calls in any chart path; no account, key, or login. Verifiable by running offline / with sockets blocked.
- **Performance:** fast cold start (no browser launch); sub-second typical render; small install footprint (track unpacked size — `vega` + `resvg-js` add weight; keep `npx` fast).
- **Reliability:** must work cleanly under stdio in real clients; no flaky native/browser dependencies.
- **Determinism:** identical inputs produce byte-stable SVG (bundled fonts, fixed palettes).
- **Accessibility:** default palettes are colorblind-safe; sufficient text contrast across `light`/`dark`/`print` (WCAG AA — 4.5:1 body, 3:1 large/graphical).
- **Maintainability:** the engine-agnostic interface lets renderers (Path A → Path B) evolve without changing tool schemas.

---

## 15. Success Metrics & Definition of Done

### 15.1 Quality gates (hard — must pass before v1.0 ships)

| Gate | Target |
|---|---|
| **LLM eval suite** | ≥ 90% of ~10 realistic tasks → correct tool selection **and** valid, schema-passing, clean chart |
| **Visual regression** | 100% of per-tool fixtures match approved snapshots (no unintended design drift) |
| **Determinism** | Byte-stable SVG for identical inputs across repeated runs and across OSes (Win/macOS/Linux CI) |
| **Privacy** | Zero sockets opened in any chart path — verified by an offline/network-blocked CI test |
| **Performance** | Cold start < 500 ms; typical render < 1 s; p95 < 2 s for ≤ 5k points |
| **Accessibility** | All default palettes pass deuter/protan/tritan simulation for categorical distinguishability; text contrast ≥ WCAG AA on all three themes |
| **Install** | `npx limn-mcp` works zero-config on a clean machine; unpacked size tracked against a budget |

### 15.2 Definition of done for v1.0

- [ ] All 8 hero tools + `render_vega_spec`, each returning PNG + SVG + resolved spec.
- [ ] Hero types on the best path (Path B where it demonstrably improves output; Path A otherwise).
- [ ] `light` / `dark` / `print` themes finalized; `accentColor` propagation working with accessibility clamping.
- [ ] `render_vega_spec` with theme-token protection **and** network-disabled data loader.
- [ ] Design system complete: Okabe-Ito categorical, Viridis sequential, diverging ramp, formatting, "Other" grouping, zero-baseline rules.
- [ ] Visual-regression + LLM eval suites green in CI; all §15.1 gates met.
- [ ] Docs, README gallery, and per-client install snippets.
- [ ] Published to npm as `limn-mcp`; listed in major MCP registries.

### 15.3 Adoption signals (directional, post-launch — OSS)

These are aspirational indicators of traction, not gates:
- Listed in **PulseMCP, Glama, Smithery, mcp.so, awesome-mcp-servers**, and the **official MCP registry** within ~2 weeks of launch.
- First 90 days (stretch): meaningful GitHub stars and weekly npm downloads; at least one mention in an MCP roundup/newsletter.
- Qualitative: users sharing Limn charts as "this looks designed" — the core promise, observed in the wild.

---

## 16. Adoption & Distribution Plan

In a crowded field, **discoverability and a credible first impression** matter as much as the code.

1. **Zero-friction install.** `npx limn-mcp` with copy-paste config blocks for Claude Desktop, Cursor, and VS Code in the README. (Non-negotiable.)
2. **Registry presence.** Submit to PulseMCP, Glama, Smithery, mcp.so, awesome-mcp-servers, and the official MCP registry. Accurate, chart-specific descriptions aid discovery — doubly important because the uncommon brand name leans on the description to convey what Limn does (see [§3](#3-naming--identity)).
3. **The gallery sells the look.** A README/landing gallery with **side-by-side "Limn vs. raw library default"** images for each hero chart. The visual difference *is* the pitch.
4. **Recipes.** Example prompts per persona ("build a P&L waterfall," "slope chart of before/after"), each with the resulting chart.
5. **Launch surface (optional).** A short write-up (HN / X / dev newsletters) leading with the gallery and the privacy angle.
6. **Privacy as a headline.** "Runs fully offline; your data never leaves your machine" — a differentiator the dominant competitor cannot claim.

---

## 17. Testing & Evaluation

- **MCP Inspector** (`npx @modelcontextprotocol/inspector`) for manual tool/schema verification.
- **Build/type checks** in CI (`tsc`, lint).
- **Visual regression:** render a fixture set per tool and diff SVG/PNG against approved snapshots to catch unintended design drift.
- **LLM evaluations:** a suite (~10) of realistic, independent, verifiable tasks testing whether a model picks the right tool and produces a correct, clean chart from a dataset + a question. Validates that the small tool surface and schema descriptions actually steer the model.
- **Privacy test:** an automated run with the network blocked, asserting every tool still succeeds and no socket is opened.
- **Determinism test:** repeated renders byte-compared across runs and OSes.

---

## 18. Milestones & Roadmap

The deliverable is a complete **v1.0**, built in the phased order below. Each phase is a checkpoint, not a separate release goal.

- **v0.1 — Foundation.** TS + MCP SDK scaffolding; stdio; Path A (themed Vega-Lite → SVG → `resvg-js`); core design system (palette, typography, formatting, defaults); hero set on Path A; PNG + SVG + resolved-spec contract; `npx` distribution.
- **v0.2 — Signature renderers.** Bespoke Path B D3/SVG renderers for `slope_chart`, `dumbbell_plot`, `waterfall` and refined `bar_chart`/`line_chart`; `highlight` + direct-labeling polish; visual regression suite.
- **v0.3 — Theming & escape hatch.** Finalized `light`/`dark`/`print`; `accentColor` propagation + accessibility clamping; `render_vega_spec` with theme-token protection and network-disabled loader; LLM eval suite.
- **v1.0 — Hardening.** Full hero set on Path B where it improves output; docs, README gallery, and examples; registry listings; all §15 gates met. *(Optional in 1.0: self-hosted streamable-HTTP mode.)*
- **Post-v1 (out of scope here):** `suggest_chart` advisor (v1.1); interactivity/animation; brand-theme presets; domain packs (financial reporting, scientific figures); additional chart types as demand proves them.

---

## 19. Risks & Mitigations

| # | Risk | Likelihood / Impact | Mitigation |
|---|---|---|---|
| R1 | **Dominant competitor (antvis) adds local rendering + themes**, eroding the wedge | Med / High | Lean on the *coherent design opinion* + resolved-spec refinement loop + signature charts; these are hard to copy as a whole. Keep the surface smaller and the defaults sharper. |
| R2 | **Closest competitor (Charta) improves its design system** | Med / Med | Out-execute on rigor (Okabe-Ito/Viridis, contrast-checked themes) and ship signature charts (slope/dumbbell/waterfall) they lack; build OSS community + gallery. |
| R3 | **"Design quality" is subjective and hard to prove** | High / Med | Make it objective where possible: visual-regression snapshots, accessibility (colorblind-safe, WCAG AA), and a public before/after gallery. |
| R4 | **Model picks the wrong tool despite the small surface** | Med / Med | Invest in tool descriptions + per-type schemas that teach data shape; tune via the LLM eval suite; ship `suggest_chart` in v1.1 if evals show a gap. |
| R5 | **Cross-platform determinism breaks** (font hinting, rasterizer differences) | Med / Med | Bundle + embed Inter; pin `resvg-js`; byte-stable SVG tests in CI across OSes. Accept that resvg≠browser rendering as long as Limn is self-consistent. |
| R6 | **Vega-Lite escape hatch becomes an exfiltration/SSRF vector** via `data.url` | Low / High | Disable the Vega data loader / URL fetching; accept Vega-Lite JSON only (no arbitrary Vega/JS expressions); reject protected-token overrides. Covered by the privacy CI test. |
| R7 | **Path B maintenance burden** (per-type bespoke renderers) | Med / Med | Phase it; only migrate where Path B beats Path A; keep Path A as a permanent fallback behind the same interface. |
| R8 | **"Limn" is an uncommon word** — hard to spell/pronounce/recall, dampening word-of-mouth and search discovery | Med / Low | Always pair the name with a plain tagline; let the before/after gallery carry recognition; aim SEO at "MCP chart server" / "local chart MCP" rather than the brand. Documented one-tap switch to the self-explanatory **Sightline** (`sightline-mcp`) if it bites ([§3](#3-naming--identity)). |
| R9 | **Install footprint too large** (vega + resvg native bins) for snappy `npx` | Med / Low | Track unpacked size as a gate; trim deps; lazy-load Path B modules; consider per-platform optional deps for the rasterizer. |

---

## 20. Resolved Decisions

The original spec left these open; they are now decided.

| Question | Decision | Rationale |
|---|---|---|
| **Project name** | **Limn** (npm `limn-mcp`, CLI `limn`) | Distinctive and collision-free in the MCP ecosystem ("to depict/draw"); bare `limn` is an unrelated 2D-drawing lib. Earlier working name **Folio** dropped because `folio-mcp` is taken by an unrelated docs MCP. Off-ramp: Sightline. |
| **License / business model** | **MIT**, open-source, free | Maximal adoption; fits local/account-free ethos. Open-core optionality preserved for later (themes/domain packs). |
| **v1 scope** | **Full v1.0** (built v0.1 → v1.0) | Owner's chosen target. |
| **Rasterizer** | **`resvg-js`** (sharp = fallback) | Best SVG fidelity, Rust-backed, deterministic; confirm font-embedding in v0.1. |
| **Bundled typeface** | **Inter** (OFL-1.1) | Redistribution- and embed-safe; deterministic output. |
| **`accentColor` validation** | Accept hex, then **auto-clamp to an accessible, contrast-safe variant** against the theme background (don't reject) | Preserves "can't make it ugly" while honoring user intent. |
| **`suggest_chart` in v1?** | **Deferred to v1.1** | Keep the tool surface minimal; revisit after eval results. |
| **Vega-Lite escape-hatch safety** | Vega-Lite JSON only; **network/data-loader disabled**; protected theme tokens immutable | Preserves the no-network guarantee and theme integrity. |
| **Node version** | Active **LTS** (20/22) | Stability + ecosystem support. |
| **Transport** | **stdio** primary; optional stateless streamable HTTP (still no 3rd-party calls) | Local-first; optional self-host without compromising privacy. |

---

## Appendix A — Representative Schema

Illustrative only; the real schemas are Zod with example-bearing field descriptions.

```ts
bar_chart({
  data: Array<Record<string, string | number>>,   // required
  x: string,            // category field — required
  y: string,            // value field — required
  series?: string,      // optional grouping → grouped/stacked
  layout?: "vertical" | "horizontal" | "stacked" | "grouped",  // default: vertical; auto-horizontal if many categories
  sort?: "value-desc" | "value-asc" | "none",      // default: value-desc
  highlight?: string | string[],   // bars to emphasize with accent; rest muted
  valueLabels?: boolean,            // direct labels on bars
  title?: string, subtitle?: string, source?: string,
  style?: {
    theme?: "light" | "dark" | "print",
    accentColor?: string,           // clamped to an accessible variant
    width?: number, height?: number
  }
})
```

`highlight` and `valueLabels` are the editorial moves (emphasize one thing; label directly instead of forcing the eye to a legend) that make output read as *designed*. They are first-class across tools where they apply.

---

## Appendix B — Glossary

- **MCP (Model Context Protocol):** the open protocol by which LLM clients call external tools/servers.
- **Hero set:** the curated 8 chart tools Limn commits to making excellent.
- **Escape hatch:** `render_vega_spec` — themed Vega-Lite JSON for chart types outside the hero set.
- **Resolved spec:** the full, final spec used to render a chart; returned to the client to enable single-change refinement.
- **Path A / Path B:** themed Vega-Lite renderer (A) vs. bespoke D3/SVG renderer (B), behind one engine-agnostic interface.
- **Direct labeling:** placing values/series labels on the chart (on bars, at line ends) instead of in a separate legend.
- **Okabe-Ito / Viridis:** recognized colorblind-safe palettes — categorical and sequential, respectively.

---

*End of PRD v1.0.*
