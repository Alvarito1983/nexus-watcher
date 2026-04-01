# NEXUS Watcher — Design System & Development Context

## Project Overview

NEXUS Watcher is a standalone Docker image update monitor. It scans registries, detects outdated images across multiple hosts, and notifies when updates are available. Part of the NEXUS ecosystem but fully independent.

### Ecosystem context

| Tool     | Color      | Hex       | Port |
|----------|------------|-----------|------|
| NEXUS    | Green      | `#00c896` | 9090 |
| **Watcher**  | **Amber**  | **`#F0A500`** | **9091** |
| Pulse    | Blue       | `#3b82f6` | 9092 |
| Security | Red        | `#ef4444` | 9093 |
| Notify   | Purple     | `#8b5cf6` | 9094 |
| Hub      | Deep Purple| `#534AB7` | 9095 |

### Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: CSS custom properties (no Tailwind)
- **Icons**: Lucide React
- **State**: React Context + hooks
- **Auth**: JWT (standalone users, Admin/Viewer roles)
- **Backend**: Node.js + Express + Socket.io
- **Target**: Self-hosted Docker environments (desktop + mobile)

### Dev path
- **Development**: `E:\Claude\nexus-watcher`
- **Production stack**: `E:\arr\stack\nexus-watcher\`
- **GitHub**: github.com/Alvarito1983/nexus-watcher
- **Docker Hub**: afraguas1983/nexus-watcher
- **CI/CD**: push to `main` → GitHub Actions → Docker Hub + GHCR

---

## Visual Identity — Dark Premium (Amber)

The Watcher design language follows the NEXUS ecosystem Dark Premium standard. Same foundations, but the accent color is **amber `#F0A500`** — communicating vigilance, monitoring, alertness.

### Design Philosophy

- **Dark-first**: Deep dark backgrounds, amber as the signal color
- **Amber = watchfulness**: Used for active scans, pending updates, alerts
- **Precision over decoration**: Every element earns its place
- **Motion as feedback**: Scanning animations, update counters, pulse effects

---

## Color System

### Base Palette (CSS Variables)

```css
:root {
  /* Backgrounds — layered depth */
  --bg-base:       #0a0a0f;
  --bg-surface:    #111118;
  --bg-elevated:   #1a1a24;
  --bg-overlay:    #22222e;
  --bg-subtle:     #16161f;

  /* Borders */
  --border-subtle:  rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong:  rgba(255,255,255,0.18);

  /* Text */
  --text-primary:   #f0f0f8;
  --text-secondary: #9090a8;
  --text-muted:     #55556a;
  --text-disabled:  #3a3a4a;

  /* Watcher Accent — Amber */
  --accent:         #F0A500;
  --accent-dim:     rgba(240, 165, 0, 0.12);
  --accent-glow:    rgba(240, 165, 0, 0.20);

  /* Semantic */
  --color-success:  #00c896;
  --color-warning:  #F0A500;
  --color-danger:   #ef4444;
  --color-info:     #3b82f6;

  /* Update status colors */
  --status-uptodate:  #00c896;
  --status-outdated:  #F0A500;
  --status-unknown:   #55556a;
  --status-error:     #ef4444;

  /* Layout */
  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;

  /* Shadows */
  --shadow-sm:     0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md:     0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3);
  --shadow-lg:     0 8px 32px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4);
  --shadow-accent: 0 0 20px var(--accent-glow);

  /* Transitions */
  --transition-fast: 120ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 350ms ease;
}
```

---

## Typography

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Scale */
--text-xs:   11px;
--text-sm:   13px;
--text-base: 14px;
--text-lg:   18px;
--text-xl:   22px;
--text-2xl:  28px;

/* Weights */
--weight-normal:   400;
--weight-medium:   500;
--weight-semibold: 600;
```

### Typography Rules

- **Page titles**: 22px / 600 / `--text-primary`
- **Section headers**: 13px / 500 / `--text-secondary` / UPPERCASE / letter-spacing: 0.08em
- **Card titles**: 14px / 500 / `--text-primary`
- **Body**: 14px / 400 / `--text-secondary`
- **Labels**: 12px / 400 / `--text-muted`
- **Monospace** (image names, tags, digests): `--font-mono` / 13px

---

## Layout Architecture

```
┌─────────────────────────────────────────────────┐
│  Sidebar (220px fixed)  │  Main Content Area     │
│  ─────────────────────  │  ─────────────────────  │
│  Logo + "Watcher"       │  TopBar (56px)          │
│  ─────────────────────  │  ─────────────────────  │
│  Nav items              │  Page Content           │
│                         │  (scrollable)           │
│  ─────────────────────  │                         │
│  Last scan info         │                         │
│  User + Settings        │                         │
└─────────────────────────────────────────────────┘
```

### Sidebar

```css
.sidebar {
  width: 220px;
  background: var(--bg-subtle);
  border-right: 1px solid var(--border-subtle);
}

.nav-item.active {
  background: var(--accent-dim);
  color: var(--accent);
}
```

### TopBar

```css
.topbar {
  height: 56px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(8px);
}
```

---

## Watcher-specific Components

### Update Badge

```css
.badge.uptodate { background: rgba(0,200,150,0.12);  color: #00c896; }
.badge.outdated { background: rgba(240,165,0,0.12);  color: #F0A500; }
.badge.unknown  { background: rgba(85,85,106,0.15);  color: #9090a8; }
.badge.error    { background: rgba(239,68,68,0.12);  color: #ef4444; }

/* Outdated badge pulsing dot */
.badge.outdated .badge-dot {
  background: #F0A500;
  box-shadow: 0 0 6px rgba(240,165,0,0.5);
  animation: pulse 2s ease-in-out infinite;
}
```

### Scan Progress Bar

```css
.scan-progress {
  height: 2px;
  background: var(--border-subtle);
  border-radius: 1px;
  overflow: hidden;
}
.scan-progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 300ms ease;
  box-shadow: 0 0 8px var(--accent-glow);
}
```

### Host Card

```css
.host-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  transition: border-color var(--transition-base);
}
.host-card:hover {
  border-color: var(--border-default);
}
.host-card.has-updates {
  border-color: rgba(240,165,0,0.3);
}
.host-card.has-updates::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--accent);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
```

---

## Shared Components (src/components/ui/)

All tools in the ecosystem share the same component API:

- `Button.jsx` — primary / secondary / ghost / danger · sizes sm/md · loading state
- `Badge.jsx` — uptodate / outdated / unknown / error / info · dot animado
- `Card.jsx` — base Card + StatCard con línea de acento superior
- `Input.jsx` — label, placeholder, focus ring de acento, error state
- `EmptyState.jsx` — icon + title + description + optional action button
- `Skeleton.jsx` — Skeleton, SkeletonRow, SkeletonTable parametrizables

---

## Version as single source of truth

Version is read from `frontend/package.json` at build time via Vite:

```js
// vite.config.js
const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) }
});
```

Use `{__APP_VERSION__}` in any component. Never hardcode version strings.

---

## Motion & Animation

```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
}
@keyframes scan {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

.animate-in { animation: fadeSlideUp 300ms ease both; }
.stagger > *:nth-child(1) { animation-delay: 0ms; }
.stagger > *:nth-child(2) { animation-delay: 60ms; }
.stagger > *:nth-child(3) { animation-delay: 120ms; }
.stagger > *:nth-child(4) { animation-delay: 180ms; }
.skeleton {
  background: linear-gradient(90deg,
    var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
```

---

## Quality Standards

Every screen must have:
1. Proper visual hierarchy
2. Empty states — never a blank void
3. Loading states — skeleton screens
4. Error states — clear and actionable
5. Responsive — works 1280px → 768px

Anti-patterns to avoid:
- ❌ Hardcoded version strings
- ❌ Hardcoded colors outside CSS variables
- ❌ Icons without breathing room
- ❌ Tables with no hover states
- ❌ Forms with no focus states
- ❌ `&&` in PowerShell (use separate commands)

## CRLF fix (Windows builds)

```bash
docker run --rm -v "${PWD}:/work" alpine sh -c "sed -i 's/\r//' /work/backend/entrypoint.sh"
```
