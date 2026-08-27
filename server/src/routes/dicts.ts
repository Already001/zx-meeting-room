import { Hono } from "hono";
import { fail, ok } from "../envelope.js";
import { requireAdmin } from "../middleware/user.js";
import {
  createDict,
  deleteDict,
  listDicts,
  setDictEnabled,
  updateDict
} from "../domain/dict.js";
import type { AppVars, DictType } from "../types.js";

const dicts = new Hono<{ Variables: AppVars }>();
dicts.use("/dicts", requireAdmin);
dicts.use("/dicts/*", requireAdmin);

dicts.get("/dicts", (c) => {
  const corpId = c.get("corpId");
  const type = c.req.query("type") as DictType | undefined;
  if (type && type !== "building" && type !== "facility") {
    return fail(c, "M4000", "type 无效");
  }
  return ok(c, listDicts(c.get("db"), corpId, type));
});

dicts.post("/dicts", async (c) => {
  const body = await c.req.json();
  const res = createDict(c.get("db"), c.get("corpId"), body);
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

dicts.put("/dicts/:id", async (c) => {
  const body = await c.req.json();
  const res = updateDict(c.get("db"), c.get("corpId"), c.req.param("id"), body);
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

dicts.put("/dicts/:id/enabled", async (c) => {
  const body = await c.req.json();
  const res = setDictEnabled(c.get("db"), c.get("corpId"), c.req.param("id"), Boolean(body.enabled));
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

dicts.delete("/dicts/:id", (c) => {
  const res = deleteDict(c.get("db"), c.get("corpId"), c.req.param("id"));
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, { ok: true });
});

export default dicts;
