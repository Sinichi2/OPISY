---
version: beta
name: "Pan"
description: "Pan is the inventory and orders workspace for Pannzian, a tropical resort. The interface keeps the warm peach canvas of the resort brand but reads as an editorial document: hairline dividers, generous whitespace, no heavy shadows, no pill product-badges. Body text is ElliotSans on the peach ground; headings use Newsreader in a deep roasted brown. Numbers, keystrokes, and monetary values are set in JetBrains Mono. Color enters only through low-chroma status washes."
colors:
  peach-surface: "#ffeace"
  ivory-surface: "#fbf4e2"
  paper-surface: "#fffcf5"
  white-surface: "#ffffff"
  brown: "#8f7158"
  brown-deep: "#5a4633"
  brown-darkest: "#3f3223"
  charcoal-text: "#1f1a15"
  ink-text: "#3b332b"
  mid-text: "#6c635a"
  muted-text: "#9a9088"
  hair: "rgba(90,70,51,0.16)"
  hair-strong: "rgba(90,70,51,0.28)"
  link-brown: "#6b5033"
  warn-bg: "#f6e2ba"
  warn-fg: "#7a4f16"
  info-bg: "#e4dceb"
  info-fg: "#4a3f6b"
  ok-bg: "#dde6d5"
  ok-fg: "#3d5a34"
  done-bg: "#ece6dd"
  done-fg: "#5c554e"
  danger-bg: "#f4d3d0"
  danger: "#8a2b26"
typography:
  body-default:
    fontFamily: "ElliotSans"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "26px"
  body-small:
    fontFamily: "ElliotSans"
    fontSize: "12.8px"
    fontWeight: "400"
    lineHeight: "19.2px"
  body-medium:
    fontFamily: "ElliotSans"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "21px"
  body-large:
    fontFamily: "ElliotSans"
    fontSize: "20px"
    fontWeight: "400"
    lineHeight: "30px"
  label-bold:
    fontFamily: "ElliotSans"
    fontSize: "19.2px"
    fontWeight: "700"
    lineHeight: "28.8px"
  micro-uppercase:
    fontFamily: "ElliotSans"
    fontSize: "12.8px"
    fontWeight: "500"
    lineHeight: "16px"
    letterSpacing: "0.14em"
  page-heading-h1:
    fontFamily: "Newsreader"
    fontSize: "35px"
    fontWeight: "400"
    lineHeight: "42px"
    letterSpacing: "-0.02em"
  section-heading-h2:
    fontFamily: "Newsreader"
    fontSize: "30px"
    fontWeight: "400"
    lineHeight: "36px"
    letterSpacing: "-0.02em"
  mono-numeric:
    fontFamily: "JetBrains Mono"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "20px"
rounded:
  badge: "2px"
  button: "4px"
  card: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
  3xl: "96px"
components:
  chip-status:
    padding: "2px 8px"
    fontSize: "12.8px"
    fontWeight: "500"
    letterSpacing: "0.08em"
    textTransform: "uppercase"
    rounded: "{rounded.button}"
    variants:
      warn:   { backgroundColor: "{colors.warn-bg}",   textColor: "{colors.warn-fg}" }
      info:   { backgroundColor: "{colors.info-bg}",   textColor: "{colors.info-fg}" }
      ok:     { backgroundColor: "{colors.ok-bg}",     textColor: "{colors.ok-fg}" }
      done:   { backgroundColor: "{colors.done-bg}",   textColor: "{colors.done-fg}" }
      danger: { backgroundColor: "{colors.danger-bg}", textColor: "{colors.danger}" }
  button-primary:
    backgroundColor: "{colors.brown-deep}"
    textColor: "{colors.paper-surface}"
    borderColor: "{colors.brown-deep}"
    borderWidth: "1px"
    padding: "10px 20px"
    fontSize: "14px"
    fontWeight: "500"
    rounded: "{rounded.button}"
    hoverBackground: "{colors.brown-darkest}"
    activeTransform: "scale(0.985)"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-text}"
    borderColor: "{colors.hair-strong}"
    borderWidth: "1px"
    padding: "8px 14px"
    fontSize: "12.8px"
    fontWeight: "500"
    rounded: "{rounded.button}"
    hoverBorderColor: "{colors.brown-deep}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.mid-text}"
    padding: "4px 8px"
    fontSize: "12.8px"
    textTransform: "uppercase"
    letterSpacing: "0.04em"
    hoverTextColor: "{colors.brown-deep}"
  field-editorial:
    backgroundColor: "transparent"
    textColor: "{colors.ink-text}"
    borderBottom: "1px solid {colors.hair-strong}"
    borderRadius: "0px"
    padding: "8px 0"
    fontSize: "14px"
    focusBorderBottom: "1px solid {colors.brown-deep}"
  card-hairline:
    backgroundColor: "{colors.paper-surface}"
    borderColor: "{colors.hair}"
    borderWidth: "1px"
    rounded: "{rounded.card}"
    padding: "16px"
  table-editorial:
    headerBorderBottom: "1px solid {colors.hair-strong}"
    rowBorderBottom: "1px solid {colors.hair}"
    headerFontSize: "12.8px"
    headerTextTransform: "uppercase"
    headerLetterSpacing: "0.14em"
    headerTextColor: "{colors.muted-text}"
    rowHoverBackground: "{colors.ivory-surface}"
  navigation-desktop-nav-bar:
    backgroundColor: "rgba(255,234,206,0.85)"
    backdropFilter: "blur(6px)"
    textColor: "{colors.ink-text}"
    borderBottom: "1px solid {colors.hair}"
    padding: "16px 24px"
    fontSize: "14px"
    fontFamily: "ElliotSans"
    fontWeight: "400"
  navigation-active-nav-item:
    textColor: "{colors.brown-deep}"
    underline: "1px solid {colors.brown-deep}"
    padding: "4px 0"
  modal-editorial:
    backgroundColor: "{colors.paper-surface}"
    borderColor: "{colors.hair}"
    borderWidth: "1px"
    rounded: "{rounded.card}"
    padding: "32px"
    overlayBackground: "rgba(31,26,21,0.4)"
    overlayBlur: "4px"
  heading-h1-section-title:
    fontFamily: "Newsreader"
    fontSize: "35px"
    fontWeight: "400"
    lineHeight: "42px"
    letterSpacing: "-0.02em"
    textColor: "{colors.brown-deep}"
---

## Overview

Pan is Pannzian resort's back-of-house workspace: staff take, prepare, and track orders; owners run inventory and analytics; visitors browse the menu and place orders. The interface lives on the resort's warm peach canvas but is read like an editorial document — no heavy shadows, no pill product-badges, no cards-as-page-structure. Depth comes from hairline dividers and generous whitespace. Color enters only through low-chroma status washes tuned to the peach ground.

**Signature traits:**
- Peach canvas, ivory cards. Full-bleed peach background; forms and cards sit on `#fffcf5` (paper) with a 1px `hair` border, never a drop shadow.
- Editorial serif for headings. Newsreader for H1/H2 in `#5a4633` (roasted brown-deep). ElliotSans for body and UI.
- Mono for money and metrics. JetBrains Mono renders every peso amount, every quantity, every timestamp — anywhere numeric alignment matters.
- Hairline everywhere. Rows, tables, and section separators use a single 1px warm-brown at 16 % alpha (`hair`). Nothing thicker unless it names an active state.
- Micro-uppercase labels. Field labels, chip labels, and section kickers-that-are-not-eyebrows (counts, roles) use 12.8px uppercase at 0.14em tracking.

## Colors

The palette uses 26 validated color tokens across 1 theme profile. Semantic roles stay attached to observed usage so agents can pick accents without inventing new color meaning.

**Semantic naming:**
- **action-solid** maps to `brown-deep`: primary button fill, active nav underline, and headings.
- **content-text** maps to `ink-text`: default body text on peach and paper.
- **surface-canvas** maps to `peach-surface`: page background site-wide.
- **surface-card** maps to `paper-surface`: cards, modals, and elevated surfaces.
- **hairline** maps to `hair`: every 1px divider, table rule, and card border.

### Text Scale
- **Charcoal Text** (#1f1a15): near-black reserved for very high-contrast UI text (rare); prefer `ink-text` for body.
- **Ink Text** (#3b332b): default body text and control text.
- **Mid Text** (#6c635a): secondary text, meta info, quiet button labels.
- **Muted Text** (#9a9088): tertiary text, captions, empty-state copy, table headers.
- **Brown Deep** (#5a4633): headings, primary CTA fill, active nav underline.
- **Brown Darkest** (#3f3223): CTA hover state only.
- **Brown** (#8f7158): decorative brand accent (icons, subtle marks).
- **Link Brown** (#6b5033): text links (used sparingly; most CTAs are buttons).

### Interactive
- **Hair** (rgba(90,70,51,0.16)): default 1px border/divider.
- **Hair Strong** (rgba(90,70,51,0.28)): input underline, table header rule, dashed drop-zone border.

### Surface & Backgrounds
- **Peach Surface** (#ffeace): app canvas.
- **Ivory Surface** (#fbf4e2): row hover, secret/temp-password panel, quiet fills.
- **Paper Surface** (#fffcf5): cards, modals, elevated forms.
- **White Surface** (#ffffff): reserved for imagery frames only.

### Status Washes (low-chroma)
- **Warn** — bg #f6e2ba, fg #7a4f16 — pending, low-stock warnings.
- **Info** — bg #e4dceb, fg #4a3f6b — preparing / in-progress.
- **Ok** — bg #dde6d5, fg #3d5a34 — ready, success, available.
- **Done** — bg #ece6dd, fg #5c554e — served, archived, quiet-neutral.
- **Danger** — bg #f4d3d0, fg #8a2b26 — errors, destructive states.

## Typography

Editorial serif Newsreader carries headings. ElliotSans carries body and UI. JetBrains Mono carries any numeric, monetary, or code value where alignment matters.

### Font Roles
- **Headline Font**: Newsreader
- **Body Font**: ElliotSans
- **Mono Font**: JetBrains Mono

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Body copy, controls, nav | ElliotSans | 16px | 400 | 26px | normal | Default reading size |
| Secondary body / list items | ElliotSans | 14px | 400 | 21px | normal | Compact fields, table cells |
| Fine print, captions | ElliotSans | 12.8px | 400 | 19.2px | normal | Meta info, footnotes |
| Lead paragraph | ElliotSans | 20px | 400 | 30px | normal | Page intro copy |
| Bold label / emphasis | ElliotSans | 19.2px | 700 | 28.8px | normal | Rare — most emphasis uses size, not weight |
| Micro-uppercase label | ElliotSans | 12.8px | 500 | 16px | 0.14em | Field labels, chip labels, meta counts |
| Page heading (H1) | Newsreader | 35px | 400 | 42px | -0.02em | Section titles |
| Section heading (H2) | Newsreader | 30px | 400 | 36px | -0.02em | Panel titles |
| Numeric / monetary | JetBrains Mono | 14px | 400 | 20px | normal | Any ₱, quantity, id, timestamp |

## Layout

Responsive system uses 3 breakpoint tiers: mobile, tablet, desktop. All page shells cap at `max-w-6xl` (72rem) with `max-w-7xl` for the wide inventory table.

### Responsive Strategy
- **mobile (< 640px)**: stack all rows vertically; tables collapse to card-per-row lists.
- **tablet (640–1024px)**: two-column form grids, three-column bento for orders queue.
- **desktop (>= 1024px)**: full table density, three-column workflows, sidebar rail retained.

### Spacing System (8px base, tightened for editorial rhythm)
| Token | Value | Px | Use |
|------|-------|----|-----|
| xs   | 4px   | 4  | Inline gaps in small groups |
| sm   | 8px   | 8  | Compact button padding, form row gaps |
| md   | 16px  | 16 | Default padding inside cards |
| lg   | 24px  | 24 | Section padding, form-column gap |
| xl   | 40px  | 40 | Section-to-section vertical rhythm |
| 2xl  | 64px  | 64 | Large-section separation |
| 3xl  | 96px  | 96 | Hero-to-content separation |

## Elevation & Depth

Depth comes almost entirely from hairline borders and whitespace. No drop shadows on cards, buttons, or modals. Only exceptions:
- Focused/assigned order card gets a 1px inset ring in `brown-deep` (no blur).
- Modal overlay is `rgba(31,26,21,0.4)` + `backdrop-blur(4px)`.

### Interaction Signals
| Signal | Value |
|--------|-------|
| button:active | `transform: scale(0.985)` |
| card:hover (row) | `background: rgba(251,244,226,0.4)` (ivory 40%) |
| focus underline | `border-bottom: 1px solid #5a4633` on `.field` |
| primary hover | `background: #3f3223` |

## Shapes

One consistent corner language across every control and container.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| badge | 2px | 2 | Hairline corner (deprecated — chips now use `button`) |
| button | 4px | 4 | All buttons, chips, cards, images (unless bleeding) |
| card | 4px | 4 | Modal, panel, table wrapper |

No pill shapes (`999px`) anywhere. Status chips are rectangular per the editorial world.

## Components

- **Nav (sticky editorial header)** — Wordmark left, links center on desktop, actions right; active link marked by an underline positioned at the bar's bottom edge. `border-b border-hair`, translucent peach backdrop with blur.
- **Editorial Field** — Zero-radius baseline-underline input on transparent background. Label sits above as `micro-uppercase`. Focused underline shifts to `brown-deep`.
- **Primary Button** — Solid `brown-deep`, paper text, 4px radius, no shadow. Contains an arrow SVG for forward-moving CTAs.
- **Ghost Button** — Transparent, 1px `hair-strong` border, ink text. For secondary "cancel-adjacent" actions.
- **Quiet Button** — No chrome. Uppercase micro-label. For inline row actions ("edit · delete · adjust").
- **Status Chip** — Rectangular 4px, low-chroma paired bg/fg from the status ramp, uppercase, 0.08em tracking. Never a pill.
- **Hairline Table** — No wrapping card, no zebra stripes. Header row = 1px `hair-strong`; body rows = 1px `hair`; row hover = 40% ivory.
- **Bento Panel** — Section = H2 in Newsreader with 1px `hair` underline. Content sits below with no wrapping box.
- **Order Card** — Ivory-hairline card with mono queue number, JetBrains Mono peso total, single micro-uppercase status chip. Notes render as inline italic, no left border.
- **Progress Stepper (My Order)** — Four-node horizontal line: placed → cooking → ready → served. Active nodes fill in `brown-deep`.
- **Icon System** — Inline SVGs from `frontend/components/Icon.tsx`. Phosphor-adjacent bold stroke, `strokeWidth: 1.5`, `strokeLinecap/join: round`. No emoji glyphs anywhere in UI.
- **Charts (recharts)** — Axes and grids read colors from CSS variables at runtime so no literal color drifts. Line strokes at 1.5px, dashed for secondary series, radial dots off.

## Do's and Don'ts

| Do | Don't |
|----|---------|
| Use hairline dividers between sections instead of card walls | Don't add drop shadows to cards, buttons, or modals |
| Set money, quantities, and IDs in JetBrains Mono | Don't set body copy in monospace as a "technical" costume |
| Use status chips only for tags/badges; rectangular, 4px | Don't use pill (999px) radius anywhere |
| Let the H1 speak for itself; introduce sections with an H2 + hairline underline | Don't add an eyebrow / kicker line above any heading |
| Reach for `btn-quiet` for inline row actions | Don't use colored `border-left` accents thicker than 1px |
| Use the SVG icon set for every icon | Don't use unicode glyphs (☰ ✕ ✓ +) as icons |

## Agent Prompt Guide

### Example Component Prompts
- Create Status Chip variant in `warn` tone — rectangular 4px, uppercase 12.8px, `warn-bg` on `warn-fg`.
- Create Hairline Table variant — no wrapper card, header row uses `hair-strong`, body rows `hair`, right-aligned actions collapse to `btn-quiet` dot-separated on mobile.
- Create Bento Panel — H2 in Newsreader, 1px `hair` underline, content follows without card chrome.

### Iteration Guide
1. Start on the peach canvas; never introduce a new background.
2. Reach for a hairline before a card, and a card before a shadow.
3. Set every number in `.font-mono`.
4. Use only the five status washes for color meaning — never a raw hue.
5. Replace every unicode glyph with a component from `Icon.tsx`.
