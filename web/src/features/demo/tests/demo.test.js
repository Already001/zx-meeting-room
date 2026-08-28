import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_ADMIN_TENANTS,
  DEMO_TENANTS,
  canEnterDemoAdmin,
  clearDemoSession,
  demoEnterUrl,
  demoHomeUrl,
  hasDemoIdentity
} from "../demoTenants.js";

test("demo userIds are globally unique", () => {
  const ids = DEMO_TENANTS.flatMap((t) => t.users.map((u) => u.userId));
  assert.equal(new Set(ids).size, ids.length);
});

test("hasDemoIdentity requires both corp and user", () => {
  assert.equal(hasDemoIdentity("zx-001", "demo-admin"), true);
  assert.equal(hasDemoIdentity("", "demo-admin"), false);
  assert.equal(hasDemoIdentity("zx-001", ""), false);
  assert.equal(hasDemoIdentity(null, "x"), false);
});

test("demoEnterUrl encodes identity query on the MPA base", () => {
  const url = demoEnterUrl(
    "zx-001",
    { userId: "demo-admin", userName: "李明", dept: "研发" },
    "/meeting/"
  );
  assert.ok(url.startsWith("/meeting/?"));
  const q = new URLSearchParams(url.slice(url.indexOf("?") + 1));
  assert.equal(q.get("corpId"), "zx-001");
  assert.equal(q.get("userId"), "demo-admin");
  assert.equal(q.get("userName"), "李明");
  assert.equal(q.get("dept"), "研发");
});

test("demoEnterUrl can land on admin path", () => {
  const url = demoEnterUrl(
    "zx-001",
    { userId: "demo-admin", userName: "李明", dept: "研发" },
    "/meeting/zx/",
    "admin"
  );
  assert.ok(url.startsWith("/meeting/zx/admin?"));
  const q = new URLSearchParams(url.slice(url.indexOf("?") + 1));
  assert.equal(q.get("userId"), "demo-admin");
});

test("demo admin tenants only include admin users", () => {
  const ids = DEMO_ADMIN_TENANTS.flatMap((t) => t.users.map((u) => u.userId));
  assert.deepEqual(ids, ["demo-admin", "acme-admin"]);
});

test("canEnterDemoAdmin hides m entry", () => {
  assert.equal(canEnterDemoAdmin("main"), true);
  assert.equal(canEnterDemoAdmin("zx"), true);
  assert.equal(canEnterDemoAdmin("m"), false);
});

test("clearDemoSession drops identity keys only", () => {
  const store = new Map([
    ["meetingCorpId", "zx-001"],
    ["meetingUserId", "demo-admin"],
    ["meetingUserName", "李明"],
    ["meetingUserDept", "研发"],
    ["meetingToken", '{"access_token":"t"}'],
    ["clientType", "app"]
  ]);
  const storage = {
    removeItem: (key) => store.delete(key)
  };
  clearDemoSession(storage);
  assert.equal(store.has("meetingCorpId"), false);
  assert.equal(store.has("meetingToken"), true);
  assert.equal(store.get("clientType"), "app");
});

test("demoHomeUrl normalizes trailing slash", () => {
  assert.equal(demoHomeUrl("/meeting/zx"), "/meeting/zx/");
  assert.equal(demoHomeUrl("/meeting/m/"), "/meeting/m/");
});
