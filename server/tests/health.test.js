import request from "supertest";
import { app } from "../src/app.js";

describe("GET /api/health", () => {
  test("answers that the server is up", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("unknown /api addresses", () => {
  test("answer 404 with a JSON error", async () => {
    const res = await request(app).get("/api/no-such-thing");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });
});

describe("a request with broken JSON", () => {
  test("answers 400 and not 500", async () => {
    const res = await request(app)
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send('{"name": ');

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
