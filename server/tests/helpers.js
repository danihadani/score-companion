import request from "supertest";
import { app } from "../src/app.js";

// Signs up a composer, and returns a supertest agent that sends her token
// with every request: api.get(...), api.post(...), just like request(app).
export async function loggedInAs(username = "dani") {
  const res = await request(app)
    .post("/api/users/signup")
    .send({
      username,
      fullName: "Dani Composer",
      email: `${username}@example.com`,
      password: "a-good-password",
    });
  return request.agent(app).set("Authorization", `Bearer ${res.body.token}`);
}
