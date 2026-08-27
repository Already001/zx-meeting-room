export type AgentDebugCat = "turn" | "http" | "search" | "reply" | "error";

export type AgentDebugEntry = {
  id: string;
  ts: number;
  cat: AgentDebugCat;
  title: string;
  round: number;
  data?: unknown;
};

export const makeDebug = (
  cat: AgentDebugCat,
  title: string,
  data?: unknown,
  round = 1
): AgentDebugEntry => ({
  id: crypto.randomUUID(),
  ts: Date.now(),
  cat,
  title,
  data,
  round
});

export const formatDebugLine = (entry: AgentDebugEntry): string =>
  `[agent] #${entry.round} ${entry.cat} ${entry.title}`;

export type DebugSink = (entry: AgentDebugEntry) => void;

export const emitDebug = (sink: DebugSink | undefined, entry: AgentDebugEntry) => {
  sink?.(entry);
};
