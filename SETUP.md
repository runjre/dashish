# Tunet Dashboard — Setup Guide

> See also [README.md](README.md) for features and screenshots.

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20+ |
| npm | 9+ |
| Docker (optional) | 20+ |
| Home Assistant | Any recent version |

## Project Structure

```
tunet/
├── src/
│   ├── App.jsx              # Main dashboard component
│   ├── main.jsx             # React entry point
│   ├── components/          # cards/, charts/, effects/, pages/, sidebars/, ui/
│   ├── modals/              # All dialog modals
│   ├── contexts/            # React contexts (Config, HA, Pages)
│   ├── hooks/               # Custom hooks (profiles, theme, energy, etc.)
│   ├── services/            # HA WebSocket client, profile API, snapshots
│   ├── rendering/           # Card renderer dispatch + ModalOrchestrator
│   ├── i18n/                # Translations (en, nn)
│   ├── layouts/             # Header, StatusBar, EditToolbar
│   ├── config/              # Constants, defaults, themes, onboarding
│   ├── icons/               # Icon barrel exports + iconMap
│   ├── utils/               # Formatting, grid layout, drag-and-drop
│   └── styles/              # CSS (index, dashboard, animations)
├── server/
│   ├── index.js             # Express server (API + static files)
│   ├── db.js                # SQLite setup (profiles table)
│   └── routes/profiles.js   # Profiles CRUD API
├── Dockerfile               # Multi-stage Docker build
├── docker-compose.yml       # Docker Compose config
└── vite.config.js           # Vite + dev proxy config
```

## Local Development

```bash
npm install

# Start frontend + backend together
npm run dev:all

# Or run separately:
npm run dev          # Vite frontend on :5173
npm run dev:server   # Express backend on :3002
```

The Vite dev server proxies `/api` requests to the backend automatically.

## Docker

### Docker Compose (recommended)

```bash
docker compose up -d
```

Access at `http://localhost:3002`. Profile data is persisted in a Docker volume (`tunet-data`).

Verify:

```bash
docker logs tunet-dashboard
# expect: Tunet backend running on port 3002

curl http://localhost:3002/api/health
# expect: {"status":"ok",...}
```

### Docker directly

```bash
docker build -t tunet-dashboard .
docker run -d -p 3002:3002 -v tunet-data:/app/data --name tunet-dashboard tunet-dashboard
```

### Useful commands

```bash
docker logs tunet-dashboard       # View logs
docker stop tunet-dashboard       # Stop
docker start tunet-dashboard      # Start
docker rm tunet-dashboard         # Remove container
```

## Configuration

1. Open the dashboard in your browser
2. Click the **gear icon** to open System settings
3. Choose **OAuth2** (recommended) or **Token** authentication
4. Enter your Home Assistant URL (e.g. `https://homeassistant.local:8123`)
5. For token mode: paste a long-lived access token (HA → Profile → Security)

Dashboard layout is stored in `localStorage`. Profiles are stored server-side in SQLite.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3002` | Backend server port |
| `DATA_DIR` | `/app/data` | SQLite database directory |
| `NODE_ENV` | `production` | Environment mode |

## Troubleshooting

| Problem | Solution |
|---|---|
| Port in use | Change the port mapping in `docker-compose.yml` |
| Build fails | Ensure Docker has enough memory. Try `docker system prune -a` then rebuild |
| Native module error | The Dockerfile installs build tools automatically. If building locally, ensure `python3`, `make`, and `g++` are available |
| Connection error | Check HA URL and token. Verify CORS if using external access |
| Profiles not saving | Check that the backend is running (`/api/health`) |

## Release Workflow (Maintainers)

1. Prepare synchronized versions/changelogs:

```bash
npm run release:prep -- --app-version 1.0.0-beta.18 --addon-version 1.0.15
```

2. Validate metadata consistency:

```bash
npm run release:check
```

3. Run full release sanity checks:

```bash
npm run release
```

The `release:check` step is also enforced in CI on `main` PRs/pushes.

