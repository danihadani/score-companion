# Score Companion

A workspace for film composers: one place to follow every music cue in a film,
from the first sketch to the final mix.

Writing a score means juggling dozens of cues, each with its own timecode,
scene and status. Score Companion keeps them in one list per film, in film
order, and does the timecode arithmetic for you.

## Features

- **Projects** — one per film, with its director and frame rate
  (23.976, 24, 25, 29.97, 30, 48, 50, 59.94 or 60 fps, the rates DAWs offer).
- **Cues** — name (`1m1`, `2m3`…), timecode in and out, scene, and status:
  `sketch` → `sent` → `approved` → `recorded` → `mixed`.
- **Automatic durations** — each cue's length as a timecode, calculated at the
  project's frame rate.
- **Clear errors** — a cue that ends before it starts, or a timecode like
  `00:00:00:24` in a 24 fps film, is refused with a message saying why.

## Tech stack

| | |
|---|---|
| **Client** | React + Vite |
| **Server** | Node.js + Express |
| **Database** | PostgreSQL + Prisma |
| **Tests** | Jest + Supertest, and an integration test with curl |
| **Logs** | winston + morgan |
| **Containers** | Docker + Docker Compose, image on Docker Hub |
| **Security scan** | Snyk |

## How it works

The browser talks to an Express API, which keeps everything in PostgreSQL.
This is what happens when a composer adds a cue:

1. **`client/src/CreateCueForm.jsx`** sends `POST /api/projects/7/cues` with the cue as JSON.
2. **`server/src/app.js`** reads the JSON, checks the rate limit, and logs the request.
3. **`server/src/routes/projects.js`** finds project 7 (404 if there is none).
4. **`server/src/validation/cues.js`** checks the cue at the project's frame rate,
   using the timecode functions in **`server/src/timecode.js`**. Bad input answers 400
   with a code such as `TIMECODE_OUT_BEFORE_IN`.
5. **Prisma** saves the cue, linked to its project, and the server answers 201.
6. **`client/src/CueList.jsx`** reloads the list, and the server adds each cue's duration.

### Timecode math

A timecode `HH:MM:SS:FF` becomes a frame count, the same way 2:30 becomes 150
seconds: `((hours × 60 + minutes) × 60 + seconds) × fps + frames`. Durations are
the difference between two frame counts. At 23.976 and 29.97 fps the frame
counter still runs to 23 and 29, as in a DAW, so the math uses the rounded rate.
Timecode is always non-drop: drop-frame isn't supported.

### API

| Request | What it does | Answers |
|---|---|---|
| `GET /api/health` | Is the server up? | 200 |
| `POST /api/projects` | Create a project | 201 · 400 |
| `GET /api/projects` | All projects, newest first | 200 |
| `PUT /api/projects/:id` | Update a project | 200 · 400 · 404 |
| `DELETE /api/projects/:id` | Delete a project and its cues | 204 · 404 |
| `POST /api/projects/:id/cues` | Add a cue to a project | 201 · 400 · 404 |
| `GET /api/projects/:id/cues` | A project's cues in film order, with durations | 200 · 404 |
| `PUT /api/cues/:id` | Update a cue (for example its status) | 200 · 400 · 404 |
| `DELETE /api/cues/:id` | Delete a cue | 204 · 404 |

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

| Kind | What it checks | Files |
|---|---|---|
| Unit tests | One function on its own: validation and timecode math | `server/tests/validation.test.js`, `cue-validation.test.js`, `timecode.test.js` |
| Route tests | One API address, against a test database | `server/tests/projects.test.js`, `cues.test.js`, `health.test.js` |
| Integration test | The running containers, through real HTTP requests | `tests/integration.sh` |

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
npm test                 # unit and route tests
npm run test:coverage    # fails if less than 70% of the lines are tested
npm run lint             # ESLint
```

Integration test, from the project root, against the running containers:

```bash
docker compose up --build -d
./tests/integration.sh
```

## Logs

The server logs with [winston](https://github.com/winstonjs/winston), to the
terminal and to two files in `server/logs/`:

| File | What goes in |
|---|---|
| `app.log` | everything |
| `error.log` | errors only |

| Level | When | Example |
|---|---|---|
| `http` | every request that succeeded | `POST /api/projects 201 - 12.4 ms` |
| `info` | something was created, updated or deleted | `Project created: id=7 "Dune" (23.976 fps)` |
| `warn` | a request was refused (400, 404) and why | `Project refused: TITLE_REQUIRED` |
| `error` | a failure on the server, with its stack trace | `GET /api/projects - Can't reach database server` |

Request lines are written by morgan in `server/src/app.js`; the `info` and
`warn` lines that say what happened are written in the routes. A sample log is
in `docs/sample-app.log`.

Watch them live, or search them:

```bash
tail -f server/logs/app.log              # live
docker compose logs -f app               # live, when running in Docker
grep "Project deleted" server/logs/app.log
grep "\[warn\]" server/logs/app.log
```

## Security

### Input is checked twice

In the browser, the menus only offer valid frame rates and statuses. On the
server, `validateProject` and `validateCue` check everything again, because the
browser can be bypassed (with curl, for example). Only the values they return
are saved, never `req.body` as it came in.

### SQL injection

SQL injection is an attempt to run SQL through a text field, such as a film
called `Dune'; DROP TABLE "Project"; --`. Prisma always sends the query and the
values separately (a parameterized query), so a value can never become part of
the SQL: that title is simply saved as text. The project builds no SQL from
strings.

### Secrets

The database password lives in `.env` files, which are in `.gitignore`. The
repository only has `.env.example` files with sample values.

### Snyk

The project is scanned with [Snyk](https://snyk.io) (screenshots in `docs/security/`):

| Scan | Before | After |
|---|---|---|
| Packages (`snyk test`) | 0 | 0 |
| Code (`snyk code test`) | 2 medium | 0 |
| Docker image (`snyk container test`) | 25 in npm, 18 in the base image | 0 |

What changed:
- Express no longer sends the `X-Powered-By` header, so the framework isn't advertised
- Requests are rate-limited, against denial-of-service: 300 a minute per address
  for the API, 100 for the page
- The image runs on `node:26-alpine`, and npm is removed from it: the server
  doesn't need npm to run, and it carried most of the vulnerabilities

## Licenses

Every tool and package the project uses, with its license, is listed in
[`ALL_LICENSES`](ALL_LICENSES). Almost all are permissive (MIT, ISC, BSD,
Apache-2.0): they may be used, changed and shipped, as long as the copyright
notice is kept. Git (GPL-2.0) and lightningcss (MPL-2.0, inside Vite) are
copyleft, which only matters to someone who distributes a changed version of
them. This project uses them as they are.

## How the project was built

| Practice | Where to see it |
|---|---|
| Linux / macOS, README | Developed on macOS; the app runs on Linux in Docker |
| Git: `main` plus a branch for every change | [Branches](https://github.com/danihadani/score-companion/branches) — every change reached `main` through a pull request |
| User stories, estimates, Kanban board | [Issues](https://github.com/danihadani/score-companion/issues) and the project's Kanban board; stories and estimates in [`docs/user-stories.md`](docs/user-stories.md) |
| Sprints and retrospectives | [`docs/user-stories.md`](docs/user-stories.md); board screenshots in `docs/board/` |
| Code review by another participant | [#32](https://github.com/danihadani/score-companion/pull/32) (network errors in the cue form), [#37](https://github.com/danihadani/score-companion/pull/37) (checking `res.ok` before showing lists), [#40](https://github.com/danihadani/score-companion/pull/40) (rate-limiting the API) |
| Unit tests, 70% coverage, integration test | [Tests](#tests) |
| Linting and formatting | ESLint and Prettier (`npm run lint`, `npm run format`) |
| Package manager | npm: `package.json` and `package-lock.json` in `server/` and `client/` |
| Licenses | [`ALL_LICENSES`](ALL_LICENSES) |
| Logs to a file | [Logs](#logs) |
| Secure code, security scan | [Security](#security) |
| Container, `.dockerignore`, Docker Hub, Docker Compose | `Dockerfile`, `.dockerignore`, `docker-compose.yml`, image `danihadani/score-companion` |
| Commands in the terminal | Screenshots in `docs/commands/` |

Parts of the setup and the code were written with the help of Claude, an AI
assistant. Every part is explained in this README.

## Project structure

```
score-companion/
├── client/                    React app (Vite)
│   └── src/
│       ├── App.jsx            the page, loads the projects
│       ├── CreateProjectForm.jsx
│       ├── ProjectList.jsx    projects, with rename and delete
│       ├── CueList.jsx        a project's cues, with status and delete
│       └── CreateCueForm.jsx
├── server/                    Express API
│   ├── src/
│   │   ├── server.js          starts listening
│   │   ├── app.js             middleware, routes, error handling
│   │   ├── logger.js          winston: app.log and error.log
│   │   ├── prisma.js          the database client
│   │   ├── timecode.js        timecode ↔ frames, durations
│   │   ├── routes/            projects.js, cues.js
│   │   └── validation/        projects.js, cues.js
│   ├── prisma/                schema.prisma and migrations
│   ├── tests/                 Jest tests
│   └── logs/                  log files
├── tests/integration.sh       integration test (curl)
├── docs/                      user stories, retrospectives, screenshots
├── ALL_LICENSES               tools and packages used, and their licenses
├── Dockerfile                 builds client + server into one image
└── docker-compose.yml         runs the app next to PostgreSQL
```
