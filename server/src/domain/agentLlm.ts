import type { SearchQuery } from "./availability.js";

export type LlmDecision =
  | { kind: "search"; args: SearchQuery }
  | { kind: "need_more"; text: string }
  | { kind: "query_heading"; heading?: string };

export type LlmPort = {
  complete: (args: { userText: string; toolResult?: unknown }) => Promise<LlmDecision>;
};

type OpenAiLlmOpts = {
  baseUrl: string;
  apiKey: string;
  model: string;
  fetchImpl?: typeof fetch;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: Array<{
        function?: { name?: string; arguments?: string };
      }>;
    };
  }>;
};

const SYSTEM_PROMPT =
  "你是会议室助手。只通过 search_availability 查空档。日期用 yyyy-MM-dd。时长默认 60 分钟。不要声称已经预定。";

const SEARCH_TOOL = {
  type: "function" as const,
  function: {
    name: "search_availability",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string" },
        durationMin: { type: "number" },
        windowStart: { type: "string" },
        windowEnd: { type: "string" },
        buildingName: { type: "string" },
        floorName: { type: "string" },
        capacity: { type: "number" },
        facilities: { type: "array", items: { type: "string" } }
      }
    }
  }
};

export const createOpenAiLlm = (opts: OpenAiLlmOpts): LlmPort => {
  const fetchFn = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl.replace(/\/$/, "");

  return {
    async complete({ userText }) {
      const res = await fetchFn(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: opts.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userText }
          ],
          tools: [SEARCH_TOOL],
          tool_choice: "auto"
        })
      });

      if (!res.ok) {
        throw new Error(`LLM request failed: ${res.status}`);
      }

      const data = (await res.json()) as ChatCompletionResponse;
      const message = data.choices?.[0]?.message;
      const toolCall = message?.tool_calls?.[0];

      if (toolCall?.function?.name === "search_availability") {
        const args = JSON.parse(toolCall.function.arguments || "{}") as SearchQuery;
        return { kind: "search", args };
      }

      const content = message?.content?.trim() ?? "";
      if (content) {
        return { kind: "need_more", text: content.slice(0, 80) };
      }

      return { kind: "need_more", text: "请补充更多信息" };
    }
  };
};
