import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors.js";
import health from "./routes/health.js";

const PORT = Number(process.env.PORT || 3100);

const app = new Hono();
app.use("*", corsMiddleware);

// 所有业务路由统一挂在 /meetingApi 前缀下，与 web 侧 vite proxy 及生产 nginx 反代对齐
app.route("/meetingApi", health);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[meeting-server] listening on http://localhost:${info.port}`);
});
