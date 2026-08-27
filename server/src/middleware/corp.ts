import { createMiddleware } from "hono/factory";
import { fail } from "../envelope.js";
import { decodeHeaderValue } from "./user.js";

export const requireCorpId = createMiddleware(async (c, next) => {
  const corpId = decodeHeaderValue(c.req.header("zxCorpId"));
  if (!corpId) return fail(c, "M4001", "缺少企业信息");
  c.set("corpId", corpId);
  await next();
});
