---
version: beta
name: "Pan"
description: "Pan is the inventory and orders workspace for Pannzian, a tropical resort. The interface keeps the warm peach canvas of the resort brand but reads as an editorial document: hairline dividers, generous whitespace, no heavy shadows, no pill product-badges. Body text is ElliotSans on the peach ground; headings use Newsreader (with Arbutus Slab as the print-face fallback) in a deeper roasted brown. Numbers, keystrokes, and monetary values are set in JetBrains Mono. Color enters only through low-chroma status washes."
colors:
  peach-surface: "#ffeace"
  white-surface: "#ffffff"
  charcoal-text: "#212529"
  link-blue: "#007bff"
  medium-brown: "#474441"
  muted-gray: "#817f7e"
  warm-brown-heading: "#8f7158"
  near-black: "#000000"
typography:
  body-default:
    fontFamily: "ElliotSans"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "24px"
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
  page-heading-h1:
    fontFamily: "Newsreader"
    fontSize: "35px"
    fontWeight: "400"
    lineHeight: "42px"
  section-heading-h2:
    fontFamily: "Newsreader"
    fontSize: "30px"
    fontWeight: "400"
    lineHeight: "36px"
  mono-numeric:
    fontFamily: "JetBrains Mono"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "20px"
rounded:
  badge: "2px"
  button: "4px"
  card: "9px"
spacing:
  xs: "5px"
  sm: "8px"
  md: "15px"
  base: "16px"
  lg: "20px"
  xl: "35px"
  2xl: "54px"
  3xl: "70px"
components:
  brand-identity-default-logo:
    textColor: "{colors.link-blue}"
    backgroundColor: "rgba(0,0,0,0)"
    rounded: "0px"
    padding: "0px"
  button-navbar-toggle:
    textColor: "rgba(255,255,255,0.5)"
    backgroundColor: "rgba(0,0,0,0)"
    borderColor: "rgba(255,255,255,0.1)"
    borderWidth: "1px"
    rounded: "{rounded.button}"
    padding: "4px 12px"
    fontSize: "20px"
  content-section-centered-editorial:
    backgroundColor: "{colors.peach-surface}"
    textAlign: "center"
    headingFont: "Arbutus Slab"
    bodyFont: "ElliotSans"
    headingColor: "{colors.warm-brown-heading}"
    bodyColor: "{colors.charcoal-text}"
    padding: "70px 35px"
  heading-h1-section-title:
    fontFamily: "Arbutus Slab"
    fontSize: "35px"
    fontWeight: "400"
    lineHeight: "42px"
    textColor: "{colors.warm-brown-heading}"
    rounded: "0px"
    padding: "0px"
  hero-full-bleed-hero:
    width: "100vw"
    objectFit: "cover"
    marginTop: "0px"
    rounded: "0px"
  navigation-active-nav-item:
    borderBottom: "2px solid #212529"
    rounded: "0px"
    padding: "8px 6.4px"
    textColor: "{colors.charcoal-text}"
  navigation-desktop-nav-bar:
    backgroundColor: "rgba(0,0,0,0)"
    textColor: "{colors.charcoal-text}"
    padding: "8px 16px"
    fontSize: "16px"
    fontFamily: "ElliotSans"
    fontWeight: "400"
  third-party-widget-default-badge:
    rounded: "{rounded.badge}"
    boxShadow: "rgb(128,128,128) 0px 0px 5px 0px"
    padding: "0px"
    fontSize: "16px"
---

## Overview

Pannzian is a tropical resort website built on WordPress with a warm, nature-inspired aesthetic. The design uses a soft peach (#ffeace) background, earthy brown heading color (#8f7158), and a clean sans-serif body font (ElliotSans) paired with a decorative serif (Arbutus Slab) for headings. Navigation is minimal and flat with a bottom-border active indicator. Full-bleed photography dominates above-the-fold sections, and content sections use generous whitespace with centered editorial text layouts.

**Signature traits:**
- Dual typeface system: Pairs ElliotSans and Arbutus Slab across the type hierarchy.
- Layered elevation: Depth comes from 1 validated shadow token.

## Colors

The palette uses 8 validated color tokens across 1 theme profile. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **action-text** maps to `charcoal-text`: Role "text" is grounded by usage context "Primary body text, nav links, and general UI text throughout the page".
- **content-text** maps to `warm-brown-heading`: Role "text" is grounded by usage context "H1 headings and decorative heading text, brand-aligned earthy brown".
- **surface-background** maps to `peach-surface`: Role "background" is grounded by usage context "Page background and header/footer surface fill, warm peach tone".
- **border-border** maps to `near-black`: Role "border" is grounded by usage context "Minimal border and outline usage".

### Text Scale
- **Charcoal Text** (#212529): Primary body text, nav links, and general UI text throughout the page. Role: text. {authored: rgb(33, 37, 41), space: rgb}
- **Link Blue** (#007bff): Hyperlinks and interactive link states. Role: text. {authored: rgb(0, 123, 255), space: rgb}
- **Medium Brown** (#474441): Secondary text, footer links, and muted nav items. Role: text. {authored: rgb(71, 68, 65), space: rgb}
- **Muted Gray** (#817f7e): Tertiary text, captions, and subdued footer content. Role: text. {authored: rgb(129, 127, 126), space: rgb}
- **Warm Brown Heading** (#8f7158): H1 headings and decorative heading text, brand-aligned earthy brown. Role: text. {authored: rgb(143, 113, 88), space: rgb}

### Interactive
- **Near Black** (#000000): Minimal border and outline usage. Role: border. {authored: rgb(0, 0, 0), space: rgb}

### Surface & Shadows
- **Peach Surface** (#ffeace): Page background and header/footer surface fill, warm peach tone. Role: background. {authored: rgb(255, 234, 206), space: rgb}
- **White Surface** (#ffffff): Card and content area backgrounds, nav bar fill. Role: background. {authored: rgb(255, 255, 255), space: rgb}

## Typography

Typography uses ElliotSans, Arbutus Slab across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Editorial serif Newsreader carries headings (Arbutus Slab kept as historical fallback). ElliotSans carries body and UI. JetBrains Mono carries any numeric, monetary, or code value where alignment matters. Weight range 400–700. Sizes 12.8px to 35px.

### Font Roles
- **Headline Font**: Newsreader
- **Body Font**: ElliotSans
- **Mono Font**: JetBrains Mono

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Primary body copy, navigation items, and general UI text | ElliotSans | 16px | 400 | 24px | normal | ElliotSans | Extracted token |
| Fine print, captions, and secondary labels | ElliotSans | 12.8px | 400 | 19.2px | normal | ElliotSans | Extracted token |
| Secondary body text and list items | ElliotSans | 14px | 400 | 21px | normal | ElliotSans | Extracted token |
| Lead paragraphs and intro text | ElliotSans | 20px | 400 | 30px | normal | ElliotSans | Extracted token |
| Bold labels, callouts, and emphasized UI text | ElliotSans | 19.2px | 700 | 28.8px | normal | ElliotSans | Extracted token |
| Primary page headings and section titles | Arbutus Slab | 35px | 400 | 42px | normal | Arbutus Slab | Extracted token |
| Secondary section headings | Arbutus Slab | 30px | 400 | 36px | normal | Arbutus Slab | Extracted token |

## Layout

Responsive system uses 3 breakpoint tier(s): mobile, tablet, desktop.

This system uses a 8px base grid with scale values 5, 8, 15, 16, 20, 35, 54, 70.

### Responsive Strategy
- **mobile (480-1199.98px)**: Constrain layout for small viewports and prioritize vertical stacking.
- **tablet (768-1199px)**: Increase spacing and column structure for medium-width viewports.
- **desktop (>= 1170px)**: Expand layout density and horizontal composition for wide viewports.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| xs | 5px | 5 | Extracted spacing token |
| sm | 8px | 8 | Extracted spacing token |
| md | 15px | 15 | Extracted spacing token |
| base | 16px | 16 | Extracted spacing token |
| lg | 20px | 20 | Extracted spacing token |
| xl | 35px | 35 | Extracted spacing token |
| 2xl | 54px | 54 | Extracted spacing token |
| 3xl | 70px | 70 | Extracted spacing token |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| badge-glow | 1 | 0px 0px 5px 0px rgb(128, 128, 128) |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | outline-color | rgb(33, 37, 41) ; rgb(71, 68, 65) ; rgb(129, 127, 126) |
| Light | outline-width | 3px |
| Light | outline-offset | 0px |
| Light | transform | matrix(1, 0, 0, 1, 0, 0) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| badge | 2px | 2 | Hairline corner |
| button | 4px | 4 | Subtle corner |
| card | 9px | 9 | Control corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| badge | 2px | px |
| button | 4px | px |
| card | 9px | px |

## Components

Components should be recreated from token references first, then tuned with variant notes and probe-backed state guidance.
- **Primary Navigation Bar**: Horizontal top navigation bar with logo on the left and nav links on the right. Active item indicated by a bottom border underline. Transparent background with dark text.
- **Page Heading**: Large serif heading using Arbutus Slab in warm brown, centered on the page for editorial section titles.
- **Hero Image Banner**: Full-bleed, full-width photographic hero image spanning the viewport width below the navigation bar. No overlay text; image stands alone.
- **Logo Link**: Clickable logo image in the top-left of the navigation bar, linking to the homepage.
- **Collapse Toggle Button**: Mobile navbar toggle button with semi-transparent white text and subtle border, used to expand/collapse the navigation menu.
- **reCAPTCHA Badge**: Google reCAPTCHA floating badge with a subtle gray box-shadow for elevation.
- **Editorial Content Block**: Centered text content block with a serif heading and sans-serif body copy, sitting on the warm peach background below the hero image.

### Brand Identity

**Default Logo**
- textColor: #007bff
- backgroundColor: rgba(0,0,0,0)
- rounded: 0px
- padding: 0px
- State guidance: Probe-backed: a.custom-logo-link

### Button

**Navbar Toggle**
- textColor: rgba(255,255,255,0.5)
- backgroundColor: rgba(0,0,0,0)
- borderColor: rgba(255,255,255,0.1)
- borderWidth: 1px
- rounded: 4px
- padding: 4px 12px
- fontSize: 20px
- State guidance: Probe-backed: button.pull-right

### Content Section

**Centered Editorial**
- backgroundColor: #ffeace
- textAlign: center
- headingFont: Arbutus Slab
- bodyFont: ElliotSans
- headingColor: #8f7158
- bodyColor: #212529
- padding: 70px 35px
- State guidance: Visually confirmed from screenshot — heading and paragraph centered on peach surface

### Heading

**H1 Section Title**
- fontFamily: Arbutus Slab
- fontSize: 35px
- fontWeight: 400
- lineHeight: 42px
- textColor: #8f7158
- rounded: 0px
- padding: 0px
- State guidance: Probe-backed: h1.vc_custom_heading with color rgb(143,113,88) = #8f7158

### Hero

**Full-Bleed Hero**
- width: 100vw
- objectFit: cover
- marginTop: 0px
- rounded: 0px
- State guidance: Visually confirmed from screenshot — food photography spanning full viewport width

### Navigation

**Active Nav Item**
- borderBottom: 2px solid #212529
- rounded: 0px
- padding: 8px 6.4px
- textColor: #212529
- State guidance: Probe-backed: li.menu-item with 2px bottom border active indicator

**Desktop Nav Bar**
- backgroundColor: rgba(0,0,0,0)
- textColor: #212529
- padding: 8px 16px
- fontSize: 16px
- fontFamily: ElliotSans
- fontWeight: 400
- State guidance: Probe-backed: #banner nav with transparent background and charcoal text

### Third-Party Widget

**Default Badge**
- rounded: 2px
- boxShadow: rgb(128,128,128) 0px 0px 5px 0px
- padding: 0px
- fontSize: 16px
- State guidance: Probe-backed: div.grecaptcha-badge — only shadow token in CSSOM

## Do's and Don'ts

Guardrails protect Dual typeface system, Layered elevation without adding unsupported visual claims.

| Do | Don't |
|----|---------|
| Do maintain consistent spacing using the base grid | Don't make unsupported claims about absent visual features |
| Do maintain WCAG AA contrast ratios (4.5:1 for normal text) | Don't mix rounded and sharp corners in the same view |
| Do use the primary color only for the single most important action per screen |  |
| Do verify evidence before writing new design-system guidance |  |

## Responsive Evidence

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <= 375px | (max-width: 375px) |
| Mobile | <= 480px | (max-width: 480px) |
| Mobile | <= 575.98px | (max-width: 575.98px) |
| Mobile | <= 600px | (max-width: 600px) |
| Mobile | <= 640px | (max-width: 640px) |
| Mobile | <= 767px | (max-width: 767px) |
| Breakpoint 7 | <= 767.98px | (max-width: 767.98px) |
| Breakpoint 8 | <= 768px | (max-width: 768px) |
| Breakpoint 9 | <= 781px | (max-width: 781px) |
| Breakpoint 10 | <= 800px | (max-width: 800px) |
| Breakpoint 11 | <= 991px | (max-width: 991px) |
| Breakpoint 12 | <= 991.98px | (max-width: 991.98px) |
| Breakpoint 13 | <= 992px | (max-width: 992px) |
| Breakpoint 14 | <= 1024px | (max-width: 1024px) |
| Breakpoint 15 | <= 1199px | (max-width: 1199px) |
| Breakpoint 16 | <= 1199.98px | (max-width: 1199.98px) |
| Mobile | >= 480px | (min-width: 480px) |
| Mobile | >= 481px | (min-width: 481px) |
| Mobile | >= 576px | (min-width: 576px) |
| Mobile | >= 600px | (min-width: 600px) |

## Agent Prompt Guide

### Example Component Prompts
- Create Collapse Toggle Button variant that preserves Mobile navbar toggle button with semi-transparent white text and subtle border, used to expand/collapse the navigation menu..
- Create Editorial Content Block variant that preserves Centered text content block with a serif heading and sans-serif body copy, sitting on the warm peach background below the hero image..
- Create Hero Image Banner variant that preserves Full-bleed, full-width photographic hero image spanning the viewport width below the navigation bar. No overlay text; image stands alone..

### Iteration Guide
1. Start with extracted palette and typography roles only.
2. Map spacing and radius directly from token tables before visual polish.
3. Apply component patterns one section at a time and compare against source intent.
4. Keep elevation claims tied to explicit evidence in output.
5. Iterate with smallest diffs and re-check section hierarchy after each change.
