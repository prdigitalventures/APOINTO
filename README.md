# APOINTO

Universal AI-Powered Booking Platform for Indian SMBs.

## Stack

- **API**: Express + SQLite (`server/`)
- **Web**: React + Vite (`frontend/`)
- **Package manager**: pnpm workspaces

## Local development

```bash
corepack enable
pnpm install
pnpm db:prepare
pnpm dev
```

- API: http://localhost:3001
- Web: http://localhost:5173

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start API and web dev servers |
| `pnpm build` | Build all packages |
| `pnpm test` | Run package tests |
| `pnpm db:prepare` | Initialize the local SQLite database |

## Cloud Agent environment

Repository-managed environment configuration lives in `.cursor/environment.json`. Install prepares dependencies and the SQLite database; `api` and `web` terminals start the development servers.
