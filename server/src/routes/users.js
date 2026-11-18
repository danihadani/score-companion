import { Router } from "express";
import { prisma } from "../prisma.js";
import { comparePassword, createToken, hashPassword } from "../auth.js";
import { validateSignup } from "../validation/users.js";
import { logger } from "../logger.js";

export const usersRouter = Router();

// What the client gets back about a composer: never the password hash.
function publicUser(user) {
  return { id: user.id, username: user.username, fullName: user.fullName };
}

// POST /api/users/signup - create an account and log in
usersRouter.post("/signup", async (req, res) => {
  let data;
  try {
    data = validateSignup(req.body);
  } catch (err) {
    logger.warn(`Sign up refused: ${err.message}`);
    return res.status(400).json({ error: err.message });
  }

  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    logger.warn(`Sign up refused: username "${data.username}" is taken`);
    return res.status(409).json({ error: "USERNAME_TAKEN" });
  }

  const user = await prisma.user.create({
    data: { ...data, password: await hashPassword(data.password) },
  });
  logger.info(`User signed up: id=${user.id} "${user.username}"`);

  // Log her straight in, so she doesn't have to type it all again.
  res.status(201).json({ token: createToken(user), user: publicUser(user) });
});

// POST /api/users/login - check the password and hand out a token
usersRouter.post("/login", async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!username || !password) {
    return res.status(400).json({ error: "ALL_FIELDS_REQUIRED" });
  }

  const user = await prisma.user.findUnique({ where: { username } });

  // The same answer for "no such user" and "wrong password", so nobody can
  // use this route to discover which usernames exist.
  if (!user || !(await comparePassword(password, user.password))) {
    logger.warn(`Log in failed for "${username}"`);
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }

  logger.info(`User logged in: id=${user.id} "${user.username}"`);
  res.json({ token: createToken(user), user: publicUser(user) });
});
