<div align="center">

<img src="https://raw.githubusercontent.com/Alvarito1983/nexus-watcher/master/frontend/public/icon-192.svg" width="120" height="120" alt="NEXUS Watcher logo" />

# NEXUS Watcher

**Docker image update detection for the NEXUS Ecosystem**

[![License MIT](https://img.shields.io/badge/license-MIT-F0A500?style=flat-square)](LICENSE)
[![Docker Hub](https://img.shields.io/docker/pulls/afraguas1983/nexus-watcher?style=flat-square&logo=docker&logoColor=white&color=F0A500)](https://hub.docker.com/r/afraguas1983/nexus-watcher)
[![Docker Image Size](https://img.shields.io/docker/image-size/afraguas1983/nexus-watcher/latest?style=flat-square&logo=docker&logoColor=white&color=F0A500)](https://hub.docker.com/r/afraguas1983/nexus-watcher)
[![Node.js 24](https://img.shields.io/badge/node-24--alpine-F0A500?style=flat-square&logo=node.js&logoColor=white)](https://hub.docker.com/_/node)
[![React 18](https://img.shields.io/badge/react-18-F0A500?style=flat-square&logo=react&logoColor=white)](https://react.dev)

[Docker Hub](https://hub.docker.com/r/afraguas1983/nexus-watcher) · [NEXUS Ecosystem](https://github.com/Alvarito1983/NEXUS) · [Report Bug](https://github.com/Alvarito1983/nexus-watcher/issues)

</div>

---

## ✨ Features

- 🔍 **Digest-based detection** — compares local SHA256 vs registry, catches `latest` updates that tag comparison misses
- ⚡ **Two scan modes** — notify only, or auto-update with automatic container recreation
- ↩️ **Rollback support** — saves previous digest before updating, one-click restore to previous version
- ⏱️ **Configurable interval** — 1h, 3h, 6h, 12h or 24h, changeable live from the UI without restart
- 📬 **Telegram notifications** — instant alerts when updates are found or applied
- 🌍 **Full EN/ES i18n** — English and Spanish UI out of the box
- 🔐 **Authentication** — JWT login, configurable admin credentials
- 📊 **Scan history** — full log of every scan with results and errors
- 🔌 **REST API** — all features accessible via authenticated API endpoints
- 🧩 **NEXUS Ecosystem ready** — registers with NEXUS OS, routes events to NEXUS Notify

---

## 📸 Screenshots

| Dashboard | Login |
|-----------|-------|
| ![Dashboard](https://raw.githubusercontent.com/Alvarito1983/nexus-watcher/master/docs/screenshots/watcher.png) | ![Login](https://raw.githubusercontent.com/Alvarito1983/nexus-watcher/master/docs/screenshots/login.png) |

| Images | Settings |
|--------|----------|
| ![Images](https://raw.githubusercontent.com/Alvarito1983/nexus-watcher/master/docs/screenshots/images.png) | ![Settings](https://raw.githubusercontent.com/Alvarito1983/nexus-watcher/master/docs/screenshots/settings.png) |

| History |
|---------|
| ![History](https://raw.githubusercontent.com/Alvarito1983/nexus-watcher/master/docs/screenshots/history.png) |

---

## Quickstart

```bash
# Pull and run
docker run -d \
  --name nexus-watcher \
  -p 9091:3002 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e ADMIN_PASSWORD=yourpassword \
  afraguas1983/nexus-watcher:latest
```

Or with Docker Compose:

```bash
git clone https://github.com/Alvarito1983/nexus-watcher.git
cd nexus-watcher
cp .env.example .env
# Edit .env with your credentials
docker compose up -d --build
```

Open **http://localhost:9091** — default credentials: `admin` / `admin`

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Backend port |
| `ADMIN_USER` | `admin` | Login username |
| `ADMIN_PASSWORD` | `admin` | Login password |
| `NEXUS_API_KEY` | — | Shared ecosystem API key |
| `SCAN_INTERVAL` | `3600` | Seconds between scans (overridden by UI settings) |
| `NEXUS_URL` | — | NEXUS integration URL |
| `NOTIFY_URL` | — | NEXUS Notify webhook URL |
| `TELEGRAM_BOT_TOKEN` | — | Telegram bot token for alerts |
| `TELEGRAM_CHAT_ID` | — | Telegram chat ID |
| `GHCR_TOKEN` | — | GitHub token for private GHCR images |

All notification settings can also be configured directly from the **Settings** tab in the UI.

---

## REST API

All endpoints require `Authorization: Bearer <token>` header (except `/health` and `/status`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Liveness check |
| `GET` | `/status` | Summary: images, pending updates, last scan |
| `GET` | `/metrics` | Prometheus-compatible metrics |
| `GET` | `/api/images` | All tracked images with local and registry digests |
| `GET` | `/api/images/:id` | Single image detail |
| `GET` | `/api/updates` | Images with updates available |
| `POST` | `/api/updates/:id/apply` | Pull new image and recreate containers |
| `POST` | `/api/updates/apply-all` | Bulk update all pending images |
| `POST` | `/api/updates/apply-all?dryRun=true` | Preview without applying |
| `POST` | `/api/updates/:id/rollback` | Restore previous image digest |
| `POST` | `/api/scan` | Trigger manual scan |
| `GET` | `/api/scan/history` | Last N scan results |
| `DELETE` | `/api/scan/history` | Clear scan history |
| `GET` | `/api/settings` | Get current configuration |
| `POST` | `/api/settings` | Update configuration (hot reload) |
| `POST` | `/api/auth/login` | Get session token |

---

## How it works

```
1. On startup → list all local images via Docker API
2. For each image → fetch Docker-Content-Digest from registry
3. Compare with last known digest
4. If different → mark as update available
5. Notify via Telegram / NEXUS Notify
6. If auto-update mode → pull + recreate containers
7. Repeat every SCAN_INTERVAL seconds
```

---

## 🗺️ Roadmap

### v1.0.0 — Core ✅
- Digest-based update detection (SHA256)
- Manual and scheduled scans
- Auto-update mode with container recreation
- Rollback to previous digest
- Configurable scan interval (live, no restart)
- Telegram notifications
- Scan history
- Full EN/ES i18n
- JWT authentication
- REST API

### v1.1.0 — User management ✅
- Session-based auth with Admin / Viewer roles
- User management UI (create, delete, reset password)

### v1.3.0 — Dark Premium UI + Real-time ✅
- ✅ Dark Premium UI redesign (amber `#F0A500` accent, CSS design system)
- ✅ Image deduplication — only latest entry shown per image name
- ✅ Real-time update progress with Socket.io (per-layer pull + recreate stages)
- ✅ Affected containers info per image (chips in image row)
- ✅ New version digest display (short SHA on images with updates)
- ✅ Last checked timestamp per image
- ✅ Updated badge with apply date
- ✅ Inter + JetBrains Mono typography
- ✅ Skeleton loading + empty states
- ✅ Version injected from `package.json` via `__APP_VERSION__`

### v1.x — Next improvements _(coming soon)_
- Per-image ignore list
- Webhook support
- Email, Discord and Slack notifications via NEXUS Notify
- Docker Hub rate limit handling

### v2.0.0 — NEXUS Ecosystem 🚀 _(Q4 2026)_

NEXUS Watcher becomes a first-class citizen of the **NEXUS Ecosystem** — a suite of modular Docker management tools that work standalone but are better together.

> *"Each tool works. Together, they think."*

```
NEXUS OS              — Unified dashboard, SSO, service registry
├── NEXUS             — Docker manager          :9090  ✅ live
├── NEXUS Watcher     — Update detection        :9091  ✅ live
├── NEXUS Pulse       — Uptime & health         :9092  🔜 Q3 2026
├── NEXUS Security    — CVEs, SSL, 2FA, audit   :9093  🔜 Q3 2026
├── NEXUS Notify      — Unified alert router    :9094  🔜 Q2 2026
└── NEXUS Proxy       — Docker socket proxy     :2375  ✅ live
```

**What changes in v2.0.0:**
- Automatic registration with NEXUS OS on startup
- SSO — one login for the whole ecosystem
- Centralised config from NEXUS OS
- Events routed through NEXUS Notify
- Updates widget embedded in NEXUS dashboard
- Multi-host support via NEXUS Proxy

### v3.0.0 — SaaS & Multi-tenant _(2027)_
- Cloud-hosted NEXUS OS
- Multiple organisations and teams
- Free / Pro / Business plans

---

## Tech stack

- **Backend** — Node.js 24, Express, Dockerode, Socket.io, node-cron, Axios
- **Frontend** — React 18, Vite, Lucide React, Socket.io-client
- **Base image** — `node:24-alpine`
- **Auth** — JWT sessions, Admin / Viewer roles

---

## License

MIT © [Alvarito1983](https://github.com/Alvarito1983)

---

<div align="center">

Made with ☕ by [Alvarito1983](https://github.com/Alvarito1983)

</div>
