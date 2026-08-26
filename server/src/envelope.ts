import type { Context } from "hono";

export const ok = (c: Context, data: unknown) =>
  c.json({ code: "M0000", data, msg: "" });

export const fail = (c: Context, code: string, msg: string) =>
  c.json({ code, data: null, msg });
