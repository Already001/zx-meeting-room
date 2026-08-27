import type Database from "better-sqlite3";
import type { AgentSessionStore } from "./agentSession.js";
import { emitDebug, makeDebug, type DebugSink } from "./agentDebug.js";
import type { LlmPort } from "./agentLlm.js";
import type { FreeSlot } from "./availability.js";
import { searchAvailability } from "./availability.js";
import { createBooking, getBoard, type BookingHost } from "./booking.js";
import { extractMeetingTitle } from "./agentTitle.js";
import { shanghaiNow, toMinutes } from "./time.js";

export type MeetingBuddyExpression =
  | "idle"
  | "focus"
  | "ease"
  | "expect"
  | "sorry"
  | "puzzled"
  | "happy"
  | "down";

export type MeetingFreeSlot = FreeSlot;

export type MeetingBookingDraft = {
  draftId: string;
  slot: MeetingFreeSlot;
  title: string;
};

export type TurnEvent =
  | { type: "session"; sessionId: string }
  | { type: "status"; text: string; expression: MeetingBuddyExpression }
  | {
      type: "query";
      heading: string;
      rooms: Array<{
        roomId: string;
        roomName: string;
        buildingName: string;
        floorName: string;
        capacity: number;
        facilities: string[];
        openStart: string;
        openEnd: string;
        busy: Array<{ start: string; end: string }>;
        slots: MeetingFreeSlot[];
      }>;
      expression: MeetingBuddyExpression;
    }
  | { type: "confirm"; draft: MeetingBookingDraft; expression: MeetingBuddyExpression }
  | {
      type: "suggest";
      reason: string;
      options: MeetingFreeSlot[];
      expression: MeetingBuddyExpression;
    }
  | { type: "need_more"; text: string; expression: MeetingBuddyExpression }
  | { type: "error"; msg: string; code?: string; expression: MeetingBuddyExpression }
  | { type: "booked"; bookingId: string; expression: MeetingBuddyExpression }
  | { type: "closed"; expression: MeetingBuddyExpression };

export type { LlmPort } from "./agentLlm.js";

export const TURN_ACTIONS = ["message", "pick_slot", "confirm", "cancel"] as const;
export type TurnAction = (typeof TURN_ACTIONS)[number];

const MAX_MESSAGE_CHARS = 2000;

/** 缺省为 message；非法值返回 null，由路由以 M4000 拒绝。 */
export const parseTurnAction = (raw: unknown): TurnAction | null => {
  if (raw === undefined || raw === null) return "message";
  if (typeof raw !== "string") return null;
  for (const allowed of TURN_ACTIONS) {
    if (raw === allowed) return allowed;
  }
  return null;
};

export type TurnInput = {
  db: Database.Database;
  corpId: string;
  user: BookingHost;
  body: {
    sessionId?: string;
    action?: TurnAction;
    message?: string;
    slot?: MeetingFreeSlot;
    draftId?: string;
    title?: string;
  };
  store: AgentSessionStore;
  now?: { date: string; minute: number };
  llm?: LlmPort;
  onDebug?: DebugSink;
};

const slotKey = (slot: Pick<FreeSlot, "roomId" | "date" | "start" | "end">): string =>
  `${slot.roomId}|${slot.date}|${slot.start}|${slot.end}`;

const durationMin = (slot: Pick<FreeSlot, "start" | "end">): number =>
  toMinutes(slot.end) - toMinutes(slot.start);

export const handleTurn = async (input: TurnInput): Promise<TurnEvent[]> => {
  const { db, corpId, user, body, store, now = shanghaiNow(), llm, onDebug } = input;
  const action = parseTurnAction(body.action);
  if (action === null) {
    return [{ type: "error", msg: "请求无效", code: "M4000", expression: "sorry" }];
  }

  if (action === "message" && !llm) {
    return [{ type: "error", msg: "助手未配置", code: "M4000", expression: "sorry" }];
  }

  const events: TurnEvent[] = [];
  const isNewSession = !body.sessionId;
  const { sessionId } = store.ensure(user.userId, body.sessionId);
  if (isNewSession) {
    events.push({ type: "session", sessionId });
  }

  switch (action) {
    case "cancel": {
      store.dropSession(user.userId, sessionId);
      events.push({ type: "closed", expression: "down" });
      break;
    }
    case "pick_slot": {
      const slot = body.slot;
      if (!slot || !store.hasIssued(user.userId, sessionId, slot)) {
        events.push({ type: "error", msg: "请选择助手给出的时段", expression: "sorry" });
        break;
      }
      const title = store.peekTitle(user.userId, sessionId);
      const drafted = store.putDraft(user.userId, sessionId, slot, title);
      if (!drafted) {
        events.push({ type: "error", msg: "请选择助手给出的时段", expression: "sorry" });
        break;
      }
      events.push({
        type: "confirm",
        draft: { draftId: drafted.draftId, slot, title },
        expression: "expect"
      });
      break;
    }
    case "confirm": {
      const draftId = body.draftId;
      const draft = draftId ? store.getDraft(user.userId, draftId) : null;
      if (!draftId || !draft || draft.sessionId !== sessionId) {
        events.push({ type: "error", msg: "确认已过期，请重新选择", expression: "sorry" });
        break;
      }

      const { slot } = draft;
      const result = createBooking(
        db,
        corpId,
        user,
        {
          roomId: slot.roomId,
          date: slot.date,
          start: slot.start,
          end: slot.end,
          title: body.title ?? draft.title
        },
        now
      );

      if (!result.ok) {
        events.push({
          type: "error",
          msg: result.msg,
          code: result.code,
          expression: "sorry"
        });

        if (result.code === "M4010") {
          const board = getBoard(db, corpId, slot.date, user.userId);
          if (board.ok) {
            const search = searchAvailability(
              board.value.rooms,
              { date: slot.date, durationMin: durationMin(slot) },
              now
            );
            const roomResult = search.rooms.find((r) => r.roomId === slot.roomId);
            const options = (roomResult?.slots ?? [])
              .filter((s) => slotKey(s) !== slotKey(slot))
              .slice(0, 4);

            if (options.length >= 2) {
              store.rememberSlots(user.userId, sessionId, options);
              events.push({
                type: "suggest",
                reason: result.msg,
                options,
                expression: "sorry"
              });
            }
          }
        }
        break;
      }

      store.deleteDraft(user.userId, draftId);
      events.push({
        type: "booked",
        bookingId: result.value.id,
        expression: "happy"
      });
      break;
    }
    case "message": {
      const message = (body.message ?? "").trim().slice(0, MAX_MESSAGE_CHARS);
      if (!message) {
        events.push({ type: "need_more", text: "请说明想订哪天的会议室", expression: "puzzled" });
        break;
      }

      try {
        const decision = await llm!.complete({ userText: message });

        if (decision.kind === "need_more") {
          events.push({ type: "need_more", text: decision.text, expression: "puzzled" });
          break;
        }

        if (decision.kind === "search") {
          const date = decision.args.date || now.date;
          const board = getBoard(db, corpId, date, user.userId);
          if (!board.ok) {
            events.push({
              type: "error",
              msg: board.msg,
              code: board.code,
              expression: "sorry"
            });
            break;
          }

          const search = searchAvailability(
            board.value.rooms,
            { ...decision.args, date },
            now
          );

          emitDebug(
            onDebug,
            makeDebug("search", "空档结果", {
              date,
              heading: search.heading,
              roomCount: search.rooms.length,
              slotCount: search.rooms.reduce((n, r) => n + r.slots.length, 0)
            }, 1)
          );

          if (search.rooms.length === 0) {
            events.push({
              type: "need_more",
              text: "没有符合条件的空档",
              expression: "puzzled"
            });
            break;
          }

          const allSlots = search.rooms.flatMap((room) => room.slots);
          store.rememberSlots(user.userId, sessionId, allSlots);
          store.rememberTitle(
            user.userId,
            sessionId,
            extractMeetingTitle(message, decision.args.title)
          );
          events.push({
            type: "query",
            heading: search.heading,
            rooms: search.rooms,
            expression: "ease"
          });
          break;
        }
      } catch (err) {
        emitDebug(
          onDebug,
          makeDebug("error", "回合异常", err instanceof Error ? err.message : String(err))
        );
        events.push({ type: "error", msg: "助手暂时不可用", expression: "sorry" });
      }
      break;
    }
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }

  return events;
};
