import { Hono } from "hono";

const health = new Hono();

/**
 * 健康检查。
 * 故意套用智信业务码信封（code=M0000 表示成功），
 * 这样 web 侧移植过来的 axios 响应拦截器不必为自家后端开特例。
 */
health.get("/health", (c) =>
  c.json({
    code: "M0000",
    data: { ok: true, ts: Date.now() },
    msg: ""
  })
);

export default health;
