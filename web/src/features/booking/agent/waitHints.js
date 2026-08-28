/** @typedef {{ text: string, expression: string }} WaitHint */

export const MESSAGE_WAIT_HINTS = [
  { text: "正在听你说…", expression: "focus" },
  { text: "正在理解需求", expression: "puzzled" },
  { text: "正在查空档", expression: "expect" },
  { text: "马上就好", expression: "ease" }
];

export const PICK_WAIT_HINTS = [
  { text: "记下这个时段", expression: "focus" },
  { text: "正在生成确认单", expression: "expect" },
  { text: "马上就好", expression: "ease" }
];

export const CONFIRM_WAIT_HINTS = [
  { text: "正在帮你落座", expression: "focus" },
  { text: "写入预定中", expression: "expect" },
  { text: "马上就好", expression: "ease" }
];

/**
 * @param {string | undefined} action
 * @returns {WaitHint[]}
 */
export function waitHintsForAction(action) {
  switch (action) {
    case "confirm":
      return CONFIRM_WAIT_HINTS;
    case "pick_slot":
      return PICK_WAIT_HINTS;
    default:
      return MESSAGE_WAIT_HINTS;
  }
}

/**
 * @param {WaitHint[]} hints
 * @param {number} index
 * @returns {WaitHint}
 */
export function waitHintAt(hints, index) {
  if (!hints.length) return { text: "请稍候", expression: "focus" };
  const i = ((index % hints.length) + hints.length) % hints.length;
  return hints[i];
}
