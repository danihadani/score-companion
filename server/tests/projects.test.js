import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/prisma.js";

// Every test starts from an empty table, so counts are predictable.
beforeEach(async () => {
  await prisma.project.deleteMany();
});

// Close the database connection, so Jest can exit.
afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/projects", () => {
  test("creates a project and answers 201", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ title: "Dune", director: "Villeneuve", fps: 23.976 });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Dune");
    expect(res.body.id).toBeDefined();

    // It is really in the database.
    expect(await prisma.project.count()).toBe(1);
  });

  test("answers 400 and saves nothing when the title is missing", async () => {
    const res = await request(app).post("/api/projects").send({ fps: 24 });

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

    const res= await request(app)

    .get("/api/projects")

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2)
    expect(res.body[0].title).toBe("New Film");
  });
});

describe("DELETE /api/projects/:id", () => {
  test("deletes the project and answers 204", async () => {
    const project = await prisma.project.create({
        data: {title: "New Film" , fps: 24},
    });

     const res= await request(app)

    .delete(`/api/projects/${project.id}`)

    expect(res.status).toBe(204);
    expect(await prisma.project.count()).toBe(0);
  });

  test("answers 404 for an id that doesn't exist", async () => {
    const res= await request(app)

    .delete("/api/projects/99999")

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("PROJECT_NOT_FOUND");
  });

  test("answers 404 when the id is not a number", async () => {
     const res= await request(app)

    .delete("/api/projects/abc")

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("PROJECT_NOT_FOUND");
  });
});