import { Hono } from "hono";
import { getDb } from "../db.js";
import { createBooking, getBoard, listMine, releaseBooking } from "../domain/booking.js";
import { fail, ok } from "../envelope.js";
import { readUser, requireUser } from "../middleware/user.js";

type Vars = { corpId: string; userId: string; userName: string; dept: string };
const bookings = new Hono<{ Variables: Vars }>();

bookings.get("/board", (c) => {
  const { userId } = readUser(c);
  const res = getBoard(getDb(), c.get("corpId"), c.req.query("date") || "", userId);
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

bookings.get("/bookings/mine", requireUser, (c) =>
  ok(c, listMine(getDb(), c.get("corpId"), c.get("userId")))
);

bookings.post("/bookings", requireUser, async (c) => {
  const body = await c.req.json();
  const res = createBooking(
    getDb(),
    c.get("corpId"),
    { userId: c.get("userId"), userName: c.get("userName"), dept: c.get("dept") },
    body
  );
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

bookings.put("/bookings/:id/release", requireUser, (c) => {
  const res = releaseBooking(getDb(), c.get("corpId"), c.get("userId"), c.req.param("id"));
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

export default bookings;
