# Link2Pay Interface Design System

## Product Context

**Who:** Crypto-native founder/freelancer (often in Latin America) who accepts Stellar payments. Checks daily to see if payments settled. Technical, pragmatic, needs speed.

**Primary verb:** Settle — confirm blockchain finality. Secondary: create links fast, understand pipeline.

**Feel:** Precise, protocol-native, cold-efficient. Like a trading terminal crossed with Stripe. Dark-mode first, digital-native.

## Direction

Stellar ledger aesthetics. Settlement pulse. Conversion funnel as the core KPI. Dense but not cluttered.

## Depth Strategy

**Borders-only** — No dramatic shadows. Card shadow is whisper-quiet: `0 1px 3px rgba(0,0,0,0.2)`. Borders define edges. Inputs darker than surroundings (inset feel). Sidebar same background as main canvas, border-only separation.

## Palette

All from CSS variables — never hard-coded hex or Tailwind opacity colors that break dark mode.

- `--primary` / `primary` → phosphor cyan (hsl 190 70% 55%) — brand, links, active states
- `--success` / `success` → settlement emerald — confirmed/paid state only
- `--warning` / `warning` → amber caution — pending/in-flight state only
- `--destructive` — rose — failed/expired/cancelled only
- `ink-0..3` → text hierarchy (foreground → muted)
- `surface-0..4` → elevation scale (card → border)

**Rule:** Never use hard-coded `amber-50`, `amber-200`, `emerald-50` etc. for semantic states — these break in dark mode. Use `warning/5`, `warning/10`, `warning/25`, `success/10`, etc.

## Typography

- Sans: Inter (body, UI labels)
- Display: Space Grotesk (headings, h1–h6)
- Mono: JetBrains Mono (numbers, amounts, addresses, hashes, code)
- Numbers always in `font-mono` for alignment

## Spacing

Base unit 4px. Common: p-3, p-4, p-5 for cards. gap-2, gap-3, gap-4 between elements.

## Semantic Color Conventions

| State | Color token | Background | Border |
|-------|------------|-----------|--------|
| Paid / confirmed | emerald-500/600 | bg-emerald-500/10 | border-l-4 border-l-emerald-500 |
| Pending / in-flight | amber-500/600 | bg-amber-500/10 | border-l-4 border-l-amber-500 |
| Failed / expired | rose/destructive | bg-destructive/10 | border-destructive/30 |
| Brand / revenue | primary | bg-primary/10 | border-l-4 border-l-primary |
| Neutral / draft | muted | bg-muted | no accent border |

## Stat Card Pattern

Left border accent + semantic icon container. Never all-gray icons — icon color = card semantic.

```tsx
<div className={`card p-5 ${stat.border}`}>
  <div className="mb-2 flex items-center justify-between">
    <p className="text-xs text-ink-3">{stat.label}</p>
    <span className={`rounded-md p-1.5 ${stat.iconBg} ${stat.iconColor}`}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  </div>
  <p className={`text-2xl font-semibold font-mono ${stat.color}`}>{stat.value}</p>
</div>
```

## Loading States

Always use content-shaped skeletons — never plain text "Loading...".

Skeleton pattern: `animate-pulse` on wrapper, `bg-surface-2 rounded` on placeholder elements.
Match skeleton structure to actual content (table skeletons for tables, grid skeletons for grids).

## Client Card Pattern

Avatar initial + name + email. Avatar: `h-9 w-9 rounded-full bg-primary/10 text-primary` with `name.charAt(0).toUpperCase()`.

## Navigation

Sidebar order: Dashboard → Transactions → Payment Links → Clients → API Keys → Analytics → Create Link.

All 7 routes must appear in the sidebar. Same background as main canvas, border-right separation only.

## Bar Charts (Trend)

Clean column chart: bars rising from a `border-b border-surface-3` baseline. No bordered boxes around individual bars. Hover reveals count label above bar. `bg-primary/70` default, `bg-primary` on hover.

## Pending/Warning Banners

Use CSS variable tokens, never hard-coded Tailwind shade utilities:

```tsx
<div className="card p-5 border-warning/25 bg-warning/5">
  <span className="rounded-lg bg-warning/10 text-warning">
    <AlertTriangle />
  </span>
  <p className="text-warning/80">{label}</p>
  <p className="text-warning">{amount}</p>
</div>
```
