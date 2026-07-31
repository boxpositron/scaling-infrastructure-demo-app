# NITHUB Masterclass Demo

Live demo app for "Building Technology Infrastructure for Scale," NITHUB Innovation
Fair 2026. Two deployable services and one status strip. The demo is an AI agent
diagnosing a failing deploy, proposing a fix, and stopping at an approval gate. The
stop is the point.

## The talk

The deck and the write-up both live on the portfolio:

- Slides: [Building Technology Infrastructure for Scale](https://boxpositron.dev/presentations/infrastructure-for-scale)
- Write-up: [A Bounded Agent Near a Live Deploy: What It Fixed, and What I Kept for Myself](https://boxpositron.dev/blog/nithub-infrastructure-for-scale), the companion article for the room, with the four part series linked from it.

## What is here

```
apps/
  api/   Express service. /healthz for the Reoclo health check, /status for the
         strip (serving version plus container id), / for a plain string.
  web/   Vite React status strip. Polls /status, shows version and container,
         degrades visibly when the API is unreachable, stays up itself.
docs/
  REOCLO-SETUP.md    The Reoclo dashboard and CLI steps to stage the demo.
  STAGE-RUNBOOK.md   Pre-flight checks, deploy commands, and fallbacks.
```

Two apps, one status strip. That is the entire scope.

## The branches (they map to the demo)

| Branch | State | Used for |
| --- | --- | --- |
| `main` | Green baseline, healthy | Your green deploy. Ship it first so a passing deploy sits in the history. |
| `broken` | Green plus a required `DATABASE_URL` that is not set | The deploy that fails its health check and rolls back. |
| `broken-dockerfile` | Green plus a failing build layer | The 40 second build break clip. |

Green and broken share the same green base commit, so the only difference between
a healthy deploy and the failing one is the single env var requirement. That is the
whole cascade: a new requirement, a missing secret, a failed health check, an
automatic rollback.

## Local development

```bash
pnpm install
pnpm dev            # runs api on :3000 and web on :5173 together
```

Check the api directly:

```bash
curl -s localhost:3000/healthz     # ok
curl -s localhost:3000/status      # {"status":"ok","version":"dev","container":"..."}
```

Point the web strip at an api during local dev by setting `VITE_API_BASE`:

```bash
VITE_API_BASE=http://localhost:3000 pnpm --filter web dev
```

To see the broken behaviour locally:

```bash
git switch broken
node apps/api/app.js               # throws: DATABASE_URL is not set
DATABASE_URL=anything node apps/api/app.js   # boots, /healthz returns 200
```

The api only checks that `DATABASE_URL` is present. It never connects to it, so any
throwaway string is a valid fix. That is what makes the stage secret safe to burn.

## Local dev with Docker and just

If you would rather not run node on the host, the whole stack comes up with one
command. Needs Docker and `just` (`brew install just`).

```bash
just up        # web on :5173, api on :3000, hot reload, deps installed on first run
just logs      # follow both services
just degrade   # stop the api so the strip visibly goes amber
just heal      # bring the api back, strip returns to green
just down      # stop everything
just           # list every recipe
```

`just up-prod` builds and runs the real images (web on :8080) exactly as Reoclo
builds them, for a sanity check before a deploy. This compose setup is for local
dev only. It is not how Reoclo deploys. See `docs/REOCLO-SETUP.md` for deploys.

## Docker

Both images build with the repository root as the Docker context, which is how
Reoclo builds monorepo apps. That is why the Dockerfiles copy from `apps/api/...`
and `apps/web/...` rather than from the current directory.

```bash
# api
docker build -f apps/api/Dockerfile -t nithub-api .
docker run --rm -p 3000:3000 -e APP_VERSION=green nithub-api

# web (bake in the public api url at build time)
docker build -f apps/web/Dockerfile --build-arg VITE_API_BASE=https://api.example.com -t nithub-web .
docker run --rm -p 8080:80 nithub-web
```

## Deploying with Reoclo

App creation happens in the Reoclo dashboard, then deploys are two CLI commands.
Full steps, verified against this org and server, are in `docs/REOCLO-SETUP.md`.
The short version:

```bash
reoclo apps deploy api --ref main --wait      # green, passes
reoclo apps deploy web --ref main --wait      # green, passes
reoclo apps deploy api --ref broken --wait    # fails health check, rolls back
```
