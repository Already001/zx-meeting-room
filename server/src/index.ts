import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const loadEnvFile = () => {
  const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
};

loadEnvFile();

const PORT = Number(process.env.PORT || 3100);
const app = createApp();

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[meeting-server] listening on http://localhost:${info.port}`);
});
