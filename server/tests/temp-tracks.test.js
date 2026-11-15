import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/prisma.js";

beforeEach(async () => {
  await prisma.tempTrack.deleteMany();
  await prisma.cue.deleteMany();
  await prisma.project.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// A project with one cue, for the temp tracks to hang on.
async function createCue() {
  const project = await prisma.project.create({ data: { title: "Inception", fps: 24 } });
  return prisma.cue.create({
    data: {
      name: "1m1",
      timecodeIn: "01:00:00:00",
      timecodeOut: "01:00:30:00",
      projectId: project.id,
    },
  });
}

describe("POST /api/cues/:id/temp-tracks", () => {
  test("attaches a temp track to the cue and answers 201", async () => {
    const cue = await createCue();

    const res = await request(app)
      .post(`/api/cues/${cue.id}/temp-tracks`)
      .send({ title: "Time", artist: "Hans Zimmer" });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Time");
    expect(res.body.cueId).toBe(cue.id);
    expect(await prisma.tempTrack.count()).toBe(1);
  });

  test("answers 400 and saves nothing when the title is missing", async () => {
    const cue = await createCue();

    const res = await request(app)
      .post(`/api/cues/${cue.id}/temp-tracks`)
      .send({ artist: "Hans Zimmer" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("TITLE_REQUIRED");
    expect(await prisma.tempTrack.count()).toBe(0);
  });

  test("answers 404 when the cue doesn't exist", async () => {
    const res = await request(app).post("/api/cues/999999/temp-tracks").send({ title: "Time" });
    expect(res.status).toBe(404);
  });

  test("answers 404 when the id is not a number", async () => {
    const res = await request(app).post("/api/cues/abc/temp-tracks").send({ title: "Time" });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/cues/:id/temp-tracks", () => {
  test("returns only this cue's temp tracks, oldest first", async () => {
    const cue = await createCue();
    const otherCue = await createCue();
    await request(app).post(`/api/cues/${cue.id}/temp-tracks`).send({ title: "First" });
    await request(app).post(`/api/cues/${cue.id}/temp-tracks`).send({ title: "Second" });
    await request(app).post(`/api/cues/${otherCue.id}/temp-tracks`).send({ title: "Not mine" });

    const res = await request(app).get(`/api/cues/${cue.id}/temp-tracks`);

    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).toEqual(["First", "Second"]);
  });

  test("answers 404 when the cue doesn't exist", async () => {
    const res = await request(app).get("/api/cues/999999/temp-tracks");
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/temp-tracks/:id", () => {
  test("removes the temp track and answers 204", async () => {
    const cue = await createCue();
    const created = await request(app)
      .post(`/api/cues/${cue.id}/temp-tracks`)
      .send({ title: "Time" });

    const res = await request(app).delete(`/api/temp-tracks/${created.body.id}`);

    expect(res.status).toBe(204);
    expect(await prisma.tempTrack.count()).toBe(0);
  });

  test("answers 404 when the temp track doesn't exist", async () => {
    const res = await request(app).delete("/api/temp-tracks/999999");
    expect(res.status).toBe(404);
  });

  test("the temp tracks go when their cue is deleted", async () => {
    const cue = await createCue();
    await request(app).post(`/api/cues/${cue.id}/temp-tracks`).send({ title: "Time" });

    await request(app).delete(`/api/cues/${cue.id}`);

    expect(await prisma.tempTrack.count()).toBe(0);
  });
});
