import { Hono } from "hono";
import { ok } from "../envelope.js";
import { isAdminUser, readUser } from "../middleware/user.js";

const me = new Hono();

me.get("/me", (c) => {
  const { userId, userName, dept } = readUser(c);
  return ok(c, {
    userId: userId || null,
    userName,
    dept,
    isAdmin: isAdminUser(userId)
  });
});

export default me;
