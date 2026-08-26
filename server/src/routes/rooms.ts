import { Hono } from "hono";
import { getDb } from "../db.js";
import { fail, ok } from "../envelope.js";
import { requireAdmin } from "../middleware/user.js";
import {
  createRoom,
  getRoom,
  listRooms,
  setRoomEnabled,
  updateRoom
} from "../domain/room.js";

type Vars = { corpId: string; userId: string; userName: string; dept: string };
const rooms = new Hono<{ Variables: Vars }>();
rooms.use("*", requireAdmin);

rooms.get("/rooms", (c) => {
  const corpId = c.get("corpId");
  const enabledRaw = c.req.query("enabled");
  let enabled: boolean | undefined;
  if (enabledRaw === undefined || enabledRaw === "") {
    enabled = undefined;
  } else if (enabledRaw === "true") {
    enabled = true;
  } else if (enabledRaw === "false") {
    enabled = false;
  } else {
    return fail(c, "M4000", "enabled 无效");
  }
  const keyword = (c.req.query("keyword") || "").trim();
  const buildingName = (c.req.query("buildingName") || "").trim();
  const floorName = (c.req.query("floorName") || "").trim();
  const page = Number(c.req.query("page"));
  const pageSize = Number(c.req.query("pageSize"));
  return ok(
    c,
    listRooms(getDb(), corpId, {
      keyword: keyword || undefined,
      enabled,
      buildingName: buildingName || undefined,
      floorName: floorName || undefined,
      page: Number.isFinite(page) ? page : undefined,
      pageSize: Number.isFinite(pageSize) ? pageSize : undefined
    })
  );
});

rooms.get("/rooms/:id", (c) => {
  const res = getRoom(getDb(), c.get("corpId"), c.req.param("id"));
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

rooms.post("/rooms", async (c) => {
  const body = await c.req.json();
  const res = createRoom(getDb(), c.get("corpId"), body);
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

rooms.put("/rooms/:id", async (c) => {
  const body = await c.req.json();
  const res = updateRoom(getDb(), c.get("corpId"), c.req.param("id"), body);
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

rooms.put("/rooms/:id/enabled", async (c) => {
  const body = await c.req.json();
  const res = setRoomEnabled(getDb(), c.get("corpId"), c.req.param("id"), Boolean(body.enabled));
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

export default rooms;
