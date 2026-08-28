import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyAgentUi,
  applyAgentEvent,
  backFromConfirm
} from "../agent/applyEvent.js";

const queryEvent = {
  type: "query",
  heading: "今天下午 · 空闲 ≥ 1 小时",
  rooms: [{ roomId: "r1", roomName: "1号", slots: [] }],
  expression: "focus"
};

test("emptyAgentUi returns idle closed state", () => {
  assert.deepEqual(emptyAgentUi(), {
    open: false,
    sessionId: "",
    status: "",
    expression: "idle",
    card: null,
    backCard: null
  });
});

test("session writes sessionId and keeps other fields", () => {
  const next = applyAgentEvent(emptyAgentUi(), {
    type: "session",
    sessionId: "sess-1"
  });
  assert.equal(next.sessionId, "sess-1");
  assert.equal(next.open, false);
  assert.equal(next.card, null);
});

test("status after query keeps card and updates status + expression", () => {
  const withQuery = applyAgentEvent(
    { ...emptyAgentUi(), open: true },
    queryEvent
  );
  const next = applyAgentEvent(withQuery, {
    type: "status",
    text: "正在查空档",
    expression: "focus"
  });
  assert.equal(next.status, "正在查空档");
  assert.equal(next.expression, "focus");
  assert.deepEqual(next.card, {
    type: "query",
    heading: queryEvent.heading,
    rooms: queryEvent.rooms
  });
});

test("query replaces card, clears status, sets expression, opens panel", () => {
  const prev = {
    ...emptyAgentUi(),
    open: true,
    status: "正在理解",
    expression: "focus"
  };
  const next = applyAgentEvent(prev, queryEvent);
  assert.equal(next.status, "");
  assert.equal(next.expression, "focus");
  assert.equal(next.open, true);
  assert.deepEqual(next.card, {
    type: "query",
    heading: queryEvent.heading,
    rooms: queryEvent.rooms
  });
  assert.notEqual(next, prev);
  assert.notEqual(next.card, prev.card);
});

test("confirm suggest need_more and error each replace card", () => {
  const draft = { draftId: "d1", roomName: "1号" };
  const confirm = applyAgentEvent(emptyAgentUi(), {
    type: "confirm",
    draft,
    expression: "focus"
  });
  assert.deepEqual(confirm.card, { type: "confirm", draft });

  const suggest = applyAgentEvent(emptyAgentUi(), {
    type: "suggest",
    reason: "该时段已被占用",
    options: [{ roomId: "r1" }],
    expression: "sorry"
  });
  assert.deepEqual(suggest.card, {
    type: "suggest",
    reason: "该时段已被占用",
    options: [{ roomId: "r1" }]
  });

  const needMore = applyAgentEvent(emptyAgentUi(), {
    type: "need_more",
    text: "请说明日期",
    expression: "focus"
  });
  assert.deepEqual(needMore.card, { type: "need_more", text: "请说明日期" });

  const err = applyAgentEvent(emptyAgentUi(), {
    type: "error",
    msg: "助手未配置",
    code: "M5001",
    expression: "sorry"
  });
  assert.deepEqual(err.card, {
    type: "error",
    msg: "助手未配置",
    code: "M5001"
  });
});

test("booked keeps panel open with success card and happy expression", () => {
  const slot = {
    roomId: "r1",
    roomName: "星海",
    date: "2026-08-27",
    start: "14:00",
    end: "15:00"
  };
  const prev = {
    ...emptyAgentUi(),
    open: true,
    sessionId: "sess-1",
    status: "正在预定",
    expression: "focus",
    card: { type: "confirm", draft: { draftId: "d1" } }
  };
  const next = applyAgentEvent(prev, {
    type: "booked",
    bookingId: "b1",
    title: "评审会",
    slot,
    expression: "happy"
  });
  assert.equal(next.open, true);
  assert.equal(next.status, "");
  assert.equal(next.expression, "happy");
  assert.equal(next.sessionId, "sess-1");
  assert.deepEqual(next.card, {
    type: "booked",
    bookingId: "b1",
    title: "评审会",
    slot
  });
});

test("closed collapses panel with down expression", () => {
  const prev = {
    ...emptyAgentUi(),
    open: true,
    status: "正在理解",
    card: { type: "query", heading: "h", rooms: [] }
  };
  const next = applyAgentEvent(prev, { type: "closed", expression: "down" });
  assert.equal(next.open, false);
  assert.equal(next.card, null);
  assert.equal(next.status, "");
  assert.equal(next.expression, "down");
});

test("debug event does not change ui state", () => {
  const prev = applyAgentEvent(emptyAgentUi(), queryEvent);
  const next = applyAgentEvent(prev, {
    type: "debug",
    entry: { id: "1", ts: 1, cat: "search", title: "x" }
  });
  assert.equal(next, prev);
});

test("confirm remembers query as backCard; backFromConfirm restores it", () => {
  const withQuery = applyAgentEvent(emptyAgentUi(), queryEvent);
  const withConfirm = applyAgentEvent(withQuery, {
    type: "confirm",
    draft: { draftId: "d1" },
    expression: "expect"
  });
  assert.equal(withConfirm.card?.type, "confirm");
  assert.deepEqual(withConfirm.backCard, {
    type: "query",
    heading: queryEvent.heading,
    rooms: queryEvent.rooms
  });

  const back = backFromConfirm(withConfirm);
  assert.equal(back.open, true);
  assert.deepEqual(back.card, withConfirm.backCard);
  assert.equal(back.expression, "ease");
});

test("unknown event type leaves state unchanged", () => {
  const prev = emptyAgentUi();
  const next = applyAgentEvent(prev, { type: "nope" });
  assert.equal(next, prev);
});

test("backFromConfirm without backCard clears card and stays open", () => {
  const confirm = applyAgentEvent(emptyAgentUi(), {
    type: "confirm",
    draft: { draftId: "d1" },
    expression: "expect"
  });
  const back = backFromConfirm(confirm);
  assert.equal(back.open, true);
  assert.equal(back.card, null);
  assert.equal(back.expression, "idle");
});

test("backFromConfirm from suggest uses sorry expression", () => {
  const suggest = applyAgentEvent(emptyAgentUi(), {
    type: "suggest",
    reason: "占用",
    options: [],
    expression: "sorry"
  });
  const confirm = applyAgentEvent(suggest, {
    type: "confirm",
    draft: { draftId: "d1" },
    expression: "expect"
  });
  const back = backFromConfirm(confirm);
  assert.equal(back.expression, "sorry");
  assert.equal(back.card?.type, "suggest");
});
