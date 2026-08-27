const CONSTRAINT =
  /^(?:\d+号(?:会议室)?|[一二三四五六七八九十两]号(?:会议室)?|现在|今天|明天|后天|上午|下午|晚上|中午|半小时|一刻钟|\d+(?:个)?(?:半)?小时|\d+分钟|\d{1,2}(?::\d{2})?点?|奥城|生态城|\d+层|[一二三四五六七八九十]+层|订|帮我订|帮我|预定|预约|查一下|查|空档|空闲|会议室)$/u;

export const extractMeetingTitle = (message: string, llmTitle?: string): string => {
  const fromLlm = (llmTitle ?? "").trim().slice(0, 50);
  if (fromLlm) return fromLlm;

  const tokens = message
    .split(/[\s,，、;；]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !CONSTRAINT.test(part));

  const fromMessage = tokens.join(" ").slice(0, 50);
  if (fromMessage) return fromMessage;
  return (llmTitle ?? "").trim().slice(0, 50);
};
