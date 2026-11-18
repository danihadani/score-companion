import request from "supertest";
import { app } from "../src/app.js";

// Signs up a composer, and returns a supertest agent that sends her token
// with every request: api.get(...), api.post(...), just like request(app).
// api.userId is her id.
export async function loggedInAs(username = "dani") {
  const res = await request(app)
    .post("/api/users/signup")
    .send({
      username,
      fullName: "Dani Composer",
      email: `${username}@example.com`,
      password: "a-good-password",
    });
  const api = request.agent(app).set("Authorization", `Bearer ${res.body.token}`);
  // Her id, for tests that create projects straight in the database.
  api.userId = res.body.user.id;
  return api;
}
