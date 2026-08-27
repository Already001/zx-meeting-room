/** @typedef {import('../../../../../../context/contracts/meeting/agentTurn').MeetingAgentEvent} MeetingAgentEvent */

/**
 * @typedef {object} AgentUiState
 * @property {boolean} open
 * @property {string} sessionId
 * @property {string} status
 * @property {string} expression
 * @property {AgentCard | null} card
 * @property {AgentCard | null} backCard
 */

/**
 * @typedef {(
 *   | { type: 'query', heading: string, rooms: unknown[] }
 *   | { type: 'confirm', draft: unknown }
 *   | { type: 'suggest', reason: string, options: unknown[] }
 *   | { type: 'need_more', text: string }
 *   | { type: 'error', msg: string, code?: string }
 * )} AgentCard
 */

export function emptyAgentUi() {
  return {
    open: false,
    sessionId: "",
    status: "",
    expression: "idle",
    card: null,
    backCard: null
  };
}

/**
 * @param {AgentUiState} state
 * @param {MeetingAgentEvent} event
 * @returns {AgentUiState}
 */
export function applyAgentEvent(state, event) {
  switch (event.type) {
    case "session":
      return { ...state, sessionId: event.sessionId };

    case "status":
      return {
        ...state,
        status: event.text,
        expression: event.expression
      };

    case "query":
      return {
        ...state,
        open: true,
        status: "",
        expression: event.expression,
        card: {
          type: "query",
          heading: event.heading,
          rooms: event.rooms
        }
      };

    case "confirm":
      return {
        ...state,
        open: true,
        status: "",
        expression: event.expression,
        backCard:
          state.card?.type === "query" || state.card?.type === "suggest"
            ? state.card
            : state.backCard,
        card: { type: "confirm", draft: event.draft }
      };

    case "suggest":
      return {
        ...state,
        open: true,
        status: "",
        expression: event.expression,
        card: {
          type: "suggest",
          reason: event.reason,
          options: event.options
        }
      };

    case "need_more":
      return {
        ...state,
        open: true,
        status: "",
        expression: event.expression,
        card: { type: "need_more", text: event.text }
      };

    case "error":
      return {
        ...state,
        open: true,
        status: "",
        expression: event.expression,
        card: {
          type: "error",
          msg: event.msg,
          ...(event.code !== undefined ? { code: event.code } : {})
        }
      };

    case "booked":
      return {
        ...state,
        open: false,
        status: "",
        card: null,
        backCard: null,
        expression: "happy"
      };

    case "closed":
      return {
        ...state,
        open: false,
        status: "",
        card: null,
        backCard: null,
        expression: "down"
      };

    case "debug":
      return state;

    default:
      return state;
  }
}

/** 确认卡取消：回到上一张空档/换档卡，不收起助手。 */
export function backFromConfirm(state) {
  if (state.card?.type !== "confirm") return state;
  if (state.backCard) {
    return {
      ...state,
      status: "",
      expression: state.backCard.type === "suggest" ? "sorry" : "ease",
      card: state.backCard
    };
  }
  return {
    ...state,
    status: "",
    expression: "idle",
    card: null
  };
}
