# NITHUB Masterclass Demo

Live demo app for "Building Technology Infrastructure for Scale," NITHUB Innovation
Fair 2026. Two deployable services and one status strip, in service of segment 5:
an AI agent diagnosing a failing deploy, proposing a fix, and stopping at an
approval gate. The stop is the point.

The beat by beat script is in `demo-script-segment-5.md`. Read it before changing
anything about the failure behaviour, because the failure behaviour is choreography.

## What is here

```
apps/
  api/   Express service. /healthz for the Reoclo health check, /status for the
         strip (serving version plus container id), / for a plain string.
  web/   Vite React status strip. Polls /status, shows version and container,
         degrades visibly when the API is unreachable, stays up itself.
docs/
  REOCLO-SETUP.md    The Reoclo dashboard and CLI steps to stage the demo.
  STAGE-RUNBOOK.md   On the day pre-flight, beat mapping, and fallbacks.
```

Two apps, one status strip. Scope is frozen. Please do not add features here; any
spare hour belongs to the slide deck, which outranks this repo.

## The branches (they map to the demo)

| Branch | State | Used for |
| --- | --- | --- |
| `feature/inspect-files-zip` | Green baseline, healthy | The PR into `main`. Merge it, then this is your green deploy. |
| `broken` | Green plus a required `DATABASE_URL` that is not set | The deploy that fails and rolls back on stage. |
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

## Style

No em dashes anywhere: not in code, comments, UI copy, commit messages, or docs.
Use commas, periods, or parentheses. This is a global rule for this speaker.
