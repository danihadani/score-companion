# Score Companion

A workspace for film composers: one place to follow every music cue in a film,
from the first sketch to the final mix.

Writing a score means juggling dozens of cues, each with its own timecode,
scene, status, director's notes and temp-track references. Score Companion
keeps all of that in one place, and does the timecode arithmetic for you.

## Features (planned)

- **Projects** — one per film.
- **Cues** — name (`1m1`, `2m3`…), timecode in and out, scene description, status.
- **Automatic durations** — each cue's length, and the total music minutes in the film.
- **Temp tracks** — reference tracks attached to each cue, with notes on what you like in them.
- **Progress board** — how many cues are sketched, approved, recorded and mixed.

## Tech stack

| | |
|---|---|
| **Client** | React + Vite |
| **Server** | Node.js + Express |
| **Database** | PostgreSQL + Prisma |
| **Tests** | Jest |
| **Containers** | Docker + Docker Compose |

## Running the project

### With Docker (the whole app + database)

```bash
cp .env.example .env          # then change the password inside
docker compose up --build
```

Open http://localhost:3000. Log files are written to `server/logs/`, whether the
server runs in Docker or with `npm run dev`.

> On Linux, if `server/logs/` stays empty, give the container permission to write
> there: `chmod 777 server/logs`. (Docker Desktop on Mac handles this by itself.)

### From Docker Hub (no build needed)

The image is on Docker Hub: `danihadani/score-companion`, for Intel and Apple Silicon.

```bash
cp .env.example .env
docker compose pull app
docker compose up --no-build
```

### For development (live reload)

Two terminals:

```bash
cd server && npm install && npm run dev      # API on http://localhost:3000 (needs server/.env, see server/.env.example)
cd client && npm install && npm run dev      # site on http://localhost:5173
```

## Tests

The tests use their own database, `score_companion_test`, so they can empty
its tables without touching your real projects. One-time setup, with the
database container running (`docker compose up -d db`):

```bash
cd server
cp .env.test.example .env.test     # same user and password as .env
npm run test:db                    # creates the test database and its tables
```

Run `npm run test:db` again after every new migration. Then:

```bash
cd server
npm test                 # unit tests
npm run test:coverage    # fails if less than 70% of the lines are tested
npm run lint             # ESLint
```

Integration test, from the project root, against the running containers:

```bash
docker compose up --build -d
./tests/integration.sh
```

## Security

The project is scanned with [Snyk](https://snyk.io) (screenshots in `docs/security/`):

| Scan | Before | After |
|---|---|---|
| Packages (`snyk test`) | 0 | 0 |
| Code (`snyk code test`) | 2 medium | 0 |
| Docker image (`snyk container test`) | 25 in npm, 18 in the base image | 0 |

What changed:
- Express no longer sends the `X-Powered-By` header, so the framework isn't advertised
- Requests are rate-limited, against denial-of-service
- The image runs on `node:26-alpine`, and npm is removed from it: the server
  doesn't need npm to run, and it carried most of the vulnerabilities

## Project structure

```
score-companion/
├── server/             Express API
│   ├── src/
│   │   ├── app.js      routes and middleware
│   │   ├── server.js   starts listening
│   │   └── logger.js   writes logs/app.log and logs/error.log
│   ├── logs/           log files (from Docker and from npm run dev)
│   └── tests/          Jest tests
├── client/             React app (Vite)
├── tests/              integration test (curl)
├── docs/               user stories and sprint notes
├── ALL_LICENSES        tools and packages used, and their licenses
├── Dockerfile          builds client + server into one image
└── docker-compose.yml  runs the app next to PostgreSQL
```
