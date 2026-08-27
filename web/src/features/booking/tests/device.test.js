import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDevice } from "../../../use/device.js";

test("zx entry is always PC even when UA looks mobile", () => {
  assert.equal(resolveDevice({ mpaPlatform: "zx", uaIsMobile: true }), "pc");
});

test("m entry is always mobile even when UA looks desktop", () => {
  assert.equal(
    resolveDevice({ mpaPlatform: "m", uaIsMobile: false }),
    "mobile"
  );
});

test("main entry follows UA, not viewport", () => {
  assert.equal(
    resolveDevice({ buildTarget: "main", uaIsMobile: true }),
    "mobile"
  );
  assert.equal(resolveDevice({ buildTarget: "main", uaIsMobile: false }), "pc");
});

test("forced flag wins over entry and UA", () => {
  assert.equal(
    resolveDevice({
      mpaPlatform: "m",
      uaIsMobile: true,
      forced: "pc"
    }),
    "pc"
  );
});

test("booking CSS keys PC chrome off data-device, not min-width", () => {
  const css = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../booking.css"),
    "utf8"
  );
  assert.equal(/@media\s*\(\s*min-width:\s*1024px\s*\)/.test(css), false);
  assert.match(css, /html\[data-device=["']pc["']\]/);
});
