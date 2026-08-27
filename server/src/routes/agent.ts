import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { buildAgentSuggestions } from "../domain/agentSuggestions.js";
import { createAgentSessionStore } from "../domain/agentSession.js";
import { formatDebugLine, makeDebug, type AgentDebugEntry } from "../domain/agentDebug.js";
import { createOpenAiLlm } from "../domain/agentLlm.js";
import { handleTurn, parseTurnAction, type TurnAction } from "../domain/agentTurn.js";
import { fail, ok } from "../envelope.js";
import { requireUser } from "../middleware/user.js";
import type { AppVars } from "../types.js";

const sessionStore = createAgentSessionStore();
const lastMessageTurnAt = new Map<string, number>();
const MESSAGE_TURN_GAP_MS = 800;

type TurnBody = {
  sessionId?: string;
  action?: TurnAction;
  message?: string;
  slot?: {
    roomId: string;
    roomName: string;
    buildingName: string;
    floorName: string;
    capacity: number;
    facilities: string[];
    date: string;
    start: string;
    end: string;
  };
  draftId?: string;
  title?: string;
};

const sseErrorPayload = JSON.stringify({
  type: "error",
  msg: "助手暂时不可用",
  expression: "sorry"
});

const agent = new Hono<{ Variables: AppVars }>();

agent.get("/agent/suggestions", requireUser, (c) =>
  ok(c, buildAgentSuggestions(c.get("db"), c.get("corpId"), c.get("userId")))
);

agent.post("/agent/turn", requireUser, async (c) => {
  let body: TurnBody;
  try {
    body = await c.req.json();
  } catch {
    return fail(c, "M4000", "请求无效");
  }

  const action = parseTurnAction((body as { action?: unknown }).action);
  if (action === null) {
    return fail(c, "M4000", "请求无效");
  }
  body.action = action;

  if (typeof body.message === "string") {
    body.message = body.message.slice(0, 2000);
  }

  if (action === "message") {
    const apiKey = process.env.MEETING_LLM_API_KEY;
    const baseUrl = process.env.MEETING_LLM_BASE_URL;
    if (!apiKey || !baseUrl) {
      return fail(c, "M4000", "助手未配置");
    }

    const userId = c.get("userId");
    const now = Date.now();
    const last = lastMessageTurnAt.get(userId) ?? 0;
    if (now - last < MESSAGE_TURN_GAP_MS) {
      return fail(c, "M4000", "请求过于频繁");
    }
    lastMessageTurnAt.set(userId, now);
  }

  const debugBag: AgentDebugEntry[] = [];
  const onDebug = (entry: AgentDebugEntry) => {
    debugBag.push(entry);
    if (entry.cat === "error") {
      console.error(formatDebugLine(entry), entry.data ?? "");
    } else {
      console.info(formatDebugLine(entry), entry.data ?? "");
    }
  };

  onDebug(
    makeDebug("turn", body.action ?? "message", {
      sessionId: body.sessionId ?? null,
      message: typeof body.message === "string" ? body.message.slice(0, 200) : undefined,
      draftId: body.draftId,
      slot: body.slot
        ? `${body.slot.roomName} ${body.slot.date} ${body.slot.start}-${body.slot.end}`
        : undefined
    })
  );

  const llm =
    action === "message"
      ? createOpenAiLlm({
          baseUrl: process.env.MEETING_LLM_BASE_URL!,
          apiKey: process.env.MEETING_LLM_API_KEY!,
          model: process.env.MEETING_LLM_MODEL || "gpt-4o-mini",
          onDebug
        })
      : undefined;

  const flushDebug = async (stream: { writeSSE: (p: { data: string }) => Promise<void> }) => {
    for (const entry of debugBag) {
      await stream.writeSSE({ data: JSON.stringify({ type: "debug", entry }) });
    }
  };

  return streamSSE(
    c,
    async (stream) => {
      await stream.writeSSE({
        data: JSON.stringify({ type: "status", text: "正在理解", expression: "focus" })
      });

      try {
        const events = await handleTurn({
          db: c.get("db"),
          corpId: c.get("corpId"),
          user: {
            userId: c.get("userId"),
            userName: c.get("userName"),
            dept: c.get("dept")
          },
          body,
          store: sessionStore,
          llm,
          onDebug
        });

        await flushDebug(stream);
        for (const event of events) {
          await stream.writeSSE({ data: JSON.stringify(event) });
        }
      } catch (err) {
        onDebug(makeDebug("error", "sse handleTurn failed", String(err)));
        await flushDebug(stream);
        await stream.writeSSE({ data: sseErrorPayload });
      }
    },
    async (err, stream) => {
      onDebug(makeDebug("error", "sse stream failed", String(err)));
      await flushDebug(stream);
      await stream.writeSSE({ data: sseErrorPayload });
    }
  );
});

export default agent;
