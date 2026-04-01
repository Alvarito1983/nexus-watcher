# Changelog

## [1.3.0] — 2026-04-01

### Changed
- Complete UI redesign — Dark Premium visual system (amber accent `#F0A500`)
- Unified layout with NEXUS ecosystem standard
- Login: centered card with amber radial glow, fadeSlideUp animation
- Sidebar: dark surface, Lucide icons, amber active state
- TopBar: 56px, backdrop-filter blur
- Stat cards with semantic colors and skeleton loading
- Typography: Inter + JetBrains Mono
- Shared components: Button, Badge, Card, Input, EmptyState, Skeleton
- Version dynamic from `package.json` via `__APP_VERSION__`

### Fixed
- Image deduplication: only latest version shown per image name
- Responsive layout: hamburger sidebar on mobile

### Added
- Real-time update progress bar via Socket.io (pull layers + recreate)
- Affected containers chips per image row
- New version digest display (short SHA) on updates
- Last checked timestamp per image
- Updated badge with date when update was applied

---

## [1.2.0] — 2026-04-01

### Added
- **Real-time pull progress**: Socket.io `update:progress` events emitted per layer during `pullImage()`. Frontend shows inline progress bar with layer detail and percentage.
- **Richer image cards**: Each image now shows short registry digest, affected container chips, formatted last-check timestamp, and "Updated" badge with date when `updateApplied`.
- **Dark Premium redesign**: Full visual refresh following the NEXUS ecosystem design language with amber `#F0A500` accent.
  - `frontend/src/styles/tokens.css` — complete CSS custom-property design system
  - `frontend/src/styles/global.css` — Inter + JetBrains Mono fonts, animations, responsive rules
  - New UI component library under `frontend/src/components/ui/`: `Button`, `Badge`, `Card`, `EmptyState`, `Skeleton`
- **Login redesign**: Single-card with radial amber glow, NEXUS-style structure.
- **Dashboard redesign**: Proper sidebar with Lucide icons, 56px TopBar with blur, 4 stat cards (Total Images, Updates Available, Up to Date, Last Scan), semantic accent colors per card.
- **`__APP_VERSION__`**: `vite.config.js` now injects version from `frontend/package.json`. No more hardcoded version strings.
- **Socket.io backend**: `server.js` upgraded from `app.listen` to `http.createServer` + `socket.io` Server. `src/io.js` singleton for route access.

### Changed
- `docker.pullImage()` now accepts optional `onProgress(event)` callback (Dockerode `followProgress` 3rd arg).
- `routes/updates.js`: apply/apply-all emit `update:progress` with `{ id, stage, percent, layer, status }`.
- `backend/package.json`: replaced `socket.io-client` (wrong) with `socket.io` (server).
- `frontend/package.json`: added `socket.io-client`, `lucide-react`; removed unused `react-router-dom`; bumped version to `1.2.0`.

---

## [1.1.0] — 2024-xx-xx

- User management for standalone mode
- Session-based auth with admin/viewer roles

## [1.0.0] — 2024-xx-xx

- Initial release: digest-based image update detection, Telegram notifications, Docker container recreation
