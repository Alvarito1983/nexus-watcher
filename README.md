# NEXUS Watcher

Update detection service for the NEXUS Ecosystem. Compares local image digests against registry (Docker Hub / GHCR) and notifies when updates are available.

## Part of the NEXUS Ecosystem

```
NEXUS OS (dashboard)
├── NEXUS        — Docker manager       :9090
├── NEXUS Watcher — Update detection    :9091  ← this
├── NEXUS Pulse  — Uptime & health      :9092
├── NEXUS Security — CVEs & audit       :9093
├── NEXUS Notify — Alert router         :9094
└── NEXUS Proxy  — Docker socket proxy  :2375
```

## Quickstart

```bash
cp .env.example .env
docker compose up -d --build
```

Open: http://localhost:9091

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Liveness check |
| GET | /status | Summary: images, pending updates, last scan |
| GET | /api/images | All tracked images with digests |
| GET | /api/images/:id | Single image detail |
| GET | /api/updates | Images with updates available |
| POST | /api/updates/:id/apply | Pull + recreate containers |
| POST | /api/updates/apply-all | Bulk update all pending |
| POST | /api/updates/apply-all?dryRun=true | Preview without applying |
| POST | /api/updates/:id/rollback | Restore previous digest |
| POST | /api/scan | Trigger manual scan |
| GET | /api/scan/history | Last N scan results |

## How it works

1. On startup (and every `SCAN_INTERVAL` seconds) Watcher lists all local images via Docker API
2. For each image it fetches the `Docker-Content-Digest` header from the registry
3. If the registry digest differs from the last known digest → update available
4. Optionally notifies NEXUS Notify via webhook

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Backend port |
| `NEXUS_API_KEY` | — | Shared ecosystem API key |
| `SCAN_INTERVAL` | `3600` | Seconds between automatic scans |
| `NEXUS_URL` | — | NEXUS integration URL |
| `NOTIFY_URL` | — | NEXUS Notify webhook URL |
| `GHCR_TOKEN` | — | GitHub token for private GHCR images |

## Development

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```
