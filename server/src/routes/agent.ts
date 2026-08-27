import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { createAgentSessionStore } from "../domain/agentSession.js";
import { createOpenAiLlm } from "../domain/agentLlm.js";
import { handleTurn } from "../domain/agentTurn.js";
import { fail } from "../envelope.js";
import { requireUser } from "../middleware/user.js";
import type { AppVars } from "../types.js";

const sessionStore = createAgentSessionStore();

type TurnBody = {
  sessionId?: string;
  action?: "message" | "pick_slot" | "confirm" | "cancel";
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

const agent = new Hono<{ Variables: AppVars }>();

agent.post("/agent/turn", requireUser, async (c) => {
  let body: TurnBody;
  try {
    body = await c.req.json();
  } catch {
    return fail(c, "M4000", "请求无效");
  }

  const action = body.action ?? "message";

  if (action === "message") {
    const apiKey = process.env.MEETING_LLM_API_KEY;
    const baseUrl = process.env.MEETING_LLM_BASE_URL;
    if (!apiKey || !baseUrl) {
      return fail(c, "M4000", "助手未配置");
    }
  }

  const llm =
    action === "message"
      ? createOpenAiLlm({
          baseUrl: process.env.MEETING_LLM_BASE_URL!,
          apiKey: process.env.MEETING_LLM_API_KEY!,
          model: process.env.MEETING_LLM_MODEL || "gpt-4o-mini"
        })
      : undefined;

  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      data: JSON.stringify({ type: "status", text: "正在理解", expression: "focus" })
    });

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
  });
});

export default agent;
