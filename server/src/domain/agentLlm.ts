import type { SearchQuery } from "./availability.js";
import { emitDebug, makeDebug, type DebugSink } from "./agentDebug.js";
import { isDate, parseHm, shanghaiNow } from "./time.js";

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
  onDebug?: DebugSink;
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
  "你是会议室助手。只通过 search_availability 查空档。date 用 yyyy-MM-dd。windowStart/windowEnd 只用 HH:mm（如 14:00），禁止 ISO 日期时间。「现在」不要填 window，只填 durationMin。一号/1号/1号会议室填 roomName，不要填 buildingName。用户说的会议主题（如面试、周会）填 title。时长默认 60 分钟。只要能推断日期（含今天/明天）就必须调用该工具。不要声称已经预定。";

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
        roomName: { type: "string" },
        buildingName: { type: "string" },
        floorName: { type: "string" },
        capacity: { type: "number" },
        facilities: { type: "array", items: { type: "string" } },
        title: { type: "string" }
      }
    }
  }
};

/** OpenAI 根拼 /v1/chat/completions；已带 /v4 等版本段的只拼 /chat/completions。 */
export const chatCompletionsUrl = (baseUrl: string): string => {
  const base = baseUrl.replace(/\/+$/, "");
  if (base.endsWith("/chat/completions")) return base;
  if (/\/v\d+$/i.test(base)) return `${base}/chat/completions`;
  return `${base}/v1/chat/completions`;
};

const asTrimmed = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
};

const coerceHm = (value: unknown): string | undefined => {
  const text = asTrimmed(value);
  if (!text) return undefined;
  if (parseHm(text) != null) return text;
  const iso = text.match(/T(\d{2}:\d{2})/);
  if (iso && parseHm(iso[1]) != null) return iso[1];
  return undefined;
};

const coerceDuration = (value: unknown): number | undefined => {
  const n = typeof value === "number" ? value : Number(asTrimmed(value));
  if (!Number.isFinite(n)) return undefined;
  return Math.max(30, Math.round(n / 30) * 30);
};

/** 把模型常见的 ISO 时间收成看板用的 date / HH:mm。 */
export const normalizeSearchArgs = (raw: Record<string, unknown>): SearchQuery => {
  const dateRaw = asTrimmed(raw.date) ?? "";
  const ymd = dateRaw.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  const date = ymd && isDate(ymd) ? ymd : dateRaw;
  const args: SearchQuery = { date };
  const durationMin = coerceDuration(raw.durationMin);
  const windowStart = coerceHm(raw.windowStart);
  const windowEnd = coerceHm(raw.windowEnd);
  const buildingName = asTrimmed(raw.buildingName);
  const floorName = asTrimmed(raw.floorName);
  const roomName = asTrimmed(raw.roomName);
  const title = asTrimmed(raw.title)?.slice(0, 50);
  if (durationMin != null) args.durationMin = durationMin;
  if (windowStart) args.windowStart = windowStart;
  if (windowEnd) args.windowEnd = windowEnd;
  if (roomName) args.roomName = roomName;
  if (buildingName) args.buildingName = buildingName;
  if (floorName) args.floorName = floorName;
  if (title) args.title = title;
  if (typeof raw.capacity === "number" && Number.isFinite(raw.capacity)) {
    args.capacity = raw.capacity;
  }
  if (Array.isArray(raw.facilities)) {
    args.facilities = raw.facilities.map((item) => String(item));
  }
  return args;
};

export const createOpenAiLlm = (opts: OpenAiLlmOpts): LlmPort => {
  const fetchFn = opts.fetchImpl ?? fetch;
  const url = chatCompletionsUrl(opts.baseUrl);
  let loop = 0;

  return {
    async complete({ userText }) {
      const round = ++loop;
      const note = (cat: Parameters<typeof makeDebug>[0], title: string, data?: unknown) =>
        emitDebug(opts.onDebug, makeDebug(cat, title, data, round));
      const today = shanghaiNow().date;
      const started = Date.now();
      note("http", "chat.completions 请求", { url, model: opts.model, today, userText, round });
      const res = await fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({
          model: opts.model,
          messages: [
            {
              role: "system",
              content: `${SYSTEM_PROMPT}\n今天（上海）是 ${today}。`
            },
            { role: "user", content: userText }
          ],
          tools: [SEARCH_TOOL],
          tool_choice: "auto"
        })
      });

      if (!res.ok) {
        const body = (await res.text()).slice(0, 500);
        note("error", `LLM HTTP ${res.status}`, { url, body, ms: Date.now() - started });
        throw new Error(`LLM request failed: ${res.status} ${url}`);
      }

      const data = (await res.json()) as ChatCompletionResponse;
      const message = data.choices?.[0]?.message;
      const toolCall = message?.tool_calls?.[0];

      if (toolCall?.function?.name === "search_availability") {
        const raw = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;
        const args = normalizeSearchArgs(raw);
        note("search", "工具 search_availability", { raw, args, ms: Date.now() - started });
        return { kind: "search", args };
      }

      const content = message?.content?.trim() ?? "";
      if (content) {
        note("reply", "模型纯文本（未调工具）", { text: content.slice(0, 200), ms: Date.now() - started });
        return { kind: "need_more", text: content.slice(0, 80) };
      }

      note("reply", "模型空回复", { ms: Date.now() - started });
      return { kind: "need_more", text: "请补充更多信息" };
    }
  };
};
