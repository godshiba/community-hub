# Design System — Dark Obsidian Glassmorphism

## Background

Solid dark gradient canvas — everything sits on top of this:
- Base: `#0a0a0f`
- Subtle gradient: `linear-gradient(135deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)`

## Glass Surfaces

Three elevation levels:

| Level | Use | Background | Blur | Border |
|-------|-----|-----------|------|--------|
| Surface | Icon bar, status bar | `rgba(255,255,255,0.03)` | 8px | `rgba(255,255,255,0.04)` |
| Raised | Panels, cards | `rgba(255,255,255,0.06)` | 12px | `rgba(255,255,255,0.06)` |
| Overlay | Modals, dropdowns | `rgba(255,255,255,0.10)` | 16px | `rgba(255,255,255,0.08)` |

All glass surfaces use:
- `backdrop-filter: blur(Xpx) saturate(150%)`
- `border: 1px solid <border-value>`
- `box-shadow: 0 4px 24px rgba(0,0,0,0.3)`

## Border Radius

- Panels: 12px
- Cards: 8px
- Inputs/buttons: 6px
- Badges: 4px

## Colors

### Accent
- Primary: `#6366f1` (indigo) — active states, primary actions
- Secondary: `#8b5cf6` (violet) — hover, highlights

### Semantic
- Success: `#22c55e` — connected, sent, active
- Warning: `#f59e0b` — pending, warned
- Error: `#ef4444` — failed, banned, disconnected

### Platform
- Discord: `#5865F2`
- Telegram: `#26A5E4`

### Text
- Primary: `rgba(255,255,255,0.87)`
- Secondary: `rgba(255,255,255,0.50)`
- Muted: `rgba(255,255,255,0.30)`

## Typography

| Use | Font | Size |
|-----|------|------|
| UI labels, navigation | Inter | 14px |
| Small text, badges | Inter | 12px |
| Section headings | Inter (semibold) | 16px |
| Panel titles | Inter (bold) | 24px |
| Data, metrics, code | JetBrains Mono | 13px |

## Interactions

- Hover: glass opacity +0.02, 150ms ease-out
- Active/pressed: glass opacity +0.04
- Focus ring: 2px `#6366f1` with 4px offset
- All transitions: 150ms ease-out

## shadcn/ui Theme Override

Override shadcn CSS variables in `glass-theme.css`:

```css
:root {
  --background: 240 10% 4%;        /* #0a0a0f */
  --foreground: 0 0% 100% / 0.87;
  --card: 0 0% 100% / 0.06;
  --card-foreground: 0 0% 100% / 0.87;
  --primary: 239 84% 67%;          /* #6366f1 */
  --primary-foreground: 0 0% 100%;
  --secondary: 258 90% 66%;        /* #8b5cf6 */
  --border: 0 0% 100% / 0.06;
  --ring: 239 84% 67%;
  --radius: 0.5rem;
}
```

## Tailwind Custom Utilities

```css
.bg-glass-surface { @apply bg-white/[0.03] backdrop-blur-sm; }
.bg-glass-raised  { @apply bg-white/[0.06] backdrop-blur-md; }
.bg-glass-overlay { @apply bg-white/[0.10] backdrop-blur-lg; }
.border-glass      { @apply border border-white/[0.06]; }
.shadow-glass      { @apply shadow-[0_4px_24px_rgba(0,0,0,0.3)]; }
```
