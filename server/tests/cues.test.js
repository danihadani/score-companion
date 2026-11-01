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

describe("POST /api/projects/:id/cues", () => {
  test("adds a cue to the project and answers 201", async () => {
    const project = await prisma.project.create({
      data: { title: "Taxi Driver", fps: 24 },
    });

    const res = await request(app)
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
    const res = await request(app)
      .post(`/api/projects/${project.id}/cues`)
      .send({ name: "1m1", timecodeIn: "01:00:30:00", timecodeOut: "01:00:00:00" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("TIMECODE_OUT_BEFORE_IN");
    expect(await prisma.cue.count()).toBe(0);
  });

  test("answers 404 when the project doesn't exist", async () => {
    const res = await request(app)
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

    const res = await request(app).delete(`/api/projects/${project.id}`);

    expect(res.status).toBe(204);
    expect(await prisma.cue.count()).toBe(0);
  });
});
