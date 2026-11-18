import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/prisma.js";

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const dani = {
  username: "dani",
  fullName: "Dani Composer",
  email: "dani@example.com",
  password: "a-good-password",
};

describe("POST /api/users/signup", () => {
  test("creates the composer, logs her in, and never sends the password back", async () => {
    const res = await request(app).post("/api/users/signup").send(dani);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toEqual({
      id: expect.any(Number),
      username: "dani",
      fullName: "Dani Composer",
    });
  });

  test("saves a hash, not the password itself", async () => {
    await request(app).post("/api/users/signup").send(dani);

    const user = await prisma.user.findUnique({ where: { username: "dani" } });
    expect(user.password).not.toBe("a-good-password");
    expect(user.password).toMatch(/^\$2b\$/); // what a bcrypt hash starts with
  });

  test("answers 409 when the username is taken", async () => {
    await request(app).post("/api/users/signup").send(dani);

    const res = await request(app).post("/api/users/signup").send(dani);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("USERNAME_TAKEN");
  });

  test("answers 400 for a password that is too short", async () => {
    const res = await request(app)
      .post("/api/users/signup")
      .send({ ...dani, password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("PASSWORD_TOO_SHORT");
  });
});

describe("POST /api/users/login", () => {
  test("logs in with the right password", async () => {
    await request(app).post("/api/users/signup").send(dani);

    const res = await request(app)
      .post("/api/users/login")
      .send({ username: "dani", password: "a-good-password" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe("dani");
  });

  test("gives the same answer for a wrong password and an unknown username", async () => {
    await request(app).post("/api/users/signup").send(dani);

    const wrongPassword = await request(app)
      .post("/api/users/login")
      .send({ username: "dani", password: "not-the-password" });
    const unknownUser = await request(app)
      .post("/api/users/login")
      .send({ username: "nobody", password: "a-good-password" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownUser.body);
  });

  test("answers 400 when a field is missing", async () => {
    const res = await request(app).post("/api/users/login").send({ username: "dani" });
    expect(res.status).toBe(400);
  });
});

describe("the login guard", () => {
  test("answers 401 without a token", async () => {
    const res = await request(app).get("/api/projects");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("NOT_LOGGED_IN");
  });

  test("answers 401 for a token that was changed or made up", async () => {
    const res = await request(app)
      .get("/api/projects")
      .set("Authorization", "Bearer not.a.real-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("LOGIN_EXPIRED");
  });

  test("lets a logged-in composer through", async () => {
    const signup = await request(app).post("/api/users/signup").send(dani);

    const res = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${signup.body.token}`);

    expect(res.status).toBe(200);
  });

  test("leaves the health check open", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});
