# Reoclo setup: staging the demo

This is the part that has to happen in the Reoclo dashboard plus a few CLI
commands. It cannot be scripted end to end from the CLI, because the current CLI
(0.58.0) has no `apps create` and no non-interactive server exec. App creation is
a dashboard action. Everything after that is CLI.

Known facts, already verified:

- Org: `nithub-demo` (you are Admin). `reoclo whoami` confirms it.
- Server: `nithub-prod-01`, IP `178.105.18.24`, runner connected and healthy.
- Repo: `boxpositron/scaling-infrastructure-demo-app`.
- Branches pushed: `feature/inspect-files-zip` (green, open as a PR into main),
  `broken`, `broken-dockerfile`.

Estimated time: about 10 minutes, most of it in the dashboard once.

---

## Two deployment paths, and which to use when

There are two ways to get these services onto the server, and they are good at
different things. The demo needs the first one.

- **Native Reoclo apps** (dashboard created). Reoclo builds each app from its
  Dockerfile on the server, blue-green, health gated, with automatic rollback, and
  every deploy shows in `reoclo deployments ls`. The failed deploy that holds the old
  container and rolls back, and the `reoclo deployments list` opening beat, both come
  from this model. Steps for it are below.
- **External GitHub Actions** (`.github/workflows/deploy.yml`). CI builds the two
  images, pushes them to GHCR, and the server pulls and starts them with
  `docker compose up -d`. Good for hands off green releases. It does not health gate
  or roll back, so a broken image crash loops instead of holding the old one, and
  these deploys do not populate `reoclo deployments ls`. Do not run the failure demo
  through this path. Setup is in the last section of this doc.

For the talk: stage the green and broken deploys on native apps, because the beats
depend on it. Use the GitHub Actions workflow for healthy releases after the event.

## Step 0. Main is the green baseline

PR #1 is merged, so `main` is the green, healthy app. `--ref main` is your green
deploy and `--ref broken` is the failure.

## Step 1. Connect the GitHub provider

Reoclo needs to read the repo to build it. This was not connected yet.

```bash
reoclo providers connect github     # opens a browser for OAuth
reoclo providers ls                 # confirm CONNECTED shows the GitHub org
reoclo repos ls                     # confirm the repo is mirrored
```

If the repo does not appear after connecting, trigger a sync:

```bash
reoclo providers sync github
```

## Step 2. Create the application group and two apps (dashboard)

In the dashboard, Application Groups, create a group on the shared repo
`boxpositron/scaling-infrastructure-demo-app`, server `nithub-prod-01`. Add two
applications to it. Use these exact settings.

### App: api

| Setting | Value |
| --- | --- |
| Slug | `api` |
| Dockerfile path | `apps/api/Dockerfile` |
| Build context | repository root (Reoclo default) |
| Container port | `3000` |
| Health check path | `/healthz` |
| Branch | `main` |
| Auto deploy on push | off (you want to control the timing) |

### App: web

| Setting | Value |
| --- | --- |
| Slug | `web` |
| Dockerfile path | `apps/web/Dockerfile` |
| Build context | repository root (Reoclo default) |
| Container port | `80` |
| Health check path | `/` |
| Branch | `main` |
| Build arg | `VITE_API_BASE` set to the public url of the api app |
| Auto deploy on push | off |

The `VITE_API_BASE` build arg is what points the status strip at the api. If you do
not know the api's public url until after its first deploy, deploy api first, read
its url from `reoclo apps get api`, set the build arg on web, then deploy web.

Confirm both apps exist:

```bash
reoclo apps ls
```

## Step 3. Deploy the green baseline, let it pass

```bash
reoclo apps deploy api --ref main --wait
reoclo apps deploy web --ref main --wait
reoclo apps get api
reoclo apps get web
```

Both should be healthy. Open the web url on your phone. The strip should be green
and show the serving version and the container id. This is your baseline in history.

## Step 4. Deploy the broken commit, let it fail and roll back

This is the deploy you want sitting at the top of the history when you walk on.
Do this before the session. Do not trigger the failure live.

```bash
reoclo apps deploy api --ref broken --wait
```

Expected: the build succeeds, the container starts, `/healthz` never returns 200
because the app threw on boot (`DATABASE_URL is not set`), Reoclo holds the old
container and marks this deployment FAILED. The web strip stays up. Because
blue-green kept the previous healthy api container, the strip keeps showing the
green version. That is the "production never went down" point.

Confirm the history reads green then failed:

```bash
reoclo deployments ls
reoclo logs tail --server nithub-prod-01 --source container --name api | tail -40
```

## Step 5. Prepare the fix (do not apply it until the stage moment)

The fix is to inject the missing secret and redeploy. Have the value ready to paste.
It is a throwaway, because the app only checks presence, never connects.

Two ways to hold the value. Pick one and rehearse it.

Env var on the app (simplest):

```bash
reoclo apps config set api --env DATABASE_URL=postgres://demo:demo@db.internal:5432/demo
reoclo apps deploy api --ref broken --wait     # now green, health check passes
```

Or via the secrets manager, if you want to show that surface:

```bash
reoclo secrets set DATABASE_URL --project nithub-demo --value postgres://demo:demo@db.internal:5432/demo
# then wire the secret into the api app env in the dashboard, and redeploy
```

The `reoclo deployments create --app <app>` line in the script maps to
`reoclo apps deploy api --ref broken --wait` with this CLI version.

## Step 6. The blast radius point

The agent diagnoses the missing secret without ever printing its value. Nothing in
this repo prints a secret value: not the api, not `/status`, not the strip, not the
logs. Keep it that way. When you inject the value, do it in a terminal you control,
not on the shared screen if you can avoid it.

---

## Guardrail labels, your call before you speak

Fill these in. The room will ask and being vague costs more than a feature gap.
This is your call, not something to infer.

| Feature shown | GA / beta / roadmap |
| --- | --- |
| Reoclo MCP server | |
| Agent recipes at /agents/ | |
| Diagnose Deployment Failure recipe | |
| Inject Secrets into CI recipe | |
| Approval gate on privileged actions | |

## If something is not as described

If the dashboard flow differs from the table above (field names, where the build arg
lives, how the group binds apps), trust the dashboard and adjust. These settings come
from the Reoclo docs and the CLI surface, not from a dashboard I could see. Verify
each app's config with `reoclo apps config get <slug>` after you create it.

---

## External deployment via GitHub Actions

`.github/workflows/deploy.yml` builds both images, pushes them to GHCR, has the
server pull and start them with `reoclo/run`, then registers the proxy routes with
`reoclo/deploy-sync`. The server compose file is `compose.deploy.yaml`, which carries
the `reoclo.managed` and `reoclo.app` labels and attaches each service to the
`reoclo-proxy` network.

Set up once:

1. **Automation key.** In the Reoclo dashboard create an automation API key with the
   `deploy_session:open` permission. It starts with `rca_`.
2. **GitHub secret.** Add it as `REOCLO_API_KEY` under the repo's `production`
   environment (Settings, Environments, production, Secrets). The deploy job already
   targets `environment: production`.
3. **Repo variable.** Add `VITE_API_BASE` (Settings, Variables) set to the public URL
   of the api app. The web bundle bakes it in at build time.
4. **Registry access.** The workflow logs in to GHCR with the built in token, so
   private packages work. If you would rather, make the two packages public and the
   server pull needs no login.

After that, every push to `main` builds, pushes, and deploys. You can also run it by
hand from the Actions tab with a ref.

Things to verify against your Reoclo, since I could not from here:

- `server_id` in the workflow is the slug `nithub-prod-01`. If the action wants the
  UUID, it is `0bc86500-40c1-4e67-a4a2-4bf166b6e319`.
- The compose file lands at `/srv/reoclo/nithub-demo` on the server and starts there.
  The runner pre-creates `/srv/reoclo/`. Confirm the path and permissions.
- The `reoclo.app` labels bind each service to a Reoclo app of the same slug (`api`,
  `web`), so those apps still need to exist for deploy-sync to route them.
- In this path, `DATABASE_URL` comes from the deploy environment, not the Reoclo
  secrets manager, so injecting the demo fix means setting it in the environment and
  redeploying. One more reason to keep the failure demo on native apps.

Why this path does not carry the demo: `docker compose up -d` replaces the running
container without a health gate, so a broken image crash loops rather than holding the
old one, and the run does not show in `reoclo deployments ls`. Both of those are load
bearing in the script, so the failure and rollback beats stay native.
