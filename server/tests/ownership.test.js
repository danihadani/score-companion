import { prisma } from "../src/prisma.js";
import { loggedInAs } from "./helpers.js";

// Two composers: dani owns everything, noa tries to reach it.
let dani;
let noa;
// Dani's things, created through the API: { project, cue, track, item, note }
let mine;

beforeEach(async () => {
  await prisma.cue.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  dani = await loggedInAs("dani");
  noa = await loggedInAs("noa");

  const project = (await dani.post("/api/projects").send({ title: "Arrival", fps: 24 })).body;
  const cue = (
    await dani
      .post(`/api/projects/${project.id}/cues`)
      .send({ name: "1m1", timecodeIn: "01:00:00:00", timecodeOut: "01:00:30:00" })
  ).body;
  const track = (await dani.post(`/api/cues/${cue.id}/temp-tracks`).send({ title: "Time" })).body;
  const item = (await dani.get(`/api/cues/${cue.id}/checklist`)).body[0];
  const note = (await dani.post(`/api/cues/${cue.id}/notes`).send({ text: "Hi" })).body;
  mine = { project, cue, track, item, note };
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("a new project", () => {
  test("belongs to the composer who created it", async () => {
    const saved = await prisma.project.findUnique({ where: { id: mine.project.id } });
    expect(saved.userId).toBe(dani.userId);
  });
});

describe("the project list", () => {
  test("shows only my own projects", async () => {
    await noa.post("/api/projects").send({ title: "Her", fps: 24 });

    const res = await noa.get("/api/projects");

    expect(res.body.map((project) => project.title)).toEqual(["Her"]);
  });
});

describe("another composer's things answer 404", () => {
  // [what, method, address, body]. Every row has all four, so Jest
  // doesn't mistake a missing body for a done() callback.
  const routes = [
    ["GET a project", "get", () => `/api/projects/${mine.project.id}`, null],
    ["PUT a project", "put", () => `/api/projects/${mine.project.id}`, { title: "Mine", fps: 24 }],
    ["DELETE a project", "delete", () => `/api/projects/${mine.project.id}`, null],
    ["GET its cues", "get", () => `/api/projects/${mine.project.id}/cues`, null],
    [
      "POST a cue to it",
      "post",
      () => `/api/projects/${mine.project.id}/cues`,
      { name: "2m1", timecodeIn: "01:10:00:00", timecodeOut: "01:10:30:00" },
    ],
    ["GET its summary", "get", () => `/api/projects/${mine.project.id}/summary`, null],
    [
      "PUT a cue",
      "put",
      () => `/api/cues/${mine.cue.id}`,
      { name: "1m1", timecodeIn: "01:00:00:00", timecodeOut: "01:00:30:00", status: "mixed" },
    ],
    ["DELETE a cue", "delete", () => `/api/cues/${mine.cue.id}`, null],
    ["GET its temp tracks", "get", () => `/api/cues/${mine.cue.id}/temp-tracks`, null],
    ["POST a temp track", "post", () => `/api/cues/${mine.cue.id}/temp-tracks`, { title: "Mine" }],
    ["DELETE a temp track", "delete", () => `/api/temp-tracks/${mine.track.id}`, null],
    ["GET its checklist", "get", () => `/api/cues/${mine.cue.id}/checklist`, null],
    [
      "POST a checklist item",
      "post",
      () => `/api/cues/${mine.cue.id}/checklist`,
      { label: "Mine" },
    ],
    ["PUT a checklist item", "put", () => `/api/checklist/${mine.item.id}`, { done: true }],
    ["DELETE a checklist item", "delete", () => `/api/checklist/${mine.item.id}`, null],
    ["GET its notes", "get", () => `/api/cues/${mine.cue.id}/notes`, null],
    ["POST a note", "post", () => `/api/cues/${mine.cue.id}/notes`, { text: "Mine" }],
    ["DELETE a note", "delete", () => `/api/notes/${mine.note.id}`, null],
  ];

  test.each(routes)("%s", async (what, method, address, body) => {
    const res = await noa[method](address()).send(body ?? undefined);
    expect(res.status).toBe(404);
  });

  test("and nothing of hers changed", async () => {
    for (const [, method, address, body] of routes) {
      await noa[method](address()).send(body ?? undefined);
    }

    const project = await prisma.project.findUnique({ where: { id: mine.project.id } });
    const cue = await prisma.cue.findUnique({ where: { id: mine.cue.id } });
    expect(project.title).toBe("Arrival");
    expect(cue.status).toBe("sketch");
    expect(await prisma.tempTrack.count()).toBe(1);
    expect(await prisma.checklistItem.count()).toBe(6);
    expect(await prisma.note.count()).toBe(1);
  });
});
