import { test } from "node:test";
import assert from "node:assert/strict";
import { createAgentSessionStore } from "../src/domain/agentSession.ts";

const slot = {
  roomId: "r1",
  roomName: "星海",
  buildingName: "A座",
  floorName: "3F",
  capacity: 12,
  facilities: [] as string[],
  date: "2026-08-27",
  start: "14:00",
  end: "15:00"
};

test("expired draft cannot be read", () => {
  let t = 0;
  const store = createAgentSessionStore({ ttlMs: 10, now: () => t });
  const { sessionId } = store.ensure("u1");
  store.rememberSlots("u1", sessionId, [slot]);
  const d = store.putDraft("u1", sessionId, slot, "周会");
  t = 11;
  assert.equal(store.getDraft("u1", d.draftId), null);
});

test("other user cannot read draft", () => {
  const store = createAgentSessionStore();
  const { sessionId } = store.ensure("u1");
  store.rememberSlots("u1", sessionId, [slot]);
  const d = store.putDraft("u1", sessionId, slot, "");
  assert.equal(store.getDraft("u2", d.draftId), null);
});

test("hasIssued is exact on room+date+start+end", () => {
  const store = createAgentSessionStore();
  const { sessionId } = store.ensure("u1");
  store.rememberSlots("u1", sessionId, [slot]);
  assert.equal(store.hasIssued("u1", sessionId, slot), true);
  assert.equal(store.hasIssued("u1", sessionId, { ...slot, start: "15:00", end: "16:00" }), false);
});
