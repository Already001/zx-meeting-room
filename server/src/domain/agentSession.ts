import { randomUUID } from "node:crypto";
import type { FreeSlot } from "./availability.js";

const DEFAULT_TTL_MS = 10 * 60 * 1000;

type DraftEntry = {
  slot: FreeSlot;
  title: string;
  sessionId: string;
  exp: number;
};

type Session = {
  sessionId: string;
  issued: Map<string, FreeSlot>;
  drafts: Map<string, DraftEntry>;
  exp: number;
};

type SlotKey = Pick<FreeSlot, "roomId" | "date" | "start" | "end">;

const slotKey = (slot: SlotKey): string =>
  `${slot.roomId}|${slot.date}|${slot.start}|${slot.end}`;

export type AgentSessionStore = ReturnType<typeof createAgentSessionStore>;

export function createAgentSessionStore(opts?: { ttlMs?: number; now?: () => number }) {
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const now = opts?.now ?? (() => Date.now());
  const sessions = new Map<string, Session>();

  const purgeExpired = (userId: string): void => {
    const session = sessions.get(userId);
    if (!session) return;

    if (session.exp <= now()) {
      sessions.delete(userId);
      return;
    }

    for (const [draftId, draft] of session.drafts) {
      if (draft.exp <= now()) {
        session.drafts.delete(draftId);
      }
    }
  };

  const getSession = (userId: string, sessionId: string): Session | null => {
    purgeExpired(userId);
    const session = sessions.get(userId);
    if (!session || session.sessionId !== sessionId || session.exp <= now()) {
      return null;
    }
    return session;
  };

  const touchSession = (session: Session): void => {
    session.exp = now() + ttlMs;
  };

  return {
    ensure(userId: string, sessionId?: string): { sessionId: string } {
      purgeExpired(userId);

      const existing = sessions.get(userId);
      if (sessionId) {
        if (existing && existing.sessionId === sessionId && existing.exp > now()) {
          touchSession(existing);
          return { sessionId: existing.sessionId };
        }
        const session: Session = {
          sessionId,
          issued: new Map(),
          drafts: new Map(),
          exp: now() + ttlMs
        };
        sessions.set(userId, session);
        return { sessionId };
      }

      if (existing && existing.exp > now()) {
        touchSession(existing);
        return { sessionId: existing.sessionId };
      }

      const id = randomUUID();
      sessions.set(userId, {
        sessionId: id,
        issued: new Map(),
        drafts: new Map(),
        exp: now() + ttlMs
      });
      return { sessionId: id };
    },

    rememberSlots(userId: string, sessionId: string, slots: FreeSlot[]): void {
      const session = getSession(userId, sessionId);
      if (!session) return;

      for (const slot of slots) {
        session.issued.set(slotKey(slot), slot);
      }
      touchSession(session);
    },

    hasIssued(userId: string, sessionId: string, slot: SlotKey): boolean {
      const session = getSession(userId, sessionId);
      if (!session) return false;
      return session.issued.has(slotKey(slot));
    },

    putDraft(
      userId: string,
      sessionId: string,
      slot: FreeSlot,
      title: string
    ): { draftId: string } | null {
      const session = getSession(userId, sessionId);
      if (!session) return null;

      const draftId = randomUUID();
      session.drafts.set(draftId, {
        slot,
        title,
        sessionId,
        exp: now() + ttlMs
      });
      touchSession(session);
      return { draftId };
    },

    getDraft(
      userId: string,
      draftId: string
    ): { slot: FreeSlot; title: string; sessionId: string } | null {
      purgeExpired(userId);
      const session = sessions.get(userId);
      if (!session || session.exp <= now()) return null;

      const draft = session.drafts.get(draftId);
      if (!draft || draft.exp <= now()) return null;

      return {
        slot: draft.slot,
        title: draft.title,
        sessionId: draft.sessionId
      };
    },

    deleteDraft(userId: string, draftId: string): void {
      purgeExpired(userId);
      const session = sessions.get(userId);
      if (!session) return;
      session.drafts.delete(draftId);
    },

    dropSession(userId: string, sessionId: string): void {
      purgeExpired(userId);
      const session = sessions.get(userId);
      if (session?.sessionId === sessionId) {
        sessions.delete(userId);
      }
    }
  };
}
