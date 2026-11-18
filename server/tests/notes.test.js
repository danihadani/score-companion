import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/prisma.js";

beforeEach(async () => {
  await prisma.cue.deleteMany();
  await prisma.project.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// A project with one cue, for the notes to hang on.
async function createCue() {
  const project = await prisma.project.create({ data: { title: "Her", fps: 24 } });
  return prisma.cue.create({
    data: {
      name: "1m1",
      timecodeIn: "01:00:00:00",
      timecodeOut: "01:00:30:00",
      projectId: project.id,
    },
  });
}

describe("POST /api/cues/:id/notes", () => {
  test("writes a note on the cue and answers 201", async () => {
    const cue = await createCue();

    const res = await request(app)
      .post(`/api/cues/${cue.id}/notes`)
      .send({ text: "Director: less drums in the chase" });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe("Director: less drums in the chase");
    expect(res.body.cueId).toBe(cue.id);
    expect(res.body.createdAt).toBeDefined();
  });

  test("answers 400 and saves nothing when the text is missing", async () => {
    const cue = await createCue();

    const res = await request(app).post(`/api/cues/${cue.id}/notes`).send({ text: "  " });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("TEXT_REQUIRED");
    expect(await prisma.note.count()).toBe(0);
  });

  test("answers 404 when the cue doesn't exist", async () => {
    const res = await request(app).post("/api/cues/999999/notes").send({ text: "Hi" });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/cues/:id/notes", () => {
  test("returns only this cue's notes, newest first", async () => {
    const cue = await createCue();
    const other = await createCue();
    await request(app).post(`/api/cues/${cue.id}/notes`).send({ text: "First" });
    await request(app).post(`/api/cues/${cue.id}/notes`).send({ text: "Second" });
    await request(app).post(`/api/cues/${other.id}/notes`).send({ text: "Not mine" });

    const res = await request(app).get(`/api/cues/${cue.id}/notes`);

    expect(res.status).toBe(200);
    expect(res.body.map((note) => note.text)).toEqual(["Second", "First"]);
  });

  test("answers 404 when the cue doesn't exist", async () => {
    const res = await request(app).get("/api/cues/999999/notes");
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/notes/:id", () => {
  test("deletes the note and answers 204", async () => {
    const cue = await createCue();
    const created = await request(app).post(`/api/cues/${cue.id}/notes`).send({ text: "Hi" });

    const res = await request(app).delete(`/api/notes/${created.body.id}`);

    expect(res.status).toBe(204);
    expect(await prisma.note.count()).toBe(0);
  });

  test("answers 404 when the note doesn't exist", async () => {
    const res = await request(app).delete("/api/notes/999999");
    expect(res.status).toBe(404);
  });

  test("the notes go when their cue is deleted", async () => {
    const cue = await createCue();
    await request(app).post(`/api/cues/${cue.id}/notes`).send({ text: "Hi" });

    await request(app).delete(`/api/cues/${cue.id}`);

    expect(await prisma.note.count()).toBe(0);
  });
});
