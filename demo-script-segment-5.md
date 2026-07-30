# Segment 5 Demo Script: Agentic AI with the Guardrail Stop

**NITHUB Innovation Fair 2026, Masterclass, Thursday 30 July, 1:30 to 2:30 PM**
Segment 5 runs 16 minutes inside the 60-minute session.

Stack on screen: Zed hosting Claude Code as an ACP external agent, Reoclo CLI, Reoclo MCP server.

---

## 1. The decision on "all four failures"

You asked for all four failure modes. Running four live diagnose-and-stop cycles is a
15-minute demo minimum, which eats segment 6 and your Q&A. Here is how you get all four
covered while only one runs live.

| Failure | How it appears | Cost |
| --- | --- | --- |
| Health check fails after deploy | Live, the visible symptom | in the live run |
| Missing secret / env var | Live, the root cause | in the live run |
| Docker build breaks | 30-second recorded clip | 40 sec |
| Bad DB migration | Spoken, never demoed, and that is the point | 60 sec |

The live incident is a **cascade**, which is what real incidents actually are: a new route
needs a secret nobody added, the container starts, the health check returns 500, Reoclo's
blue-green rolls back automatically. One setup, two failure modes, fully realistic.

The bad migration is your rhetorical capstone. You do not demo it because you would never
let an agent run it. Saying "here is the class of action where I do not give the agent
hands at all" is stronger than any successful demo, and it costs you a minute.

---

## 2. Why the missing secret is the right guardrail moment

The agent's proposed fix is to inject a secret into the environment. That is a privileged,
credential-touching, hard-to-undo action. When it stops and asks, nobody in the room needs
the significance explained. A Dockerfile edit would not carry the same weight.

There is a second, quieter guardrail beat available here, and it is worth taking. The agent
diagnoses a missing secret **without ever printing the value**. Call that out. It shows the
room a guardrail that is about blast radius rather than approval gates.

---

## 3. Pre-flight, run this before you leave for the venue

Do not discover any of this on stage.

- [ ] `claude mcp list` shows the Reoclo server connected. Config changes do not affect a
      running session, so if you touch config, restart Claude Code or reconnect via `/mcp`.
- [ ] Open a Claude Agent thread in Zed and confirm you are authenticated. Claude Agent has
      its own auth, separate from Zed's native agent. Run `/login` if needed.
- [ ] If the Reoclo MCP server is registered at project scope, approve the first-use prompt
      now. It shows as pending approval and stays disconnected until you do.
- [ ] `reoclo deployments list` returns from the venue network, or your hotspot.
- [ ] The broken commit is pushed and the failed deploy is **already in the history**. Do not
      trigger the failure live. Walk in with a red deploy waiting.
- [ ] Zed font size at 18pt or higher. Test from the back of the room.
- [ ] Fallback recording is on local disk, not cloud. Player open in another window.
- [ ] Secret value ready to paste, and it is a throwaway credential you can burn publicly.
- [ ] Phone hotspot on, tethered, tested.

**GA / beta / roadmap labels, fill these in before you speak.** A room of developers will
ask, and being caught vague costs more than any feature gap.

| Feature shown | GA / beta / roadmap |
| --- | --- |
| Reoclo MCP server | |
| Agent recipes at /agents/ | |
| Diagnose Deployment Failure recipe | |
| Inject Secrets into CI recipe | |
| Approval gate on privileged actions | |

---

## 4. Beat sheet

Times are elapsed within segment 5.

### 0:00 to 4:30, teach before you demo

No screen share yet. Slides only. You have already earned credibility in segments 2 to 4,
so this is short.

The helps-versus-burns split, honestly:

- **Helps:** reading logs, correlating a failure to a change, drafting a fix, writing the
  runbook nobody wrote, explaining an alert at 2 AM to whoever is awake.
- **Burns:** anything where being confidently wrong is expensive. Touching credentials.
  Migrations. Anything irreversible. Anything where the agent is filling a gap from memory
  instead of reading the actual system.

Then the three guardrails, which are your spine for the rest of the segment:

1. **Constrain the procedure.** The agent follows a verified recipe, it does not improvise
   from training data.
2. **Gate the privileged action.** Diagnosis is free. Acting on credentials or state is not.
3. **Limit the blast radius.** The agent never needs to see the secret to know it is missing.

Land this line before you switch inputs:

> "I am going to show you an agent operating real infrastructure. The most important thing
> it does in the next ten minutes is refuse to do something."

### 4:30 to 5:30, show the wreck

Switch to Zed. Terminal pane.

```
reoclo deployments list
```

A failed deploy is sitting at the top. Then:

```
reoclo logs --deployment <id> --tail 40
```

Health check on `/healthz` returned 500. Blue-green kept the old container alive and rolled
back. Say that out loud, because it is a product point you get for free:

> "Notice production never went down. The platform did that without an agent and without me.
> Automated rollback is not AI, it is just competent defaults. Get that in place before you
> let any agent near your infrastructure."

That sentence is why the room trusts you when the agent shows up ten seconds later.

### 5:30 to 9:00, the live diagnosis

Move to the Claude Agent thread in Zed. Type the prompt visibly, do not paste it. Watching
you type is what makes it read as live.

> Use the Reoclo MCP server. Deployment `<id>` failed its health check and rolled back.
> Follow the Diagnose Deployment Failure recipe exactly. Do not infer steps. Report the root
> cause and propose a fix. Do not apply anything.

While it runs, you have 60 to 90 seconds of thinking time. Fill it deliberately, do not
narrate the spinner:

> "This is fetching a recipe from Reoclo's docs, a machine-readable procedure at
> `/agents/`. The recipe opens by telling the model: follow this exactly, do not infer steps
> from training data, do not substitute field names or API paths from memory, verify, then
> stop. That instruction is the entire difference between a demo and something I would run on
> a Friday afternoon. It turns an unpredictable generalist into a reliable operator."

That is your best 30 seconds of content in the segment, and dead air is where you deliver it.

Expected output: the new route reads an env var that is not in the environment, the app throws
on boot, `/healthz` returns 500. Proposed fix: add the secret via the secrets manager and
redeploy.

**Point at the screen and say what is not there:**

> "It told me which secret is missing. It never asked for the value, and it never printed one.
> It did not need to. That is guardrail three, and it is the one people forget."

### 9:00 to 11:00, the stop

This is the 90 seconds the whole session is built around. Slow down. Stop moving.

The agent has proposed the fix and halted. In Zed you should have a pending diff or a stated
proposal awaiting your input rather than an applied change.

Let the silence sit for a beat before you speak. Then:

> "It stopped. It knows the fix, it has the tools to apply it, and it is asking me first.
> Writing a secret is privileged. That is not the model being cautious, and it is not me
> being lucky. The recipe says stop, and the platform will not take a privileged action
> without a human. This is the part I would want to see before I trusted any of this in
> production."

Then approve it yourself, out loud, and inject the secret. Redeploy:

```
reoclo deployments create --app <app>
```

Health check goes green. Blue-green swaps. Say the closing line on the beat:

> "Diagnosis was automated. The decision was mine. That is the split."

### 11:00 to 13:00, the other three minutes of coverage

Play the 30-second build-break clip. Agent reads the build log, identifies the failing layer,
proposes the Dockerfile change. Low drama on purpose, and that is the point: most of what an
agent does for you is boring and useful.

Then the migration, spoken, with the screen left on the green deploy:

> "One thing I did not show you. I do not let the agent near database migrations. Not gated,
> not approved, not at all. A bad migration is not a failed deploy, it is data you may not get
> back, and a rollback is a different kind of operation. The agent can tell me a migration
> broke. It does not get to fix it. Knowing which class of action to keep out of reach
> entirely is the judgment call, and no tool makes it for you."

### 13:00 to 14:30, tie it back

Return to the three-guardrail slide. Point at each one and name where the room just saw it:
recipe-constrained diagnosis, the approval gate on the secret, the value never printed. Then
the honest boundary:

> "None of this makes the agent trustworthy. It makes it *bounded*, and bounded is what you
> can actually put in front of production."

### 14:30 to 16:00, buffer

If the demo ran clean you are early, which is good going into the checklist close. Do not
fill the time. Move to segment 6.

---

## 5. Failure fallbacks, per beat

Rehearse these until switching costs you no visible thought.

| Fails | Do this |
| --- | --- |
| Venue wifi dies | Hotspot. If that fails, cut to the recording mid-sentence. Do not announce it as a failure, just say "here is a run I recorded this morning" and keep going. |
| MCP server will not connect | Recording. Do not debug on stage. Give it one `/mcp` reconnect attempt, maximum, then switch. |
| Claude Agent auth prompt appears | Recording. Do not run `/login` in front of the room. |
| Agent diagnoses wrong | Best moment available to you. Stop, say "that is wrong, and this is exactly why the approval gate exists," then reject it. Do not rescue it. A rejected bad proposal proves your thesis harder than a correct one. |
| Agent applies without stopping | Say so plainly, immediately. "That should have stopped and it did not. That is a bug and I will file it." Credibility survives a bug. It does not survive being caught covering one. |
| Health check stays red after fix | Cut to recording. Do not troubleshoot live. |
| Running long at 13:00 | Drop the build-break clip and the tie-back. Keep the stop and the migration line. |

The rule: **one attempt at anything, then switch.** Debugging on stage burns the room's
attention and there is no recovery from it.

---

## 6. Demo app spec

Keep it small enough to read on a projector.

`app.js`

```js
const express = require("express");
const app = express();

// The line that breaks the deploy. Absent from the environment on the broken commit.
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  throw new Error("DATABASE_URL is not set");
}

app.get("/healthz", (_req, res) => res.status(200).send("ok"));
app.get("/", (_req, res) => res.send("nithub demo"));

app.listen(3000, () => console.log("listening on 3000"));
```

`Dockerfile`

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
```

Reoclo health check path: `/healthz`.

Two commits, and the order matters:

1. **Green commit.** No `DATABASE_URL` requirement. Deploy it, let it pass, so the room sees
   a healthy baseline in the deployment history.
2. **Broken commit.** Adds the requirement without adding the secret. Deploy it, let it fail
   and roll back. **Do this before the session.** You want to walk on stage with the red
   deploy already in the list.

Keep a third branch with a deliberately broken `Dockerfile` layer for the build-break clip.

---

## 7. Recording the fallback

Record the full run this morning, in one take, at final font size, with your actual narration.
Not a silent screen capture. If you have to cut to it mid-sentence you want your own voice
already talking.

Then cut a separate 60-second vertical version of the stop, from proposal to approval. That
is your post-talk social asset and the thing that pushes article 4. Record it while the setup
is still standing, because reassembling it later will not happen today.
