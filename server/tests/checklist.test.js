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

// A cue created through the API, so it gets the default checklist.
async function createCue() {
  const project = await prisma.project.create({ data: { title: "Arrival", fps: 24 } });
  const res = await request(app)
    .post(`/api/projects/${project.id}/cues`)
    .send({ name: "1m1", timecodeIn: "01:00:00:00", timecodeOut: "01:00:30:00" });
  return { project, cue: res.body };
}

describe("a new cue's checklist", () => {
  test("starts with the default items, in order, none of them done", async () => {
    const { cue } = await createCue();

    const res = await request(app).get(`/api/cues/${cue.id}/checklist`);

    expect(res.status).toBe(200);
    expect(res.body.map((item) => item.label)).toEqual([
      "Sketch",
      "Director approved",
      "Orchestration",
      "Recording",
      "Mix",
      "Stems delivered",
    ]);
    expect(res.body.every((item) => item.done === false)).toBe(true);
  });

  test("the cue list counts how much of it is done", async () => {
    const { project, cue } = await createCue();
    const items = await request(app).get(`/api/cues/${cue.id}/checklist`);
    await request(app).put(`/api/checklist/${items.body[0].id}`).send({ done: true });

    const res = await request(app).get(`/api/projects/${project.id}/cues`);

    expect(res.body[0].checklistDone).toBe(1);
    expect(res.body[0].checklistTotal).toBe(6);
  });
});

describe("POST /api/cues/:id/checklist", () => {
  test("adds an item at the end and answers 201", async () => {
    const { cue } = await createCue();

    const res = await request(app)
      .post(`/api/cues/${cue.id}/checklist`)
      .send({ label: "Choir session" });

    expect(res.status).toBe(201);
    expect(res.body.label).toBe("Choir session");
    const list = await request(app).get(`/api/cues/${cue.id}/checklist`);
    expect(list.body.at(-1).label).toBe("Choir session");
  });

  test("answers 400 and saves nothing when the label is missing", async () => {
    const { cue } = await createCue();

    const res = await request(app).post(`/api/cues/${cue.id}/checklist`).send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("LABEL_REQUIRED");
    expect(await prisma.checklistItem.count()).toBe(6);
  });

  test("answers 404 when the cue doesn't exist", async () => {
    const res = await request(app).post("/api/cues/999999/checklist").send({ label: "Mix" });
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/checklist/:id", () => {
  test("checks an item", async () => {
    const { cue } = await createCue();
    const items = await request(app).get(`/api/cues/${cue.id}/checklist`);

    const res = await request(app).put(`/api/checklist/${items.body[0].id}`).send({ done: true });

    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });

  test("answers 400 when done is not true or false", async () => {
    const { cue } = await createCue();
    const items = await request(app).get(`/api/cues/${cue.id}/checklist`);

    const res = await request(app).put(`/api/checklist/${items.body[0].id}`).send({ done: "yes" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_DONE");
  });

  test("answers 404 when the item doesn't exist", async () => {
    const res = await request(app).put("/api/checklist/999999").send({ done: true });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/checklist/:id", () => {
  test("removes the item and answers 204", async () => {
    const { cue } = await createCue();
    const items = await request(app).get(`/api/cues/${cue.id}/checklist`);

    const res = await request(app).delete(`/api/checklist/${items.body[0].id}`);

    expect(res.status).toBe(204);
    expect(await prisma.checklistItem.count()).toBe(5);
  });

  test("the checklist goes when its cue is deleted", async () => {
    const { cue } = await createCue();

    await request(app).delete(`/api/cues/${cue.id}`);

    expect(await prisma.checklistItem.count()).toBe(0);
  });
});
