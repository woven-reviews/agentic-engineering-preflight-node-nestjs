# Environment Preflight — Node.js + NestJS

A tiny app on the **same stack** you'll use for the assessment — Node.js 24 + NestJS + TypeORM +
Postgres backend, React + TypeScript + Vite frontend, all orchestrated with Docker Compose. It
does nothing interesting on purpose: its only job is to confirm your machine can **build and run
the stack** *before* your timer starts, so you don't lose any of your window to setup.

Run this ahead of time. If it comes up green, you're ready.

## Run it

```bash
docker compose up --build
```

First run pulls the base images, runs `npm ci`, installs Playwright's Chromium, and builds the
session-log extractor's image — that's the slow part. The `Dockerfile`, every `package.json` and
`package-lock.json` are exact copies of the assessment's, so those image layers are reused as-is
when the real app builds. Subsequent runs are fast.

Then open:

- **Frontend:** <http://localhost:5174> — should show **✅ Stack is up** with `database: ok`.
- **API health:** <http://localhost:3100/api/v1/health> → `{"status":"ok"}`

Seeing the green check on the frontend means the whole chain works: the frontend built and
served, reached the backend through the same Vite proxy the real app uses, and the backend ran
its TypeORM migration and queried Postgres.

The `playwright` and `extractor` services exit immediately with code 0 — they're only there to
warm their image builds.

## If it doesn't come up

- **Docker not running** — start Docker Desktop and retry.
- **Port already in use** (5174, 3100) — stop whatever's using it, or set `FRONTEND_PORT` or
  `API_PORT`:

  ```bash
  API_PORT=3101 FRONTEND_PORT=5175 docker compose up --build
  ```

- **Slow first build** — expected. `npm ci` and the Playwright browser download are the long
  poles; let them finish once.
- **The web container waits** — it starts only once the API's health check passes, which waits
  on Postgres, so bring the whole thing up together rather than starting services individually.

Tear down with `docker compose down`. Leave the images in place — keeping them cached is the
point.

## What's inside

Almost nothing, deliberately.

- `apps/api/` — one NestJS app with a single `ping` table, one TypeORM migration (run before the
  server starts, as in the assessment), and two endpoints: `health` (the API is answering) and
  `health/db` (it round-trips to Postgres).
- `apps/web/` — one page that calls `health/db` and renders the result.

The dependency manifests are the interesting part, not the code: they mirror the assessment's so
the caches this primes are the ones you'll actually use. That's also why `apps/*/package.json`
lists scripts and packages this tiny app never uses.

## Exporting session logs

`scripts/` has three mechanical extractors that turn an AI coding session into a readable
markdown log plus a raw JSON envelope (no LLM, no network — stdlib only). They run in Docker
(`scripts/Dockerfile`), so no local Python install is required — only Docker itself, and
`docker compose up` above already warms the image build for you.

```bash
image="rfp-monster-session-log-extractor:local"
docker build -q -t "$image" scripts >/dev/null
mounts=(-v "$PWD:$PWD" -v /tmp:/tmp)
[ -d "$HOME/.claude/projects" ] && mounts+=(-v "$HOME/.claude/projects:$HOME/.claude/projects:ro")
docker run --rm -e HOME="$HOME" -u "$(id -u):$(id -g)" -w "$PWD" "${mounts[@]}" "$image" \
  extract_claude_session_log.py --all   # or extract_codex_session_log.py / extract_copilot_session_log.py
```

Swap the mounted session-storage directory (and script) for Codex (`~/.codex/sessions`) or
Copilot (`~/.copilot`) — the container only gets read-only access to that one directory, plus
read-write access to this checkout and `/tmp` (where pasted images get dumped), nothing else
on the machine.

Defaults to `--all`, writing two files per session: a readable `*_session_log_<id>.md` and a
raw `*_session_log_raw_<id>.json` envelope (the markdown is unprefixed for Claude:
`session_log_<id>.md`, since a downstream consumer matches only the `codex_`/`copilot_`
prefixes). Useful flags (all three scripts): `--strict` (only sessions started in *this exact
directory* — no parent-dir walk, no newest-anywhere fallback), `--output DIR` (or `--output -`
for stdout), a session id to export just one, `--no-raw` to skip the envelope, and
`--raw-tool-result-bytes N` to change the tool-result cap. Source-specific: Codex takes
`--sessions-root DIR`, Copilot takes `--db PATH`.

Pasted images can't be read mechanically, so the extractors dump each one to a temp file and
leave a `[Image dumped to … — description pending]` marker in the markdown log. The harness
shortcuts below do a follow-up pass that replaces those markers with a short image
description; running the container directly leaves the markers in place.

### From inside your AI harness

Each tool ships a shortcut so you can export without leaving the session:

- **Claude Code** — run the `/extract-claude-session-logs` slash command
  (`.claude/commands/extract-claude-session-logs.md`). Defaults to `--all`; append any of the
  flags above, e.g. `/extract-claude-session-logs --strict`.
- **Codex** — invoke the `extract-codex-session-logs` skill (as `$extract-codex-session-logs`
  or from the skills UI; see `.agents/skills/extract-codex-session-logs/`).
- **GitHub Copilot** — invoke the `extract-copilot-session-logs` skill (as
  `$extract-copilot-session-logs` or from the skills UI; see
  `.agents/skills/extract-copilot-session-logs/`).

Each shortcut runs its extractor with `--all` and passes through extra args like `--strict`
or `--output DIR`, then does the image-description pass on the markdown output.

Then drag both files per session — the `.md` and the `.json` — into Qualified. The markdown
is what gets scored; the raw envelope is what lets a human grader see images and full output.
