import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors.js";
import health from "./routes/health.js";

const PORT = Number(process.env.PORT || 3100);

const app = new Hono();
app.use("*", corsMiddleware);

// 所有业务路由统一挂在 /meetingApi 前缀下，与 web 侧 vite proxy 及生产 nginx 反代对齐
app.route("/meetingApi", health);

// 按智信约定：错误路径也返回 HTTP 200 + 业务码信封，避免 web 侧 http.js 的
// validateStatus/retryXHR 把 404/500 误判为需要重试的异常（一次打错路径变 4 次请求）
app.notFound((c) => c.json({ code: "M4004", data: null, msg: "接口不存在" }));
app.onError((e, c) => {
  console.error(e);
  return c.json({ code: "M5000", data: null, msg: "服务异常" });
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[meeting-server] listening on http://localhost:${info.port}`);
});
