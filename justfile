# NITHUB demo, local dev routines. Run `just` to see them all.
# These drive the LOCAL docker stack only. Deploys are Reoclo, see docs/REOCLO-SETUP.md.

set shell := ["bash", "-cu"]

# list all recipes
default:
    @just --list

# start the dev stack with hot reload
up:
    docker compose up -d --remove-orphans
    @echo ""
    @echo "  web  http://localhost:5173"
    @echo "  api  http://localhost:3000/healthz"
    @echo ""
    @echo "  just logs      follow logs"
    @echo "  just degrade   stop the api to watch the strip go amber"
    @echo "  just down      stop everything"

# follow logs from both services
logs:
    docker compose logs -f

# show service status
ps:
    docker compose ps

# stop the dev stack
down:
    docker compose down --remove-orphans

# restart one service, e.g. just restart api
restart svc:
    docker compose restart {{svc}}

# rebuild and restart after changing deps
rebuild:
    docker compose up -d --build --remove-orphans

# stop the api so the web strip visibly degrades (demo aid)
degrade:
    docker compose stop api
    @echo "api stopped. the strip at http://localhost:5173 should go amber within ~2s."

# bring the api back so the strip recovers
heal:
    docker compose start api
    @echo "api started. the strip should return to green within ~2s."

# build and run the REAL images, exactly as Reoclo builds them (web on 8080)
up-prod:
    docker compose -f compose.prod.yaml up -d --build --remove-orphans
    @echo "  web  http://localhost:8080"
    @echo "  api  http://localhost:3000/healthz"

# stop the production parity stack
down-prod:
    docker compose -f compose.prod.yaml down --remove-orphans

# generate a QR png for a url, e.g. just qr https://demo.example.com
qr url:
    node scripts/make-qr.mjs {{url}}

# stop everything and drop the dev volumes for a clean node_modules next up
clean:
    docker compose down --remove-orphans --volumes
    -docker compose -f compose.prod.yaml down --remove-orphans
