import { prisma } from "../src/prisma.js";
import { loggedInAs } from "./helpers.js";

// Every request goes through a logged-in composer.
let api;

// Every test starts from an empty table, so counts are predictable.
beforeEach(async () => {
  await prisma.cue.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  api = await loggedInAs();
});

// Close the database connection, so Jest can exit.
afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/projects", () => {
  test("creates a project and answers 201", async () => {
    const res = await api
      .post("/api/projects")
      .send({ title: "Dune", director: "Villeneuve", fps: 23.976 });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Dune");
    expect(res.body.id).toBeDefined();

    // It is really in the database.
    expect(await prisma.project.count()).toBe(1);
  });

  test("answers 400 and saves nothing when the title is missing", async () => {
    const res = await api.post("/api/projects").send({ fps: 24 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("TITLE_REQUIRED");
    expect(await prisma.project.count()).toBe(0);
  });
});

describe("GET /api/projects", () => {
  test("returns all projects, newest first", async () => {
    await prisma.project.create({
      data: { title: "Old Film", fps: 24, createdAt: new Date("2026-01-01") },
    });

    await prisma.project.create({
      data: { title: "New Film", fps: 24, createdAt: new Date("2026-06-01") },
    });

    const res = await api.get("/api/projects");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe("New Film");
  });
});

describe("DELETE /api/projects/:id", () => {
  test("deletes the project and answers 204", async () => {
    const project = await prisma.project.create({
      data: { title: "New Film", fps: 24 },
    });

    const res = await api.delete(`/api/projects/${project.id}`);

    expect(res.status).toBe(204);
    expect(await prisma.project.count()).toBe(0);
  });

  test("answers 404 for an id that doesn't exist", async () => {
    const res = await api.delete("/api/projects/99999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("PROJECT_NOT_FOUND");
  });

  test("answers 404 when the id is not a number", async () => {
    const res = await api.delete("/api/projects/abc");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("PROJECT_NOT_FOUND");
  });
});

describe("PUT /api/projects/:id", () => {
  test("updates the project and answers 200", async () => {
    const project = await prisma.project.create({
      data: { title: "Old Film", fps: 24 },
    });

    const res = await api.put(`/api/projects/${project.id}`).send({ title: "New Film", fps: 24 });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("New Film");

    const saved = await prisma.project.findUnique({
      where: { id: project.id },
    });

    expect(saved.title).toBe("New Film");
  });

  test("answers 400 and changes nothing when the data is invalid", async () => {
    const project = await prisma.project.create({
      data: { title: "Old Film", fps: 24 },
    });

    const res = await api.put(`/api/projects/${project.id}`).send({ title: "", fps: 24 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("TITLE_REQUIRED");

    const saved = await prisma.project.findUnique({
      where: { id: project.id },
    });
    expect(saved.title).toBe("Old Film");
  });

  test("answers 404 for an id that doesn't exist", async () => {
    const res = await api.put("/api/projects/99999").send({ title: "Film", fps: 24 });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/projects/:id", () => {
  test("returns the project", async () => {
    const project = await prisma.project.create({
      data: { title: "New Film", fps: 24 },
    });

    const res = await api.get(`/api/projects/${project.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(project.id);
    expect(res.body.title).toBe("New Film");
  });

  test("answers 404 for a project that doesn't not exist", async () => {
    const res = await api.get("/api/projects/99999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("PROJECT_NOT_FOUND");
  });

  test("answers 404 when the id is not a number", async () => {
    const res = await api.get("/api/projects/abc");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("PROJECT_NOT_FOUND");
  });
});

describe("GET /api/projects/:id/summary", () => {
  test("adds up the music, overall and per status", async () => {
    const project = await prisma.project.create({
      data: { title: "Dune", fps: 24 },
    });
    await prisma.cue.createMany({
      data: [
        {
          name: "1m1",
          timecodeIn: "01:00:00:00",
          timecodeOut: "01:00:30:00",
          status: "mixed",
          projectId: project.id,
        },
        {
          name: "1m2",
          timecodeIn: "01:05:00:00",
          timecodeOut: "01:06:00:00",
          projectId: project.id,
        },
      ],
    });

    const res = await api.get(`/api/projects/${project.id}/summary`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.duration).toBe("00:01:30:00");
    expect(res.body.byStatus.mixed).toEqual({ count: 1, duration: "00:00:30:00" });
    expect(res.body.byStatus.sketch).toEqual({ count: 1, duration: "00:01:00:00" });
    expect(res.body.byStatus.sent).toEqual({ count: 0, duration: "00:00:00:00" });
  });

  test("answers 404 when the project doesn't exist", async () => {
    const res = await api.get("/api/projects/999999/summary");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("PROJECT_NOT_FOUND");
  });
});
