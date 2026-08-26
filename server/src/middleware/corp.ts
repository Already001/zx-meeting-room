import { createMiddleware } from "hono/factory";
import { fail } from "../envelope.js";

export const requireCorpId = createMiddleware(async (c, next) => {
  const corpId = (c.req.header("zxCorpId") || "").trim();
  if (!corpId) return fail(c, "M4001", "缺少企业信息");
  c.set("corpId", corpId);
  await next();
});
