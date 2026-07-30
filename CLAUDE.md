# NITHUB Masterclass Demo Repo

## What this is

The live demo application for a masterclass at the NITHUB Innovation Fair 2026:
"Building Technology Infrastructure for Scale." Speaker is David Ibia, founder of
Boxmarshall LLC.

**Hard deadline: Thursday 30 July 2026, 1:30 PM WAT.** Same-day crunch. Everything in this
repo exists to serve about ten minutes of stage time. Optimize for shipping and for not
failing on a projector, not for code quality.

## The talk context this code serves

Segment 5 of the session is the agentic AI centerpiece, 16 minutes. The demo shows an AI
agent diagnosing a failing deployment, proposing a fix, and then **stopping at an approval
gate to ask a human.** The stop is the entire point. Everything the code does is in service
of making that stop legible to a room of developers.

Full beat-by-beat script lives in `demo-script-segment-5.md`. Read it before changing
anything about the failure behaviour, because the failure behaviour is choreography.

## The stack it runs on

- **Reoclo** (DevOps-as-a-Service, BYOS). Deploys Docker images built on the target server,
  blue-green with health checks and automatic rollback. Orchestration is Reoclo's, execution
  stays on the server.
- Server is **already provisioned**. Linux, Runner agent installed.
- **GitHub external Actions** for build, handing off to Reoclo for deploy.
- **Reoclo secrets manager** for env injection.
- Temp domain on a subdomain of a domain David already controls.
- Agent side: **Claude Code** hosted in **Zed** as an ACP external agent, plus the Reoclo CLI
  and the Reoclo MCP server.

## What to build

A monorepo with two deployable services:

- **web**: the audience-facing app on the temp domain. Must include a live status strip
  showing the serving version and container, updating via polling or SSE, and it must visibly
  degrade when the API is unhealthy. The room loads this on their phones via a QR code, so
  it has to be legible on a small screen and survive fifty simultaneous clients.
- **api**: health endpoint at `/healthz`. On the broken commit it requires an env var that is
  absent from the environment, throws on boot, and fails the health check.

Reoclo deploys these as two apps from the one repo, path-based.

### The two-commit setup, order matters

1. **Green commit.** No missing secret. Deploy, let it pass, so a healthy baseline sits in the
   deployment history.
2. **Broken commit.** Adds the env var requirement without adding the secret. Deploy, let it
   fail and roll back. **This must be done before the session.** David walks on stage with the
   red deploy already in the list. The failure is never triggered live.

Keep a third branch with a deliberately broken Dockerfile layer, for a short recorded clip.

## The failure cascade

API needs a secret nobody added. Container starts, `/healthz` returns 500, Reoclo's blue-green
holds the old container and rolls back. Web stays up and shows the API as degraded. Production
never actually goes down, and that is a point David makes on stage before the agent appears.

The agent then diagnoses the missing secret via the Reoclo MCP server, following the
documented "Diagnose Deployment Failure" recipe. It must identify which secret is missing
**without ever printing a value.** Do not build anything that would cause a secret value to
surface in logs, in agent output, or in the status strip.

## Non-negotiables

- **No em dashes anywhere.** Not in code comments, UI copy, commit messages, or docs. Global
  style rule for this speaker. Use commas, periods, or restructure.
- **Scope is frozen.** Two services, one status strip. Do not add features, do not refactor,
  do not improve architecture. Every hour spent here is an hour the slide deck does not get.
- **The slide deck outranks this repo.** The demo can fall back to a recording. A missing deck
  cannot fall back to anything. If time gets tight, this repo is what gets cut.
- **DNS first.** Drop the subdomain TTL to 60 seconds before writing code. It is the one thing
  on the critical path that cannot be compressed. Do not register a new domain today. If DNS
  is not resolving by rehearsal time, serve on the IP and put the IP behind the QR.
- **Secrets used on stage must be throwaway credentials** that can be burned publicly.
- Font size 18pt or higher in any editor that will be projected.

## Open decisions

- **Monorepo stack is not chosen yet.** Candidates discussed: pnpm workspaces with Vite React
  plus Fastify; Turborepo with Next.js plus Express; pnpm with Next.js plus Hono. Pick the one
  David can debug fastest under pressure, which is more important than any technical merit.
  Ask before scaffolding if it is ambiguous.
- **Each Reoclo AI feature shown must be labelled GA, beta, or roadmap** before the talk. A
  room of developers will ask. "Ships next month" said confidently is fine. Being caught vague
  is not. This is David's call, not something to infer.

## Definition of done, in priority order

1. Green deploy in history, broken deploy in history, both on the real server.
2. Temp domain resolving and serving web, QR code generated.
3. Reoclo MCP server connected and verified with `claude mcp list`. Claude Agent in Zed
   authenticated, since it has its own auth separate from Zed's native agent.
4. Agent successfully diagnoses the missing secret and stops at the gate, rehearsed end to end.
5. **Full fallback run recorded**, one take, final font size, with David's actual narration
   rather than a silent capture.
6. Sixty-second vertical cut of the guardrail stop, recorded while the setup is still standing.

Item 5 is non-negotiable because venue internet is unconfirmed. Do not treat it as polish.

## Stage failure policy, relevant to how you build

One attempt at anything, then cut to the recording. Debugging on stage burns the room. Build
accordingly: prefer a boring path that works over a clever path that needs explaining, and
make every step recoverable by restarting rather than by fixing.
