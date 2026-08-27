import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { createAgentSessionStore } from "../domain/agentSession.js";
import { createOpenAiLlm } from "../domain/agentLlm.js";
import { handleTurn, parseTurnAction, type TurnAction } from "../domain/agentTurn.js";
import { fail } from "../envelope.js";
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

  const llm =
    action === "message"
      ? createOpenAiLlm({
          baseUrl: process.env.MEETING_LLM_BASE_URL!,
          apiKey: process.env.MEETING_LLM_API_KEY!,
          model: process.env.MEETING_LLM_MODEL || "gpt-4o-mini"
        })
      : undefined;

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
          llm
        });

        for (const event of events) {
          await stream.writeSSE({ data: JSON.stringify(event) });
        }
      } catch {
        await stream.writeSSE({ data: sseErrorPayload });
      }
    },
    async (_err, stream) => {
      await stream.writeSSE({ data: sseErrorPayload });
    }
  );
});

export default agent;
