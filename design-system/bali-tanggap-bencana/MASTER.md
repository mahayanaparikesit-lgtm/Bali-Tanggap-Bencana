# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Bali Tanggap Bencana
**Generated:** 2026-09-02 22:37:07
**Category:** Emergency coordination / public-service app — NOT a SaaS product. Do not apply
sales-landing-page conventions (social proof, pricing sections, "wow factor" hero animation).
Priority order: clarity of status & urgency > information density > decorative aesthetics.

---

## Global Rules — OVERRIDDEN for this project

> The auto-generated palette below defaulted to a generic "trust blue" SaaS scheme. It has
> been replaced with this app's existing red/orange emergency palette (already live in
> `artifacts/bencana-bali/src/index.css`). **Do not reintroduce blue/purple as primary.**

### Color Palette

| Role | Hex | HSL (source of truth, from index.css) | CSS Variable |
|------|-----|------|--------------|
| Primary | `#CF2317` | `hsl(4 80% 45%)` | `--color-primary` |
| Primary (dark mode) | — | `hsl(4 75% 58%)` | `--color-primary` |
| On Primary | `#FFFFFF` | `hsl(0 0% 100%)` | `--color-on-primary` |
| Secondary | `#F37D16` | `hsl(28 90% 52%)` | `--color-secondary` |
| Accent/CTA | `#EE862B` | `hsl(28 85% 55%)` | `--color-accent` |
| On Secondary/Accent | `#FFFFFF` | `hsl(0 0% 100%)` | `--color-on-accent` |
| Background | `#F6F7F9` | `hsl(220 20% 97%)` | `--color-background` |
| Foreground | `#171C26` | `hsl(220 25% 12%)` | `--color-foreground` |
| Card | `#FFFFFF` | `hsl(0 0% 100%)` | `--color-card` |
| Card Foreground | `#171C26` | `hsl(220 25% 12%)` | `--color-card-foreground` |
| Muted Foreground | `#626D84` | `hsl(220 15% 45%)` | `--color-muted-foreground` |
| Border | `#DCDFE5` | `hsl(220 15% 88%)` | `--color-border` |
| Destructive | `#BD0F0F` | `hsl(0 85% 40%)` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `hsl(0 0% 100%)` | `--color-on-destructive` |
| Ring | `#CF2317` | `hsl(4 80% 45%)` | `--color-ring` |

**Color Notes:** Red primary + orange secondary/accent is intentional and correct for an
emergency/disaster-coordination context (urgency, warning, hazard association) — this is the
opposite intent of a calm "trust blue" SaaS palette and must not be normalized toward one.
Both light and dark mode variants already exist in `index.css`; reuse them, don't invent new
values. Status colors (see Status Semantics below) are a **separate, fixed** set from
primary/accent and must never be repurposed for branding/CTA use.

### Status Semantics (status/badge/chip color+icon+label, mandatory pairing)

Status must never be conveyed by color alone (WCAG 1.4.1) — every status chip needs an icon
**and** a text label, not just a colored dot/background.

| Status | Used in | Suggested color | Suggested icon (lucide-react) |
|---|---|---|---|
| `menunggu` | laporan, relawan, donasi | amber/yellow (`hsl(38 92% 50%)`) | `Clock` |
| `terverifikasi` | laporan, relawan | blue-gray or green (distinct from primary red) | `CheckCircle2` |
| `selesai` | laporan | green (`hsl(142 71% 35%)`) | `CheckCheck` |
| `aktif` | penugasan | primary red or amber (in-progress) | `Activity` / `Radio` |
| `dibatalkan` | penugasan | muted gray | `XCircle` |
| `ditolak` | relawan | destructive red — must look distinct from `menunggu`/`aktif` even though both may otherwise use red-family hues | `XCircle` |

Because primary is already red, avoid using plain red for "aktif" if it collides visually with
brand red in the same view — prefer amber/orange for "in-progress" and reserve destructive red
strictly for `ditolak`/errors.

### Typography

- **Heading Font:** Outfit
- **Body Font:** Work Sans
- **Mood:** geometric, modern, clean, balanced, contemporary, versatile
- **Google Fonts:** [Outfit + Work Sans](https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button — uses the app's red primary, not the generic blue default */
.btn-primary {
  background: #CF2317; /* hsl(var(--primary)) */
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #CF2317;
  border: 2px solid #CF2317;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #FFFFFF; /* hsl(var(--card)) */
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}
```
Note: only add `cursor:pointer` and hover-lift to cards that are actually clickable (e.g. a
laporan row linking to detail). A purely informational stat card should not fake affordance.

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #DCDFE5;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #CF2317;
  outline: none;
  box-shadow: 0 0 0 3px #CF231733;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Minimalism & Swiss Style (kept — clean/high-contrast/grid-based genuinely fits an
operational tool used under stress) — **but the "Best For" and "Page Pattern" below are
overridden**, since the auto-generated ones assumed a commercial SaaS product.

**Keywords:** Clean, simple, functional, high contrast, scannable, grid-based, essential

**Best For (overridden):** Emergency/disaster coordination, civic/public-service tools,
operational dashboards used repeatedly under time pressure — NOT marketing/conversion pages.

**Key Effects:** Subtle hover (150-250ms), clear status hierarchy, fast loading, no
decorative motion that competes with status/urgency signals.

### Page Pattern — OVERRIDDEN (do not use Hero + Features + CTA / social-proof landing pattern)

This is not a product being sold — most of the app (`/admin`, `/relawan`, `/pelapor`,
`/donatur`) is an authenticated operational tool, and only `Home.tsx` and `Transparansi.tsx`
are public-facing. Apply per page type instead of one universal "landing" template:

- **`Home.tsx` (public landing):** headline stating what the app is + 3 clear role-based
  entry points (lapor bencana / daftar relawan / donasi). No pricing/testimonial/social-proof
  sections — replace "social proof" with real trust signals appropriate to a public-service
  app instead (e.g. live counts from `/dashboard/statistik`, official posko contacts).
- **`Transparansi.tsx` (public accountability page):** data-dense, scannable list/table
  pattern — laporan status, dana masuk, relawan bertugas. Optimize for a citizen or donor
  scanning to verify legitimacy, not for conversion.
- **Authenticated dashboards (`AdminDashboard`, `PelaporDashboard`, `RelawanDashboard`,
  `DonaturDashboard`):** task-queue / scan-able summary pattern — stat tiles feeding directly
  into actionable lists (e.g. "3 laporan menunggu verifikasi" → links straight to that
  filtered list), not decorative KPI cards with no next action.
- **Forms (`LaporanBaru`, `RelawanDaftar`):** linear task-completion pattern — inline
  validation, Bahasa Indonesia error messages, preserve entered data on failed submit.

---

## Anti-Patterns (Do NOT Use)


### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
