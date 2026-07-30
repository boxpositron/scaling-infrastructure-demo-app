---
name: reoclo-cli-usage
description: Use when operating Reoclo from the terminal with the `reoclo` CLI (or its `rc` alias): signing in; managing servers, apps, containers, and deployments; cloud server power controls; tailing and searching logs; running commands or shells on servers; tunnels; env vars; domains; secrets and `run`; uptime monitors, status pages, and incidents; alerts and notification channels; git repos, providers, and container registries; scheduled operations; audit logs; and scripting Reoclo with JSON/YAML output.
---

# reoclo-cli-usage: Operate Reoclo from the CLI

## Overview

`reoclo` is the command-line client for the Reoclo platform. It manages servers, applications, containers, deployments, logs, domains, secrets, monitoring, and more from your terminal. `rc` is a built-in short alias for `reoclo`. This skill covers using the released CLI; it is not about building the CLI itself.

Every command level supports `--help` (for example `reoclo servers --help`, `reoclo apps deploy --help`). Use it to see the exact flags for any command. This skill lists what exists and how the pieces fit; `--help` is the source of truth for flags.

## Install and update

```bash
curl -sSL https://get.reoclo.com/cli | bash     # macOS / Linux
brew install reoclo/tap/reoclo                   # Homebrew
reoclo upgrade                                   # self-update (--check to dry-run)
```

The binary is self-contained (no Node or Bun runtime needed).

## First run

```bash
reoclo login          # OAuth device flow (opens a browser; --no-browser to print the URL)
reoclo whoami         # confirm identity + active organization
reoclo org ls         # organizations your credential can access
reoclo org use <slug> # switch active organization
reoclo logout         # remove stored credentials (defaults to the active profile)
```

## Global flags (work on every command)

| Flag | Effect |
|------|--------|
| `-o, --output <text\|json\|yaml>` | output format; use `json` for scripting |
| `--quiet` | suppress non-error output |
| `--verbose` | log HTTP requests (tokens redacted) |
| `--no-color` | disable ANSI colors |
| `--profile <name>` | use a named profile (multi-account/multi-env); equivalent to `$REOCLO_PROFILE` |

## Command map

Every top-level command group. Drill in with `<group> --help`.

| Group | Purpose |
|-------|---------|
| `login` / `logout` / `whoami` | authenticate, sign out, show identity |
| `org` | switch the active organization within the OAuth grant |
| `profile` | manage named profiles (accounts / environments) |
| `keyring` | move stored tokens between config.json and the OS keyring |
| `servers` | list, inspect, rename servers; health, ports, uptime, reboot; cloud `power` |
| `containers` | fleet containers: list, inspect, logs, restart, recreate, scale, labels |
| `apps` | list, inspect, deploy, restart apps; manage deployment `config` |
| `deployments` | deployment history, details, stages, build/runtime logs |
| `logs` | tail, search, systemd journal, sources, storage stats and usage |
| `env` | application environment variables (write-only values) |
| `domains` | register, verify, and health-check domains |
| `secrets` | secret projects, keys, reveal, set, import |
| `run` | resolve granted secrets and run a command with them as env vars |
| `monitors` | uptime monitors |
| `status-pages` | public status pages |
| `incidents` | incidents and incident updates |
| `alerts` | alert instances, ack/resolve, mutes, routing, catalog |
| `channels` | notification channels (Slack, Discord, and so on) |
| `repos` | mirrored git repositories |
| `providers` | git providers (GitHub, Gitea): connect, sync, status |
| `registry` | container registry credentials; docker login/logout on a server |
| `schedule` | scheduled operations: create, list, pause, trigger, runs |
| `audit` | organization audit log |
| `dashboard` | organization summary (counts, recent activity, deploys) |
| `exec` / `shell` | run one-shot commands or an interactive shell on a server |
| `tunnel` | TCP/UDP tunnels through a runner |
| `checkout` / `deploy` | CI helpers: clone a repo on a server, external deploy sync |
| `init` | link this project to an organization and install reoclo skills |
| `mcp` | start the stdio MCP server |
| `completion` | shell completion for bash, zsh, fish |
| `upgrade` | self-update the CLI |

Most commands accept either a resource **id** or its **slug**. Slugs are the recommended, stable identifier and are what tab completion offers.

## Servers

```bash
reoclo servers ls                          # slug, name, hostname, IP, status, runner
reoclo servers get <idOrSlug>              # full record
reoclo servers metrics <idOrSlug>          # latest CPU / RAM / disk from the runner
reoclo servers health <idOrSlug>           # health state
reoclo servers ports <idOrSlug>            # listening ports + firewall
reoclo servers uptime <idOrSlug>           # connectivity uptime (--hours)
reoclo servers containers <idOrSlug>       # containers running on this server
reoclo servers set-slug <idOrSlug> <slug>  # rename the slug
reoclo servers reboot <idOrSlug>           # OS reboot via the runner (--yes to skip prompt)
```

## Server power (cloud)

For cloud-managed servers, drive the provider's power controls. These work only where the server has a cloud provider and credentials configured, and only for operations that provider supports (check with `capabilities`). This is separate from `reoclo servers reboot`, which reboots the OS through the runner.

```bash
reoclo servers power capabilities <server>   # what this provider supports
reoclo servers power status <server>         # live power state
reoclo servers power on <server>
reoclo servers power off <server> --yes      # hard power cut; --yes skips the prompt
reoclo servers power shutdown <server>       # graceful shutdown
reoclo servers power reboot <server>         # provider reboot (not the runner reboot)
reoclo servers power reset <server>          # hard reset
```

Add `--wait` to block until the server reaches its target state (for example `reoclo servers power off <server> --wait`), giving up after `--wait-timeout` seconds (default 120). `off`, `shutdown`, `reboot`, and `reset` prompt for confirmation unless you pass `--yes`.

## Running commands and shells on a server

Runs over the server's runner. No inbound SSH needed.

```bash
reoclo exec <server> -- docker ps                          # use -- to separate the remote command
reoclo exec --shell bash <server> -- 'docker ps | wc -l'   # pipes/redirects/globs
reoclo exec --env-file .env.prod <server> -- ./migrate.sh  # inject env (masked in output)
reoclo shell <server>                                      # interactive shell
```

## Containers (fleet)

Cross-server container operations. Target a container by `<server> <name>`.

```bash
reoclo containers ls                              # fleet containers (filters via --help)
reoclo containers refresh                         # trigger a fleet snapshot refresh
reoclo containers inspect <server> <name>         # config + env (masked by default)
reoclo containers logs <server> <name>            # fetch or follow (--follow)
reoclo containers restart <server> <name>
reoclo containers recreate <server> <name>        # new env/labels/ports (see --help)
reoclo containers scale <server> <name> <n>       # scale a Swarm service
reoclo containers labels <server> <name>          # patch labels (see --help)
```

## Applications and deployments

```bash
reoclo apps ls
reoclo apps get <idOrSlug>
reoclo apps deploy <idOrSlug>          # trigger a deployment
reoclo apps restart <idOrSlug>         # restart the backing container
reoclo apps logs <idOrSlug>            # container logs for the app
reoclo apps config --help              # manage deployment config

reoclo deployments ls                  # organization deployment history
reoclo deployments get <id>            # full details incl. build stages
reoclo deployments stages <id>         # build / push / deploy stages
reoclo deployments logs <id> --build   # build stage logs
```

## Logs

```bash
reoclo logs tail --server <server> --source container --name <name>   # fetch or follow (--follow)
reoclo logs search <query>            # across servers and sources
reoclo logs system <server>           # systemd journal
reoclo logs sources <server>          # containers + systemd units available
reoclo logs stats                     # tenant-wide storage totals + per-server
reoclo logs usage                     # storage and retention
```

## Env vars

```bash
reoclo env ls                              # keys only; values are write-only via the API
reoclo env set KEY=value [KEY2=value2 ...]
reoclo env rm KEY
```

## Domains

```bash
reoclo domains ls
reoclo domains get <fqdnOrId>
reoclo domains add <fqdn>                  # then:
reoclo domains verify <fqdnOrId>           # TXT record to add
reoclo domains dns <fqdnOrId>              # DNS records + verification status
reoclo domains health <fqdnOrId>           # DNS + TLS + uptime
reoclo domains rm <fqdnOrId>               # decommission
```

## Secrets and run

Secrets live in projects. `run` injects the secrets a credential is granted into a child process as env vars.

```bash
reoclo secrets projects --help         # manage secret projects
reoclo secrets ls --project <name>     # list keys in a project
reoclo secrets get <key> --project <name>   # reveal a value
reoclo secrets set <key> --project <name>   # create or update
reoclo secrets rm <key> --project <name>
reoclo secrets import --help           # import from an external source

reoclo run -- ./my-app                 # run with granted secrets injected as env vars
```

## Monitoring: monitors, status pages, incidents

```bash
reoclo monitors ls | get <id> | create | update <id> | pause <id> | resume <id> | rm <id>
reoclo status-pages ls | get <id> | create | update <id> | rm <id>
reoclo incidents ls | get <id> | create | update <id> | add-update <id>
```

`reoclo incidents update <id> --state resolved` resolves an incident. Use `--help` on `create` / `update` for the field flags.

## Alerts and notification channels

```bash
reoclo alerts list                     # alert instances (filters via --help)
reoclo alerts get <instance-id>        # with severity history
reoclo alerts ack <instance-id>
reoclo alerts resolve <instance-id>
reoclo alerts history                  # recently resolved
reoclo alerts mute [alert-code]        # mute a code for a resource (omit code to mute all)
reoclo alerts mutes                    # manage mutes
reoclo alerts unmute <mute-id>
reoclo alerts routing --help           # manage alert routing
reoclo alerts catalog --help           # manage the alert catalog

reoclo channels list
reoclo channels kinds                  # available provider kinds
reoclo channels create <kind>          # for example: slack, discord
reoclo channels test <id>              # send a test notification
reoclo channels enable <id> | disable <id> | update <id> | delete <id>
```

## Git repos, providers, and registries

```bash
reoclo repos ls | get <repo> | branches <repo>

reoclo providers ls | get <provider>
reoclo providers connect <provider>    # start OAuth (opens browser)
reoclo providers sync <provider>       # queue a repo sync
reoclo providers status <provider>     # sync status
reoclo providers test <provider>       # connection / refresh-token health

reoclo registry ls | get <id> | create | update <id> | rm <id>
reoclo registry test                   # test a connection (ad-hoc)
reoclo registry login <serverId>       # docker login on a managed server (CI)
reoclo registry logout <serverId>
```

## Scheduled operations

```bash
reoclo schedule ls
reoclo schedule get <id>
reoclo schedule create --help          # cron-style operations
reoclo schedule update <id> | pause <id> | resume <id> | rm <id>
reoclo schedule trigger <id>           # run now
reoclo schedule runs <id>              # list runs
reoclo schedule run <id> <runId>       # show one run
```

## Audit and dashboard

```bash
reoclo audit ls                        # organization audit log (filters via --help)
reoclo dashboard                       # org summary: counts, recent activity, deploys
```

## Tunnels

Authenticated TCP/UDP tunnels through a server's runner (no SSH keys, no inbound firewall rules):

```bash
reoclo tunnel <server> -L 5432:5432                 # forward localhost:5432 to server's 127.0.0.1:5432
reoclo tunnel <server> -L 8080:internal-db:5432     # forward to a different remote host
reoclo tunnel <server> -R 8080:3000                 # reverse: server's :8080 to your localhost:3000
reoclo tunnel <server> -L 53:53 --udp               # UDP
reoclo tunnel ls                                    # live + historical sessions
reoclo tunnel close <tunnelId>
```

Tunnels survive transient runner reconnects (parked, then resumed).

## Profiles

Each profile holds its own credential and active org, so profiles let you switch between accounts and environments (for example prod vs. staging).

```bash
reoclo profile ls                          # list configured profiles
reoclo login --profile staging             # create / authenticate a profile
reoclo profile use staging                 # set the default profile persistently
```

Select a profile per-invocation two ways, both honored by every command:

```bash
reoclo --profile staging servers ls        # global flag (works before or after the subcommand)
REOCLO_PROFILE=staging reoclo servers ls   # env var (handy to export for a shell session)
```

Precedence: `--profile` flag, then `$REOCLO_PROFILE`, then the active profile from `reoclo profile use`.

## Keyring

By default the CLI stores tokens in the OS keyring. Move them if you need to:

```bash
reoclo keyring status
reoclo keyring migrate    # config.json -> OS keyring (--profile, else all)
reoclo keyring export     # OS keyring -> config.json
```

## CI and automation credentials

Automation keys are scoped to a fixed command set: `apps deploy`, `apps restart`, `exec`, `shell`, `checkout`, `registry login`, `registry logout`, `deploy sync`, and `run`. Everything else needs an interactive org login.

CI helpers:

```bash
reoclo checkout <serverId>             # clone or update a git repo on a managed server
reoclo deploy sync --help              # external deploy sync
reoclo registry login <serverId>       # docker login on a managed server
```

## MCP server

```bash
reoclo mcp                             # start the stdio MCP server (for MCP-capable agents)
```

## Scripting

`-o json` makes every command pipeable:

```bash
reoclo servers ls -o json | jq -r '.[] | select(.status=="active") | .slug'
reoclo apps ls -o yaml
```

## Shell completion

```bash
reoclo completion install        # detects your shell, writes + wires the completion file
reoclo completion bash           # or print a shim for bash | zsh | fish
```

Resource completion is cache-only: it reads slugs from the local cache that `reoclo servers ls` / `reoclo apps ls` populate. Run any `ls` once on a fresh install to warm it.

## Tips

- Stuck on a subcommand? Every level supports `--help`.
- Most commands accept either a resource id or its slug.
- Use `-o json` for anything you script; text output is for humans.
