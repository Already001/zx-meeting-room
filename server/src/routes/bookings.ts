import { Hono } from "hono";
import {
  createBooking,
  getBoard,
  listAdminBookings,
  listBookingAudits,
  listMine,
  releaseBooking,
  updateBooking
} from "../domain/booking.js";
import { fail, ok } from "../envelope.js";
import { isAdminUser, readUser, requireAdmin, requireUser } from "../middleware/user.js";
import type { AppVars } from "../types.js";

const bookings = new Hono<{ Variables: AppVars }>();

bookings.get("/board", (c) => {
  const { userId } = readUser(c);
  const res = getBoard(c.get("db"), c.get("corpId"), c.req.query("date") || "", userId);
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

bookings.get("/bookings/mine", requireUser, (c) =>
  ok(c, listMine(c.get("db"), c.get("corpId"), c.get("userId")))
);

bookings.get("/bookings/admin", requireAdmin, (c) => {
  const page = Number(c.req.query("page"));
  const pageSize = Number(c.req.query("pageSize"));
  return ok(
    c,
    listAdminBookings(c.get("db"), c.get("corpId"), {
      page: Number.isFinite(page) ? page : undefined,
      pageSize: Number.isFinite(pageSize) ? pageSize : undefined
    })
  );
});

bookings.post("/bookings", requireUser, async (c) => {
  const body = await c.req.json();
  const res = createBooking(
    c.get("db"),
    c.get("corpId"),
    { userId: c.get("userId"), userName: c.get("userName"), dept: c.get("dept") },
    body
  );
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

bookings.put("/bookings/:id/release", requireUser, (c) => {
  const res = releaseBooking(
    c.get("db"),
    c.get("corpId"),
    { userId: c.get("userId"), userName: c.get("userName"), dept: c.get("dept") },
    c.req.param("id")
  );
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

bookings.put("/bookings/:id", requireUser, async (c) => {
  const body = await c.req.json();
  const res = updateBooking(
    c.get("db"),
    c.get("corpId"),
    { userId: c.get("userId"), userName: c.get("userName"), dept: c.get("dept") },
    c.req.param("id"),
    body
  );
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

bookings.get("/bookings/:id/audit", requireUser, (c) => {
  const res = listBookingAudits(c.get("db"), c.get("corpId"), c.req.param("id"), {
    userId: c.get("userId"),
    isAdmin: isAdminUser(c.get("userId"))
  });
  if (!res.ok) return fail(c, res.code, res.msg);
  return ok(c, res.value);
});

export default bookings;
