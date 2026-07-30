# Stage runbook, segment 5

One page for the day. The full narration is in `demo-script-segment-5.md`. This is
the operational layer under it: what is done, what is yours, the exact commands, and
the fallbacks. Rule for the whole segment: one attempt at anything, then cut to the
recording. Debugging on stage burns the room.

---

## Status of the build

Done and verified overnight:

- [x] Monorepo scaffolded: `apps/api` (Express) and `apps/web` (Vite React strip).
- [x] api `/healthz`, `/status` (version plus container, no secrets), `/` verified
      running, both locally and as a Docker image built with the repo root context.
- [x] web strip built and served from nginx, api base baked in at build time,
      SPA fallback working, degrades visibly when the api is unreachable.
- [x] Green baseline, `broken` branch (missing `DATABASE_URL`), and
      `broken-dockerfile` branch (failing build layer) all pushed to origin.
- [x] Full cascade proven locally: broken commit throws on boot, injecting
      `DATABASE_URL` boots it healthy with `/healthz` at 200.
- [x] The broken Dockerfile build fails at the expected layer with a clear
      "Missing script: build" log for the clip.

Yours, and only yours (see `docs/REOCLO-SETUP.md` for the steps):

- [ ] Connect the GitHub provider in Reoclo, create the app group and the two apps.
- [ ] Deploy green, then deploy `broken`, so the failed deploy sits in history.
- [ ] DNS: drop the subdomain TTL to 60s early, or fall back to the IP
      `178.105.18.24` behind the QR. Do not register a new domain today.
- [ ] Reoclo MCP server connected and verified with `claude mcp list`.
- [ ] Claude Agent thread authenticated in Zed (its own auth, separate from Zed).
- [ ] Record the full fallback run, one take, final font size, your narration.
- [ ] Record the 60 second vertical cut of the stop.
- [ ] Fill the GA / beta / roadmap table in `docs/REOCLO-SETUP.md`.
- [ ] Generate the final QR once the web url is live (see below).

## Pre-flight, run before you leave

```bash
reoclo whoami                       # org nithub-demo
reoclo deployments ls               # green SUCCEEDED, broken FAILED at the top
reoclo apps get web                 # note the public url for the QR
claude mcp list                     # Reoclo server connected
```

- [ ] Failed `broken` deploy is at the top of `reoclo deployments ls`.
- [ ] Web url opens on your phone, strip is green.
- [ ] Zed font at 18pt or higher, tested from the back.
- [ ] Fallback recording is on local disk, player open in another window.
- [ ] Throwaway `DATABASE_URL` value is on your clipboard.
- [ ] Phone hotspot on and tested.

## The commands, in beat order

Wreck (4:30 to 5:30):

```bash
reoclo deployments ls
reoclo logs tail --server nithub-prod-01 --source container --name api | tail -40
```

The diagnosis prompt goes to the Claude Agent thread in Zed, typed not pasted. It is
in the script at beat 5:30. It uses the Reoclo MCP server and the Diagnose Deployment
Failure recipe, reports the root cause, proposes the fix, applies nothing.

The stop (9:00 to 11:00): the agent has proposed injecting `DATABASE_URL` and halted.
Let the silence sit. Then approve it yourself and inject:

```bash
reoclo apps config set api --env DATABASE_URL=<throwaway on your clipboard>
reoclo apps deploy api --ref broken --wait
```

Health goes green, blue-green swaps, the strip on 50 phones flips back to healthy.
Closing line: "Diagnosis was automated. The decision was mine. That is the split."

Build break clip (11:00 to 13:00): play the recorded `broken-dockerfile` clip. Then
the migration line, spoken, screen left on the green deploy.

## Fallbacks, per beat

| Fails | Do this |
| --- | --- |
| Venue wifi dies | Hotspot. If that fails, cut to the recording mid sentence. Do not announce it as a failure. |
| MCP will not connect | One `/mcp` reconnect attempt, then the recording. Do not debug on stage. |
| Claude Agent auth prompt appears | Recording. Do not run `/login` in front of the room. |
| Agent diagnoses wrong | Best moment you have. "That is wrong, and this is exactly why the gate exists." Reject it. |
| Agent applies without stopping | Say so immediately. "That should have stopped. That is a bug and I will file it." |
| Health stays red after the fix | Cut to the recording. Do not troubleshoot live. |
| Running long at 13:00 | Drop the build break clip and the tie back. Keep the stop and the migration line. |

## QR, once the web url is live

```bash
node scripts/make-qr.mjs https://<your web url>       # writes web-qr.png
```

If DNS is not resolving by rehearsal, generate it for the IP instead:

```bash
node scripts/make-qr.mjs http://178.105.18.24
```

A provisional `web-qr.png` for the IP is already in the repo root. Regenerate it once
the real url exists.

There are two QR codes, do not mix them up:

- `web-qr.png` sends the room to the **live status strip** (the app on their phones).
- `event-followup-qr.png` sends the room to the **follow-up article**, the companion
  page that recaps the demo and links the four part series and the code. It points to
  `https://boxpositron.dev/blog/nithub-infrastructure-for-scale` and is already live.
  Put this one on your closing slide.

Regenerate the follow-up QR any time with:

```bash
node scripts/make-qr.mjs https://boxpositron.dev/blog/nithub-infrastructure-for-scale event-followup-qr.png
```
