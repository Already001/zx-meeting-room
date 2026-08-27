import type Database from "better-sqlite3";
import { Hono } from "hono";
import { getDb } from "./db.js";
import { corsMiddleware } from "./middleware/cors.js";
import { requireCorpId } from "./middleware/corp.js";
import health from "./routes/health.js";
import me from "./routes/me.js";
import dicts from "./routes/dicts.js";
import rooms from "./routes/rooms.js";
import bookings from "./routes/bookings.js";
import agent from "./routes/agent.js";
import type { AppVars } from "./types.js";

export const createApp = (db?: Database.Database) => {
  const app = new Hono();
  app.use("*", corsMiddleware);
  app.route("/meetingApi", health);

  const api = new Hono<{ Variables: AppVars }>();
  api.use("*", async (c, next) => {
    c.set("db", db ?? getDb());
    await next();
  });
  api.use("*", requireCorpId);
  api.route("/", me);
  api.route("/", dicts);
  api.route("/", rooms);
  api.route("/", bookings);
  api.route("/", agent);
  app.route("/meetingApi", api);

  app.notFound((c) => c.json({ code: "M4004", data: null, msg: "接口不存在" }));
  app.onError((e, c) => {
    console.error(e);
    return c.json({ code: "M5000", data: null, msg: "服务异常" });
  });

  return app;
};
