const BUDDY_CHROME =
  ".ai-buddy, .ai-buddy-dock, .ai-buddy-idle-prompts, .agent-debug, .agent-debug-chip";

/** 点在黑球、对话框、快捷标签或调试条上时，不算点空白。 */
export function isBuddyChrome(target) {
  const el =
    target && typeof target.closest === "function"
      ? target
      : target?.parentElement;
  if (!el || typeof el.closest !== "function") return false;
  return Boolean(el.closest(BUDDY_CHROME));
}
