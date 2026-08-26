import { createMiddleware } from "hono/factory";
import { fail } from "../envelope.js";

export const parseAdminIds = (raw = process.env.MEETING_ADMIN_USER_IDS || ""): string[] =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const isAdminUser = (userId: string | null | undefined): boolean => {
  if (!userId) return false;
  return parseAdminIds().includes(userId);
};

export const readUser = (c: { req: { header: (n: string) => string | undefined } }) => ({
  userId: (c.req.header("zxUserId") || "").trim(),
  userName: (c.req.header("zxUserName") || "").trim(),
  dept: (c.req.header("zxUserDept") || "").trim()
});

export const requireUser = createMiddleware(async (c, next) => {
  const { userId, userName, dept } = readUser(c);
  if (!userId) return fail(c, "M4002", "缺少用户信息，请重新登录");
  c.set("userId", userId);
  c.set("userName", userName);
  c.set("dept", dept);
  await next();
});

export const requireAdmin = createMiddleware(async (c, next) => {
  const { userId, userName, dept } = readUser(c);
  if (!userId) return fail(c, "M4002", "缺少用户信息，请重新登录");
  if (!isAdminUser(userId)) return fail(c, "M4003", "无管理权限");
  c.set("userId", userId);
  c.set("userName", userName);
  c.set("dept", dept);
  await next();
});
