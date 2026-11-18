import { prisma } from "../src/prisma.js";
import { loggedInAs } from "./helpers.js";

// Every request goes through a logged-in composer.
let api;

beforeEach(async () => {
  await prisma.cue.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  api = await loggedInAs();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/projects/:id/cues", () => {
  test("adds a cue to the project and answers 201", async () => {
    const project = await prisma.project.create({
      data: { title: "Taxi Driver", fps: 24 },
    });

    const res = await api
      .post(`/api/projects/${project.id}/cues`)
      .send({ name: "1m1", timecodeIn: "01:00:00:00", timecodeOut: "01:00:30:00" });

    expect(res.status).toBe(201);
    expect(res.body.projectId).toBe(project.id);
    expect(await prisma.cue.count()).toBe(1);
  });

  test("answers 400 and saves nothing when the cue ends before it starts", async () => {
    const project = await prisma.project.create({
      data: { title: "Taxi Driver", fps: 24 },
    });
    const res = await api
      .post(`/api/projects/${project.id}/cues`)
      .send({ name: "1m1", timecodeIn: "01:00:30:00", timecodeOut: "01:00:00:00" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("TIMECODE_OUT_BEFORE_IN");
    expect(await prisma.cue.count()).toBe(0);
  });

  test("answers 404 when the project doesn't exist", async () => {
    const res = await api
      .post("/api/projects/9999/cues")
      .send({ name: "1m1", timecodeIn: "01:00:00:00", timecodeOut: "01:00:30:00" });

    expect(res.status).toBe(404);
  });

  test("deletes the cues when their project is deleted", async () => {
    const project = await prisma.project.create({
      data: { title: "Taxi Driver", fps: 24 },
    });
    await prisma.cue.create({
      data: {
        name: "1m1",
        timecodeIn: "00:00:00:00",
        timecodeOut: "00:00:30:00",
        projectId: project.id,
      },
    });

    const res = await api.delete(`/api/projects/${project.id}`);

    expect(res.status).toBe(204);
    expect(await prisma.cue.count()).toBe(0);
  });
});

// A project with one cue, for the tests below.
async function createProjectWithCue() {
  const project = await prisma.project.create({ data: { title: "Taxi Driver", fps: 24 } });
  const cue = await prisma.cue.create({
    data: {
      name: "1m1",
      timecodeIn: "01:00:00:00",
      timecodeOut: "01:00:30:00",
      projectId: project.id,
    },
  });
  return { project, cue };
}

describe("GET /api/projects/:id/cues", () => {
  test("returns the cues in film order, with their durations", async () => {
    const { project } = await createProjectWithCue();
    await prisma.cue.create({
      data: {
        name: "0m1",
        timecodeIn: "00:58:00:00",
        timecodeOut: "00:58:10:12",
        projectId: project.id,
      },
    });

    const res = await api.get(`/api/projects/${project.id}/cues`);

    expect(res.status).toBe(200);
    expect(res.body.map((cue) => cue.name)).toEqual(["0m1", "1m1"]);
    expect(res.body[0].duration).toBe("00:00:10:12");
    expect(res.body[1].duration).toBe("00:00:30:00");
  });

  test("returns only the cues of that project", async () => {
    await createProjectWithCue();
    const other = await prisma.project.create({ data: { title: "Empty", fps: 24 } });

    const res = await api.get(`/api/projects/${other.id}/cues`);

    expect(res.body).toEqual([]);
  });

  test("answers 404 when the project doesn't exist", async () => {
    const res = await api.get("/api/projects/999999/cues");
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/cues/:id", () => {
  test("updates the cue and answers 200", async () => {
    const { cue } = await createProjectWithCue();

    const res = await api.put(`/api/cues/${cue.id}`).send({ ...cue, status: "approved" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
    const saved = await prisma.cue.findUnique({ where: { id: cue.id } });
    expect(saved.status).toBe("approved");
  });

  test("answers 400 and changes nothing when the data is invalid", async () => {
    const { cue } = await createProjectWithCue();

    const res = await api.put(`/api/cues/${cue.id}`).send({ ...cue, timecodeOut: "00:00:00:00" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("TIMECODE_OUT_BEFORE_IN");
    const saved = await prisma.cue.findUnique({ where: { id: cue.id } });
    expect(saved.timecodeOut).toBe("01:00:30:00");
  });

  test("answers 404 for a cue that doesn't exist", async () => {
    const res = await api
      .put("/api/cues/999999")
      .send({ name: "1m1", timecodeIn: "01:00:00:00", timecodeOut: "01:00:30:00" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("CUE_NOT_FOUND");
  });
});

describe("DELETE /api/cues/:id", () => {
  test("deletes the cue and answers 204", async () => {
    const { cue } = await createProjectWithCue();

    const res = await api.delete(`/api/cues/${cue.id}`);

    expect(res.status).toBe(204);
    expect(await prisma.cue.count()).toBe(0);
  });

  test("answers 404 for a cue that doesn't exist", async () => {
    const res = await api.delete("/api/cues/999999");
    expect(res.status).toBe(404);
  });

  test("answers 404 when the id is not a number", async () => {
    const res = await api.delete("/api/cues/abc");
    expect(res.status).toBe(404);
  });
});
