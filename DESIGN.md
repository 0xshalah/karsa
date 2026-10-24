---
version: alpha
name: Karsa Vault
description: v3, calm editorial dark identity for Karsa Vault (KRS), a SEP-0056 tokenized XLM vault on Stellar Soroban testnet. Structure and restraint follow the requester's reference (Lumbung); palette and fonts come from Karsa's PRD section 4 so the two products stay distinct. Single dark theme by requester decision.
colors:
  primary: "#10B981"
  base: "#07090E"
  surface: "#0F141C"
  surface-deep: "#0B0F15"
  line: "#1E293B"
  control: "#64748B"
  text: "#F8FAFC"
  text-secondary: "#CBD5E1"
  muted: "#94A3B8"
  accent: "#10B981"
  accent-hover: "#34D399"
  anchor: "#06B6D4"
  danger: "#F87171"
  caution: "#FBBF24"
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: -0.035em
  heading:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.025em
  title:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.1
  label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.18em
rounded:
  label: 4px
  control: 6px
  button: 8px
  panel: 10px
  bar: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  section: 128px
  section-mobile: 96px
  gutter: 24px
  gutter-mobile: 20px
  content-max: 1100px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.base}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: 18px
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.base}"
  button-ghost:
    backgroundColor: "{colors.base}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: 18px
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
  panel-inset:
    backgroundColor: "{colors.surface-deep}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.button}"
  divider:
    backgroundColor: "{colors.line}"
    height: 1px
  input:
    backgroundColor: "{colors.base}"
    textColor: "{colors.text}"
    typography: "{typography.data}"
    rounded: "{rounded.button}"
  input-border:
    backgroundColor: "{colors.control}"
    height: 1px
  section-label:
    textColor: "{colors.accent}"
    typography: "{typography.label}"
  label-muted:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  anchor-figure:
    textColor: "{colors.anchor}"
    typography: "{typography.data}"
  status-danger:
    textColor: "{colors.danger}"
    typography: "{typography.label}"
    rounded: "{rounded.label}"
  lang-toggle-active:
    backgroundColor: "{colors.text}"
    textColor: "{colors.base}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
  mode-tag-preview:
    textColor: "{colors.caution}"
    typography: "{typography.label}"
    rounded: "{rounded.label}"
  mode-tag-live:
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    rounded: "{rounded.label}"
  tab-active:
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
  progress-bar:
    backgroundColor: "{colors.line}"
    rounded: "{rounded.bar}"
    height: 8px
voice:
  tone: calm, exact, plainspoken
  person: second person for actions (you deposit), third person for the contract
  formality: technical-neutral
  reading-level: developer documentation written for a curious non-specialist
messaging:
  product-name: Karsa Vault (KRS)
  tagline: Deposit XLM. Hold KRS. Keep your share.
  value-prop: A SEP-0056 vault whose 100 XLM virtual anchor keeps a donation into an empty vault from wiping out the next deposit.
  boilerplate: Karsa Vault is a SEP-0056 v0.1.2 tokenized vault on Stellar Soroban testnet. You deposit native XLM and receive KRS shares; share math runs against 1,000,000,000 virtual stroops and 10^(9+offset) virtual shares.
  banned-phrases: institutional-grade, seamless, revolutionary, next-generation, bank-level security, guaranteed, audited (until it is), live or on-chain (when no chain read backs the number)
licensing:
  assets-path: web/public
  fonts: Space Grotesk, Inter and JetBrains Mono are SIL Open Font License 1.1, loaded from the Google Fonts CDN.
  logo: No logo file exists. The inline SVG mark (emerald rounded square with a white K) is a stand-in until the owner supplies one.
  attribution: none
---

## Overview

v2 replaces the v1 "Paper Blueprint" workbench, which the requester rejected as busy. Karsa now reads like a calm technical magazine page on a dark obsidian ground: one column at 1100px, generous whitespace, a numbered mono label opening each section, and one emerald focus per screen. Structure and restraint come from the requester's reference (Lumbung); colour and type come from Karsa's PRD section 4, so Karsa is cold emerald and Lumbung stays warm gold.

Design read: landing page plus a Testnet dApp (`/app`) for a developer-facing vault standard, in a dark editorial voice. Dials ENERGY 2 / RHYTHM 2 / MOTION 2.

Single dark theme. No light mode and no theme toggle. EN/ID language toggle only.

## Colors

- `base` is the page; `surface` holds panels; `surface-deep` holds inset blocks (lab results, marquee band).
- `line` (#1E293B) draws decorative dividers and panel borders. It is not a control boundary.
- `control` (#64748B) borders inputs: 3.88:1 on surface, meets WCAG 1.4.11 (3:1).
- `text` 19.03:1 on base. `muted` 7.77:1 on base, 7.20:1 on surface. `text-secondary` 12.44:1 on surface.
- `accent` emerald is the single focus per screen: the primary CTA, the section label, the guarantee keys and the kept-share bar. Emerald text passes as-is (7.85:1 on base, 7.28:1 on surface), so no lighter text variant was needed. Base text on an emerald fill is 7.85:1.
- `anchor` cyan is reserved for virtual-anchor figures (stats panel, formula detail): 7.61:1 on surface.
- `caution` amber (#FBBF24, 11.06:1 on surface) marks preview mode only: the PREVIEW tag and the left rule of the "contract not configured" / "connect to sign" notices. It never marks a number.
- `danger` is only for facts that say "not real money" or "not set": 7.20:1 on base, 6.68:1 on surface.
- The CSS `--verified` variable is `accent` on purpose: the design guarantees (security panel, left column) use it, the known limitations use `danger`. The page shows no pass/fail verdicts.

## Typography

- `display` / `heading` / `title` (Space Grotesk 600, tight tracking): the headline, section titles and panel titles. PRD section 4 names it; its squared terminals read technical without going mono.
- `body` (Inter): paragraphs, 52 to 68 characters per line.
- `data` / `data-lg` / `label` (JetBrains Mono, tabular figures always): stroops, share counts, addresses, formulas, section labels. Addresses need an unambiguous 0/O and 1/l.
- Uppercase tracked labels are used only for section numbers and stat keys, never for sentences.

## Layout

One column, 1100px max, 20px gutters on mobile and 24px from 768px. The section head is a 4/8 split: label left, title right. Section shapes follow content: stacked rows for How it works, one panel for the lab, a grouped table for mechanics, a two-sided split for security, a disclosure list for FAQ, a two-row footer. Grid and flex children get `min-width: 0`; decoration that leaves the viewport is cut with `overflow-x: clip`.

## Elevation and Depth

Flat panels with 1px borders. Depth comes from one soft emerald glow behind the hero and a 4.5% film grain. Blur only on the sticky nav and the dialog backdrop.

## Shapes

4px status label, 6px small controls and the language toggle, 8px buttons and inputs, 10px panels and tables. Full pill radius only on the lab's progress bars.

## Components

- `button-primary`: emerald fill, obsidian text. Only the hero CTA carries an arrow.
- `button-ghost`: transparent with a `line` border; border lightens on hover.
- `lang-toggle-active`: segmented EN/ID control, active segment white on obsidian so it does not spend the emerald budget.
- `progress-bar`: naive vault fills in danger, Karsa in accent; width is the exact kept percentage.

## App (/app)

One column at 760px: Testnet note, title, mode notices, contract ID bar, vault state, position, the four-tab action panel, and (preview mode only) the preview log. Notices are flat surface boxes with a 3px left rule coloured by meaning: caution for preview, anchor cyan for setup hints, accent for live, danger for errors, which always show the code verbatim in mono. Tabs are a 4-up underline row (accent underline on the active tab, arrow keys move between them). The submit button is the one emerald element in the panel; it reads "Deposit on Testnet" when live and "Run Deposit preview" otherwise, so the mode is in the verb. The transaction dialog lists the four steps (simulate, sign in Freighter, pending, result) with a hash link to Stellar Expert.

## Motion

Scroll reveal (opacity plus 18px rise or 24px slide), hover colour shifts, and a 60s linear marquee of specs Karsa actually implements. All of it switches off under `prefers-reduced-motion`.

## Voice

Say what the contract does, with the number. On-brand: "With a 5 XLM donation in front of it, the naive vault leaves the victim 0.000002% of the shares they paid for. Karsa keeps 95.24%." Off-brand: "Bank-grade protection for your assets."

## Do's and Don'ts

- Do label preview values as preview and say "contract not configured" when no ID is set; only chain reads may be called live.
- Do keep one emerald focus per screen; demote a second one to neutral.
- Don't bring back the ribbon, the command dock, exposed grid lines or a blueprint background.
- Don't use capsule badges with pulsing dots, or an arrow on every button.
- Don't write em dashes in UI copy; use a comma, a colon or a middle dot.
- TODO: a real logo file, the deployed contract ID and the testnet SAC address (deployments/testnet.json).
