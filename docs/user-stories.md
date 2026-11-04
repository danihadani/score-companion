# User Stories

Each story goes on the Kanban board as one card.
Fill in **Actual** when a card is done — the sprint retrospectives compare it
with the estimate.

Statuses a cue moves through: `sketch` → `sent` → `approved` → `recorded` → `mixed`.

---

## Sprint 1 — Projects and timecode

| # | Story | Estimate | Actual |
|---|---|---|---|
| 1.1 | Set up the project skeleton: server, client, tests, Docker. | 3h | |
| 1.2 | Connect the server to PostgreSQL with Prisma, with a `Project` model (title, director, fps). | 2h | |
| 1.3 | As a composer, I want to create a project for a film, so that all its music lives in one place. | 3h | |
| 1.4 | As a composer, I want to see a list of my projects, so that I can open the one I'm working on. | 2h | |
| 1.5 | As a composer, I want to rename or delete a project, so that the list stays tidy. | 2h | |
| 1.6 | Timecode functions: turn `HH:MM:SS:FF` into frames and back, at 24 / 25 / 30 fps, with unit tests. | 3h | |

## Sprint 2 — Cues

| # | Story | Estimate | Actual |
|---|---|---|---|
| 2.1 | As a composer, I want to add a cue (name, timecode in and out, scene, status), so that I can map the music in the film. Invalid timecodes are refused. | 4h | |
| 2.2 | As a composer, I want to see a project's cues in film order with their durations, so that I don't have to calculate them. | 2h | |
| 2.3 | As a composer, I want to edit or delete a cue, so that it follows changes in the edit. | 2h | |
| 2.4 | As a composer, I want to see the total music minutes in the film, so that I know the size of the job. | 1h | |
| 2.5 | Push the image to Docker Hub. | 1h | |

## Sprint 3 — Temp tracks and progress

| # | Story | Estimate | Actual |
|---|---|---|---|
| 3.1 | As a composer, I want to attach temp tracks to a cue (title, artist, link, notes), so that I remember what the director liked. | 3h | |
| 3.2 | As a composer, I want to remove a temp track, so that only the relevant references stay. | 1h | |
| 3.3 | As a composer, I want to see how many cues are in each status, so that I know if I'm on schedule. | 3h | |
| 3.4 | Write `ALL_LICENSES`. | 1h | |
| 3.5 | Extend the integration test to the cues API. | 1h | |

## Sprint 4 — Bonuses

| # | Story | Estimate | Actual |
|---|---|---|---|
| 4.1 | As a composer, I want to sign up and log in, so that my projects are private. | 4h | |
| 4.2 | As a composer, I want to see only my own projects, so that nobody else's work gets mixed in. | 2h | |
| 4.3 | As a composer, I want to search for a temp track by name (iTunes Search API) and hear a preview, so that adding references is quick. Every request to iTunes is logged. | 4h | |
| 4.4 | Scan the project with Snyk and fix what it finds. | 1h | |
| 4.5 | Final README: screenshots, decisions, how to run. | 2h | |

---

## Retrospectives

Fill one in at the end of each sprint:

```
### Sprint N
- Planned: __ h   Actual: __ h
- What went well:
- What was harder than expected, and why:
- What I'll do differently next sprint:
```

### Sprint 1 — Projects and timecode

- **Planned:** 12 h (1.2–1.6) **Actual:** 18 h — longer than planned.
- **What went well:** Working in small steps: a commit after every part, and a
  merge after every task. Writing tests right after each task caught bugs
  early — a delete route that answered 204 without deleting, and a typo
  (`fos` instead of `fps`) that the PUT test turned into a clear 400.
- **What was harder than expected, and why:** Almost everything. Setting the
  project up from scratch — the folder structure, which file does what, what to
  run and from where — took a long time. Many of the tools (tests against a
  database, Express routers, Prisma in Docker) went deeper than the course
  did, so I needed a lot of help and a lot of learning on my own.
- **What I'll do differently next sprint:** For tasks with a new idea in them,
  estimate double. Write more of the code myself, in smaller pieces, even
  when it's slower.

### Sprint 2 — Cues, reviews and the required practices

- **Planned:** 10 h (2.1–2.5) **Actual:** about 15 h.
- **Scope changed during the sprint:** I learned this is a course project and
  not the final project, and that the grading focuses on development
  practices. So I dropped new features (2.4, temp tracks, login, iTunes
  search, design) and pulled in the required and practice work instead:
  clear logs at four levels (2.6), `ALL_LICENSES` (3.4), the integration test
  for projects (3.5) and the Snyk scan (4.4). The dropped stories are closed
  as "not planned" on the board, and I may keep them for the final project.
- **What went well:** It was easier than sprint 1, because the base of the
  project was already in place and the order of work was clear (validation →
  route → tests → client). Code review with another participant caught three
  real problems: no message when the server is down (#32), lists that broke
  the page on an error response (#37), and an API without rate limiting (#40).
- **What was harder than expected, and why:** Deciding what to leave out, once
  it was clear everything wouldn't fit in the time left. Git also had two
  surprises: a commit landed on `main` by mistake and had to be moved to its
  branch, and #40 had a merge conflict with `main` that had to be resolved by
  hand.
- **What I'll do differently next time:** Decide the scope early, around the
  requirements, and keep extra features for later.

## Code review

Three large changes went through review by another participant (noater).
Each has her comment, the fix, and my answer:

1. [#32 Add a cue to a project](https://github.com/danihadani/score-companion/pull/32)
   — show a message when the server can't be reached (`try/catch` around `fetch`)
2. [#37 Show a project's cues](https://github.com/danihadani/score-companion/pull/37)
   — check `res.ok` before saving a list, in `CueList` and in `App`
3. [#40 Fix Snyk findings](https://github.com/danihadani/score-companion/pull/40)
   — rate-limit every `/api` route, not only the page
