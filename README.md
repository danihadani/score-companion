# Score Companion

The cue wall a film composer keeps next to the DAW: every cue of the film,
where it stands, and what it still needs.

Writing a score means juggling dozens of cues, each with its own timecode,
scene, status and notes from the director. Score Companion keeps them on one
board per film, does the timecode arithmetic, and shows how much music is done.

## Features

- **Private** — every composer signs up and logs in, and sees only her own
  projects.
- **Projects** — one page per film, with its director and frame rate
  (23.976, 24, 25, 29.97, 30, 48, 50, 59.94 or 60 fps, the rates DAWs offer).
- **The cue board** — a column per status
  (`sketch` → `sent` → `approved` → `recorded` → `mixed`). Drag a cue to move it.
  A table view lists the same cues in film order.
- **Music minutes** — the film's total music time, and each column's.
- **What each cue still needs** — a checklist that every new cue starts with
  (sketch, director approved, orchestration, recording, mix, stems delivered),
  with its progress on the card.
- **Notes** — dated notes on each cue: what changed and why.
- **Temp tracks** — the existing music the director placed in the edit. Search
  iTunes and listen to a 30-second preview before adding one.
- **Automatic durations** — each cue's length as a timecode, at the project's
  frame rate.
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
| `POST /api/users/signup` | Create an account, and get a login token | 201 · 400 · 409 |
| `POST /api/users/login` | Log in, and get a login token | 200 · 400 · 401 |
| `POST /api/projects` | Create a project | 201 · 400 |
| `GET /api/projects` | All projects, newest first | 200 |
| `GET /api/projects/:id` | One project | 200 · 404 |
| `PUT /api/projects/:id` | Update a project | 200 · 400 · 404 |
| `DELETE /api/projects/:id` | Delete a project and its cues | 204 · 404 |
| `POST /api/projects/:id/cues` | Add a cue to a project | 201 · 400 · 404 |
| `GET /api/projects/:id/cues` | A project's cues in film order, with durations | 200 · 404 |
| `PUT /api/cues/:id` | Update a cue (for example its status) | 200 · 400 · 404 |
| `DELETE /api/cues/:id` | Delete a cue, with its temp tracks, checklist and notes | 204 · 404 |
| `POST /api/cues/:id/temp-tracks` | Attach a temp track to a cue | 201 · 400 · 404 |
| `GET /api/cues/:id/temp-tracks` | A cue's temp tracks, oldest first | 200 · 404 |
| `DELETE /api/temp-tracks/:id` | Remove a temp track | 204 · 404 |
| `GET /api/itunes/search?term=` | Songs from iTunes, with 30-second previews | 200 · 400 · 502 |
| `GET /api/projects/:id/summary` | Music time and cue count, overall and per status | 200 · 404 |
| `GET /api/cues/:id/checklist` | What a cue still needs, in order | 200 · 404 |
| `POST /api/cues/:id/checklist` | Add an item to a cue's checklist | 201 · 400 · 404 |
| `PUT /api/checklist/:id` | Check or uncheck an item | 200 · 400 · 404 |
| `DELETE /api/checklist/:id` | Remove an item | 204 · 404 |
| `GET /api/cues/:id/notes` | A cue's notes, newest first | 200 · 404 |
| `POST /api/cues/:id/notes` | Write a note on a cue | 201 · 400 · 404 |
| `DELETE /api/notes/:id` | Delete a note | 204 · 404 |

Every other route needs the token: `Authorization: Bearer <token>`. Without
it, or with a token that was changed or has expired, the answer is 401.

## Running the project

### With Docker (the whole app + database)

```bash
cp .env.example .env          # then set the password and JWT_SECRET inside
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

Every call to an outside service is logged too: each iTunes search as `info`
(`iTunes search "hans zimmer": 10 results`), and a failed one as `error`.

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

### Logging in

- **Passwords are never stored.** The database keeps a bcrypt hash: a one-way
  value that a password can be checked against, but can't be turned back into
  one. The hash is never sent to the browser.
- **The token is signed.** After logging in, the server gives a JWT that says
  "this is user 7", signed with `JWT_SECRET`. Changing the id breaks the
  signature, so the token is refused. The server won't start without the secret,
  so there is no default secret in the code. A login lasts one day.
- **A wrong password and an unknown username get the same answer**, so the log
  in can't be used to find out which usernames exist.
- **At most 10 sign ups or log ins in 15 minutes** from one address, against
  guessing passwords.
- **Someone else's data answers 404**, not 403: every lookup includes the
  logged-in composer, so another composer's project is "not found", and nobody
  learns that it exists.
- **The token is kept in localStorage.** It's simple and works with every
  request, but JavaScript on the page can read it, so a cross-site scripting
  bug could steal it. React escapes everything it shows, and links must be
  `http` or `https`. A possible next step is an `httpOnly` cookie, which
  JavaScript can't read.

### Secrets

The database password and `JWT_SECRET` live in `.env` files, which are in
`.gitignore`. The repository only has `.env.example` files with sample values.
There are three: `.env` for Docker, `server/.env` for `npm run dev`, and
`server/.env.test` for the tests.

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

  #### Scanned again at the end of the final project (26.11)

| Scan | Result |
|---|---|
| Packages (`snyk test`), server | 0 (117 dependencies) |
| Packages (`snyk test`), client | 0 |
| Code (`snyk code test`) | 17 findings: 2 medium, 15 low – all false positives. The tests are now excluded (`.snyk`) |
| Docker image, app packages | 0 (101 dependencies) |
| Docker image, base image | 21 – all in `node:26-alpine` itself |

What the findings are:
- **Code:** 15 are made-up passwords in the tests, which sign up test composers
  on purpose (the tests are not shipped – the image copies only `server/src`).
  The 2 medium are in `SignUpPage.jsx`: error messages whose keys contain the
  word `PASSWORD` (`PASSWORD_TOO_SHORT`), not passwords.
- **Base image:** 15 are in Node 26.13.0 and are fixed in 26.13.1, the rest in
  Alpine's openssl and zlib. Node 26.13.1 is out, but its Alpine image isn't
  published yet (`node:26-alpine` still points to 26.13.0), so the image is
  rebuilt with `docker compose build --pull` as soon as it is.

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
| Code review by another participant | [#32](https://github.com/danihadani/score-companion/pull/32) (network errors in the cue form), [#37](https://github.com/danihadani/score-companion/pull/37) (checking `res.ok` before showing lists), [#40](https://github.com/danihadani/score-companion/pull/40) (rate-limiting the API), [#47](https://github.com/danihadani/score-companion/pull/47) (a failed delete, and a request without a body), [#48](https://github.com/danihadani/score-companion/pull/48) (search errors, and old results after a failed search) |
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

## Future work

Ideas that came up, and why they were left for later:

- **The film, with the music on it.** Upload a proxy of the film, play each
  cue's bounce in sync, and let the director comment at a timecode. Review tools
  like Frame.io already do this well, and it's the part furthest from what this
  app is for: the overview of every cue.
- **Sync with the DAW.** A Max for Live device could send Ableton's loop or
  locators to the app as a new cue. Ableton counts in beats, not seconds, so
  tempo changes would have to be converted.
- **A public portfolio page.** Finished cues with a Vimeo or YouTube link,
  on a page that shows only what the composer chooses.
  
## Project structure

```
score-companion/
├── client/                    React app (Vite)
│   └── src/
│       ├── App.jsx            which page each address shows (React Router)
│       ├── HomePage.jsx       the projects, with a form to add one
│       ├── ProjectPage.jsx    one project: the board or the table
│       ├── CueBoard.jsx       a column per status, drag and drop, totals
│       ├── CueList.jsx        the same cues as a table
│       ├── Checklist.jsx      what a cue still needs
│       ├── CueNotes.jsx       a cue's dated notes
│       ├── TempTracks.jsx     a cue's temp tracks
│       └── ItunesSearch.jsx   search iTunes, play a preview
├── server/                    Express API
│   ├── src/
│   │   ├── server.js          starts listening
│   │   ├── app.js             middleware, routes, error handling
│   │   ├── logger.js          winston: app.log and error.log
│   │   ├── prisma.js          the database client
│   │   ├── timecode.js        timecode ↔ frames, durations
│   │   ├── routes/            projects, cues, temp tracks, checklist, notes, iTunes
│   │   └── validation/        one file per kind of data
│   ├── prisma/                schema.prisma and migrations
│   ├── tests/                 Jest tests
│   └── logs/                  log files
├── tests/integration.sh       integration test (curl)
├── docs/                      user stories, retrospectives, screenshots
├── ALL_LICENSES               tools and packages used, and their licenses
├── Dockerfile                 builds client + server into one image
└── docker-compose.yml         runs the app next to PostgreSQL
```
