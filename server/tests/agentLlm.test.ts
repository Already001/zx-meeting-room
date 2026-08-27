import { test } from "node:test";
import assert from "node:assert/strict";
import { openMemoryDb, ensureDefaultDicts } from "../src/db.ts";
import { createRoom } from "../src/domain/room.ts";
import { createAgentSessionStore } from "../src/domain/agentSession.ts";
import { handleTurn } from "../src/domain/agentTurn.ts";
import { createOpenAiLlm } from "../src/domain/agentLlm.ts";

const FROZEN = { date: "2026-08-27", minute: 10 * 60 };
const CORP = "c1";
const host = { userId: "u1", userName: "张三", dept: "研发" };

const roomBase = {
  name: "1号",
  buildingName: "奥城",
  floorName: "7层",
  capacity: 8,
  facilities: ["电视"],
  openStart: "09:00",
  openEnd: "18:00",
  bookAheadDays: 7 as const,
  needApproval: false,
  allowRecurring: false,
  allowPreempt: false,
  enabled: true
};

const bookingCount = (db: ReturnType<typeof openMemoryDb>) =>
  (db.prepare("SELECT count(*) AS n FROM bookings").get() as { n: number }).n;

const setup = () => {
  const db = openMemoryDb();
  ensureDefaultDicts(db, CORP);
  const room = createRoom(db, CORP, roomBase);
  assert.equal(room.ok, true);
  if (!room.ok) throw new Error("setup room failed");
  return { db, roomId: room.value.id };
};

const searchToolResponse = (args: Record<string, unknown>) =>
  new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            tool_calls: [
              {
                function: {
                  name: "search_availability",
                  arguments: JSON.stringify(args)
                }
              }
            ]
          }
        }
      ]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );

const contentOnlyResponse = (content: string) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content } }]
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );

test("createOpenAiLlm debug entries increment loop round per complete", async () => {
  const logs: Array<{ round?: number; cat: string; title: string }> = [];
  const llm = createOpenAiLlm({
    baseUrl: "https://llm.example",
    apiKey: "sk-test",
    model: "gpt-test",
    onDebug: (entry) => logs.push(entry),
    fetchImpl: async () => searchToolResponse({ date: "2026-08-27", durationMin: 60 })
  });

  await llm.complete({ userText: "今天下午一小时" });
  await llm.complete({ userText: "再查一次" });

  const first = logs.filter((e) => e.round === 1);
  const second = logs.filter((e) => e.round === 2);
  assert.ok(first.length >= 1);
  assert.ok(second.length >= 1);
  assert.ok(first.some((e) => e.cat === "http"));
  assert.ok(second.some((e) => e.cat === "search"));
});

test("createOpenAiLlm parses search_availability tool call", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const llm = createOpenAiLlm({
    baseUrl: "https://llm.example",
    apiKey: "sk-test",
    model: "gpt-test",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return searchToolResponse({ date: "2026-08-27", durationMin: 60 });
    }
  });

  const decision = await llm.complete({ userText: "今天下午一小时" });
  assert.deepEqual(decision, {
    kind: "search",
    args: { date: "2026-08-27", durationMin: 60 }
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, "https://llm.example/v1/chat/completions");
  const body = JSON.parse(String(calls[0]?.init?.body));
  assert.equal(body.model, "gpt-test");
  assert.equal(body.messages[1].content, "今天下午一小时");
});

test("createOpenAiLlm coerces ISO window times in tool args", async () => {
  const llm = createOpenAiLlm({
    baseUrl: "https://llm.example",
    apiKey: "sk-test",
    model: "gpt-test",
    fetchImpl: async () =>
      searchToolResponse({
        date: "2025-06-18T14:00",
        windowStart: "2025-06-18T14:00",
        windowEnd: "2025-06-18T16:00",
        durationMin: 60
      })
  });

  const decision = await llm.complete({ userText: "下午两点" });
  assert.deepEqual(decision, {
    kind: "search",
    args: {
      date: "2025-06-18",
      windowStart: "14:00",
      windowEnd: "16:00",
      durationMin: 60
    }
  });
});

test("createOpenAiLlm does not nest /v1 under already-versioned base URL", async () => {
  const calls: string[] = [];
  const llm = createOpenAiLlm({
    baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4",
    apiKey: "sk-test",
    model: "glm-test",
    fetchImpl: async (url) => {
      calls.push(String(url));
      return contentOnlyResponse("还要几点");
    }
  });

  await llm.complete({ userText: "查空档" });
  assert.equal(calls[0], "https://open.bigmodel.cn/api/coding/paas/v4/chat/completions");
});

test("createOpenAiLlm returns need_more when no tool call", async () => {
  const llm = createOpenAiLlm({
    baseUrl: "https://llm.example",
    apiKey: "sk-test",
    model: "gpt-test",
    fetchImpl: async () => contentOnlyResponse("还要几点")
  });

  const decision = await llm.complete({ userText: "订会议室" });
  assert.deepEqual(decision, { kind: "need_more", text: "还要几点" });
});

test("createOpenAiLlm fetch uses an abort signal", async () => {
  let signal: AbortSignal | undefined;
  const llm = createOpenAiLlm({
    baseUrl: "https://llm.example",
    apiKey: "sk-test",
    model: "gpt-test",
    fetchImpl: async (_url, init) => {
      signal = init?.signal;
      return contentOnlyResponse("还要几点");
    }
  });
  await llm.complete({ userText: "订会议室" });
  assert.ok(signal);
  assert.equal(signal.aborted, false);
});

test("handleTurn truncates message to 2000 chars before llm", async () => {
  const { db } = setup();
  const store = createAgentSessionStore();
  const seen: string[] = [];
  const llm = {
    complete: async ({ userText }: { userText: string }) => {
      seen.push(userText);
      return { kind: "need_more" as const, text: "请补充" };
    }
  };

  await handleTurn({
    db,
    corpId: CORP,
    user: host,
    body: { action: "message", message: "订".repeat(2001) },
    store,
    now: FROZEN,
    llm
  });

  assert.equal(seen.length, 1);
  assert.equal(seen[0]?.length, 2000);
});

test("handleTurn message with search tool returns query and zero bookings", async () => {
  const { db } = setup();
  const store = createAgentSessionStore();
  const llm = createOpenAiLlm({
    baseUrl: "https://llm.example",
    apiKey: "sk-test",
    model: "gpt-test",
    fetchImpl: async () => searchToolResponse({ date: "2026-08-27", durationMin: 60 })
  });

  const events = await handleTurn({
    db,
    corpId: CORP,
    user: host,
    body: { action: "message", message: "今天下午订一小时" },
    store,
    now: FROZEN,
    llm
  });

  assert.equal(bookingCount(db), 0);
  const query = events.find((e) => e.type === "query");
  assert.ok(query?.type === "query");
  assert.equal(query.expression, "ease");
  assert.ok(query.rooms.length > 0);
  assert.ok(query.rooms.some((r) => r.slots.length > 0));
});

test("handleTurn message with need_more content returns puzzled need_more", async () => {
  const { db } = setup();
  const store = createAgentSessionStore();
  const llm = createOpenAiLlm({
    baseUrl: "https://llm.example",
    apiKey: "sk-test",
    model: "gpt-test",
    fetchImpl: async () => contentOnlyResponse("还要几点")
  });

  const events = await handleTurn({
    db,
    corpId: CORP,
    user: host,
    body: { action: "message", message: "订会议室" },
    store,
    now: FROZEN,
    llm
  });

  assert.equal(bookingCount(db), 0);
  const needMore = events.find((e) => e.type === "need_more");
  assert.deepEqual(needMore, { type: "need_more", text: "还要几点", expression: "puzzled" });
});

test("pick_slot after themed search pre-fills confirm title 面试", async () => {
  const { db } = setup();
  const store = createAgentSessionStore();
  const llm = createOpenAiLlm({
    baseUrl: "https://llm.example",
    apiKey: "sk-test",
    model: "gpt-test",
    fetchImpl: async () =>
      searchToolResponse({
        date: "2026-08-27",
        durationMin: 30,
        roomName: "1号"
      })
  });

  const queried = await handleTurn({
    db,
    corpId: CORP,
    user: host,
    body: { action: "message", message: "一号 现在 半小时 面试" },
    store,
    now: FROZEN,
    llm
  });
  const query = queried.find((e) => e.type === "query");
  assert.ok(query?.type === "query");
  const sessionId = queried.find((e) => e.type === "session")?.sessionId;
  const slot = query.rooms[0]?.slots[0];
  assert.ok(sessionId);
  assert.ok(slot);

  const picked = await handleTurn({
    db,
    corpId: CORP,
    user: host,
    body: { sessionId, action: "pick_slot", slot },
    store,
    now: FROZEN
  });
  const confirm = picked.find((e) => e.type === "confirm");
  assert.ok(confirm?.type === "confirm");
  assert.equal(confirm.draft.title, "面试");
});

test("handleTurn message with booking intent and single slot still returns query", async () => {
  const { db } = setup();
  const store = createAgentSessionStore();
  const llm = createOpenAiLlm({
    baseUrl: "https://llm.example",
    apiKey: "sk-test",
    model: "gpt-test",
    fetchImpl: async () =>
      searchToolResponse({
        date: "2026-08-27",
        durationMin: 60,
        windowStart: "14:00",
        windowEnd: "15:00",
        buildingName: "奥城",
        floorName: "7层",
        capacity: 8
      })
  });

  const events = await handleTurn({
    db,
    corpId: CORP,
    user: host,
    body: { action: "message", message: "帮我订明天下午2点奥城7层1号" },
    store,
    now: FROZEN,
    llm
  });

  assert.equal(bookingCount(db), 0);
  assert.ok(events.some((e) => e.type === "query"));
  assert.equal(events.some((e) => e.type === "confirm"), false);
  assert.equal(events.some((e) => e.type === "booked"), false);
});

test("handleTurn message llm fetch failure returns sorry error", async () => {
  const { db } = setup();
  const store = createAgentSessionStore();
  const llm = createOpenAiLlm({
    baseUrl: "https://llm.example",
    apiKey: "sk-test",
    model: "gpt-test",
    fetchImpl: async () => new Response("bad gateway", { status: 502 })
  });

  const events = await handleTurn({
    db,
    corpId: CORP,
    user: host,
    body: { action: "message", message: "查空档" },
    store,
    now: FROZEN,
    llm
  });

  assert.equal(bookingCount(db), 0);
  assert.deepEqual(events.find((e) => e.type === "error"), {
    type: "error",
    msg: "助手暂时不可用",
    expression: "sorry"
  });
});
