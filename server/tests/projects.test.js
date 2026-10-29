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
