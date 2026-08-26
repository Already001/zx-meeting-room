import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors.js";
import { requireCorpId } from "./middleware/corp.js";
import health from "./routes/health.js";
import me from "./routes/me.js";

const loadEnvFile = () => {
  const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (process.env[k] === undefined) process.env[k] = v;
  }
};

loadEnvFile();

const PORT = Number(process.env.PORT || 3100);
const app = new Hono();
app.use("*", corsMiddleware);
app.route("/meetingApi", health);

type Vars = { corpId: string; userId: string; userName: string; dept: string };
const api = new Hono<{ Variables: Vars }>();
api.use("*", requireCorpId);
api.route("/", me);
app.route("/meetingApi", api);

app.notFound((c) => c.json({ code: "M4004", data: null, msg: "接口不存在" }));
app.onError((e, c) => {
  console.error(e);
  return c.json({ code: "M5000", data: null, msg: "服务异常" });
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[meeting-server] listening on http://localhost:${info.port}`);
});
