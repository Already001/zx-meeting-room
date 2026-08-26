import { Hono } from "hono";
import { getDb } from "../db.js";
import { fail, ok } from "../envelope.js";
import { requireAdmin } from "../middleware/user.js";
import {
  createDict,
  deleteDict,
  listDicts,
  setDictEnabled,
  updateDict
} from "../domain/dict.js";
import type { DictType } from "../types.js";

type Vars = { corpId: string; userId: string; userName: string; dept: string };
const dicts = new Hono<{ Variables: Vars }>();
dicts.use("*", requireAdmin);

dicts.get("/dicts", (c) => {
  const corpId = c.get("corpId");
  const type = c.req.query("type") as DictType | undefined;
  if (type && type !== "building" && type !== "facility") {
    return fail(c, "M4000", "type 无效");
  }
  return ok(c, listDicts(getDb(), corpId, type));
});

dicts.post("/dicts", async (c) => {
  const body = await c.req.json();
  const res = createDict(getDb(), c.get("corpId"), body);
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

dicts.put("/dicts/:id", async (c) => {
  const body = await c.req.json();
  const res = updateDict(getDb(), c.get("corpId"), c.req.param("id"), body);
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

dicts.put("/dicts/:id/enabled", async (c) => {
  const body = await c.req.json();
  const res = setDictEnabled(getDb(), c.get("corpId"), c.req.param("id"), Boolean(body.enabled));
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

dicts.delete("/dicts/:id", (c) => {
  const res = deleteDict(getDb(), c.get("corpId"), c.req.param("id"));
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, { ok: true });
});

export default dicts;
