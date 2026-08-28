<template>
  <Teleport to="body">
    <button
      ref="fabRef"
      type="button"
      class="ai-buddy"
      :class="{
        'is-lifted': lifted,
        'is-open': dockOpen,
        'is-morphing': morphing
      }"
      :data-expression="ui.expression"
      aria-label="会议室助手"
      :aria-expanded="dockOpen"
      @click="toggle"
    >
      <svg
        class="ai-buddy-svg"
        viewBox="0 0 64 64"
        width="64"
        height="64"
        aria-hidden="true"
      >
        <defs>
          <filter :id="glowId" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="2.2"
              flood-color="#1f2329"
              flood-opacity="0.16"
            />
          </filter>
        </defs>
        <path
          class="ai-buddy-body"
          :filter="`url(#${glowId})`"
          d="M32.2 5.2c15.4 0 26.6 10.8 26.6 26.6 0 15.6-11.2 27-26.8 27C16.4 58.8 5.4 47.8 5.4 31.8 5.4 16.4 16.8 5.2 32.2 5.2Z"
        />
        <g ref="exprRef" class="ai-buddy-expr">
          <g ref="eyesRef">
            <rect
              ref="leftEyeRef"
              class="ai-buddy-eye"
              x="18.5"
              y="22"
              width="9"
              height="16"
              rx="4.5"
              fill="#f7f7f5"
            />
            <rect
              ref="rightEyeRef"
              class="ai-buddy-eye"
              x="36.5"
              y="22"
              width="9"
              height="16"
              rx="4.5"
              fill="#f7f7f5"
            />
          </g>
        </g>
      </svg>
    </button>

    <div
      v-if="showPrompts"
      class="ai-buddy-idle-prompts"
      :class="{ 'is-lifted': lifted }"
      role="group"
      aria-label="快捷会议建议"
    >
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        type="button"
        class="ai-buddy-prompt"
        :class="{ 'is-history': suggestion.source === 'history' }"
        :disabled="sending"
        :aria-label="
          suggestion.source === 'history'
            ? `根据历史预订推荐：${suggestion.label}`
            : suggestion.label
        "
        @click="sendSuggestion(suggestion)"
      >
        {{ suggestion.label }}
      </button>
    </div>

    <div
      v-if="dockOpen"
      class="ai-buddy-dock"
      :class="{ 'is-lifted': lifted }"
      role="dialog"
      aria-label="会议室助手"
    >
      <div
        class="ai-buddy-card-slot"
        :class="{ 'is-on': Boolean(ui.card || ui.status) }"
      >
        <div class="ai-buddy-card-slot-inner">
          <p v-if="ui.status" class="ai-buddy-status">{{ ui.status }}</p>
          <AgentQueryCard
            v-if="ui.card?.type === 'query'"
            :heading="ui.card.heading"
            :rooms="ui.card.rooms"
            @pick="pickSlot"
          />
          <AgentConfirmCard
            v-else-if="ui.card?.type === 'confirm'"
            :draft="ui.card.draft"
            @confirm="confirmDraft"
            @cancel="goBack"
          />
          <article
            v-else-if="ui.card?.type === 'suggest'"
            class="ai-buddy-card"
          >
            <h3 class="ai-buddy-card-title">换个时间？</h3>
            <p class="ai-buddy-card-copy">{{ ui.card.reason }}</p>
            <div class="ai-buddy-slot-btns">
              <p class="ai-buddy-slot-hint">点选一个时段</p>
              <button
                v-for="opt in ui.card.options"
                :key="`${opt.roomId}-${opt.date}-${opt.start}-${opt.end}`"
                type="button"
                class="ai-buddy-slot-btn"
                :aria-label="`选择 ${opt.roomName} ${opt.start} 到 ${opt.end}`"
                @click="pickSlot(opt)"
              >
                <span class="ai-buddy-slot-time"
                  >{{ opt.roomName }} {{ opt.start }}–{{ opt.end }}</span
                >
                <span class="ai-buddy-slot-cta">选这个</span>
              </button>
            </div>
          </article>
          <article
            v-else-if="ui.card?.type === 'need_more'"
            class="ai-buddy-card"
          >
            <p class="ai-buddy-card-copy">{{ ui.card.text }}</p>
          </article>
          <article
            v-else-if="ui.card?.type === 'error'"
            class="ai-buddy-card ai-buddy-card-error"
          >
            <p class="ai-buddy-card-copy">{{ ui.card.msg }}</p>
          </article>
          <article
            v-else-if="ui.card?.type === 'booked'"
            class="ai-buddy-card ai-buddy-card-ok"
            aria-label="预定成功"
          >
            <h3 class="ai-buddy-card-title">预定成功</h3>
            <p class="ai-buddy-card-copy">{{ bookedSummary }}</p>
            <div class="ai-buddy-card-actions">
              <button
                type="button"
                class="ai-buddy-btn-primary"
                @click="dismissBooked"
              >
                知道了
              </button>
            </div>
          </article>
        </div>
      </div>

      <div class="ai-buddy-panel">
        <form class="ai-buddy-composer" @submit.prevent="sendMessage">
          <input
            ref="inputRef"
            v-model="draftText"
            type="text"
            maxlength="200"
            placeholder="告诉我时间和人数，帮你找会议室"
            :disabled="sending"
            aria-label="对助手说"
          />
          <button type="submit" class="ai-buddy-send" :disabled="sending">
            发送
          </button>
        </form>
      </div>
    </div>
    <AgentDebugPanel
      v-if="debugEnabled"
      :entries="debugEntries"
      @clear="debugEntries = []"
    />
  </Teleport>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import { getAgentSuggestions } from "@/server/module/agent";
import {
  applyAgentEvent,
  backFromConfirm,
  emptyAgentUi
} from "../agent/applyEvent";
import {
  appendDebugEntry,
  readDebugEnabled,
  writeDebugEnabled
} from "../agent/debugLog";
import { streamTurn } from "../agent/streamTurn";
import { isBuddyChrome } from "../agent/chrome";
import { shouldShowBuddyPrompts } from "../agent/prompts";
import { buildSuggestionTurnBody } from "../agent/suggestions";
import {
  easeInOutCubic,
  lerpPose,
  morphSquash,
  poseFor
} from "../agent/buddyPose";
import { defaultBookingTitle } from "../defaultTitle";
import { waitHintAt, waitHintsForAction } from "../agent/waitHints";
import { getUserName } from "@/utils";
import AgentConfirmCard from "./AgentConfirmCard.vue";
import AgentDebugPanel from "./AgentDebugPanel.vue";
import AgentQueryCard from "./AgentQueryCard.vue";

defineProps({
  lifted: { type: Boolean, default: false }
});

const emit = defineEmits(["booked"]);

const glowId = `ai-buddy-glow-${Math.random().toString(36).slice(2, 8)}`;

const fabRef = ref(null);
const exprRef = ref(null);
const eyesRef = ref(null);
const leftEyeRef = ref(null);
const rightEyeRef = ref(null);
const morphing = ref(false);
const inputRef = ref(null);
const dockOpen = ref(false);
const draftText = ref("");
const sending = ref(false);
const ui = ref(emptyAgentUi());
const debugEnabled = ref(false);
const debugEntries = ref([]);
const suggestions = ref([]);
const suggestionsLoaded = ref(false);

let raf = 0;
let last = 0;
let pointer = null;
let lookX = 0;
let lookY = 0;
let targetX = 0;
let targetY = 0;
let blink = 1;
let blinkUntil = 0;
let nextBlink = 1800;
let nextWander = 900;
let wanderX = 0;
let wanderY = 0;
let reduced = false;
let idleTimer = 0;
/** @type {AbortController | null} */
let turnAbort = null;
let turnGen = 0;
let suggestionsGeneration = 0;
/** @type {ReturnType<typeof setInterval> | 0} */
let waitTimer = 0;
let waitIndex = 0;
let pose = poseFor("idle");
/** @type {{ from: ReturnType<typeof poseFor>, to: ReturnType<typeof poseFor>, elapsed: number, duration: number } | null} */
let morph = null;
let morphClassTimer = 0;
let morphBlink = 1;

function pushClientDebug(cat, title, data) {
  debugEntries.value = appendDebugEntry(
    {
      id: crypto.randomUUID(),
      ts: Date.now(),
      cat,
      title,
      data
    },
    debugEntries.value
  );
}

function onHotkey(event) {
  if (event.altKey && event.shiftKey && event.code === "KeyD") {
    event.preventDefault();
    debugEnabled.value = !debugEnabled.value;
    writeDebugEnabled(debugEnabled.value);
    return;
  }
  if (event.key !== "Escape" || !dockOpen.value) return;
  event.preventDefault();
  closeOpenDock({ restoreFocus: true });
}

function onDocPointerDown(event) {
  if (!dockOpen.value || event.button !== 0) return;
  if (isBuddyChrome(event.target)) return;
  closeOpenDock({ restoreFocus: false });
}

/**
 * @param {{ restoreFocus?: boolean }} [opts]
 */
function closeOpenDock({ restoreFocus = false } = {}) {
  if (!dockOpen.value) return;
  if (ui.value.card?.type === "booked") {
    dismissBooked();
  } else if (ui.value.sessionId || ui.value.card) {
    dismiss();
  } else {
    abortInFlightTurn();
    stopWait();
    turnGen += 1;
    dockOpen.value = false;
  }
  if (restoreFocus) nextTick(() => fabRef.value?.focus());
}

function abortInFlightTurn() {
  if (turnAbort) {
    turnAbort.abort();
    turnAbort = null;
  }
}

function stopWait() {
  if (waitTimer) {
    clearInterval(waitTimer);
    waitTimer = 0;
  }
}

/**
 * @param {string | undefined} action
 */
function startWait(action) {
  stopWait();
  waitIndex = 0;
  const hints = waitHintsForAction(action);
  const apply = () => {
    const hint = waitHintAt(hints, waitIndex);
    waitIndex += 1;
    ui.value = {
      ...ui.value,
      open: true,
      status: hint.text,
      expression: hint.expression
    };
  };
  apply();
  if (reduced) return;
  waitTimer = setInterval(apply, 1100);
}

const showPrompts = computed(() =>
  shouldShowBuddyPrompts({
    dockOpen: dockOpen.value,
    suggestions: suggestions.value
  })
);

const bookedSummary = computed(() => {
  const card = ui.value.card;
  if (card?.type !== "booked") return "";
  const title = card.title || defaultBookingTitle(getUserName());
  const slot = card.slot;
  if (!slot) return `${title} 已预定`;
  return `${title} · ${slot.roomName} · ${slot.date} ${slot.start}–${slot.end}`;
});

function clearSuggestions() {
  suggestionsGeneration += 1;
  suggestions.value = [];
  suggestionsLoaded.value = false;
}

async function loadSuggestions() {
  const gen = ++suggestionsGeneration;
  suggestionsLoaded.value = false;
  try {
    const list = await getAgentSuggestions();
    if (gen !== suggestionsGeneration) return;
    suggestions.value = Array.isArray(list) ? list : [];
  } catch {
    if (gen === suggestionsGeneration && !suggestions.value.length) {
      suggestions.value = [];
    }
  } finally {
    if (gen === suggestionsGeneration) suggestionsLoaded.value = true;
  }
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function beginPose(expression) {
  const to = poseFor(expression);
  window.clearTimeout(morphClassTimer);
  if (reduced) {
    pose = to;
    morph = null;
    morphBlink = 1;
    morphing.value = false;
    return;
  }
  morph = {
    from: { ...pose },
    to,
    elapsed: 0,
    duration: 380
  };
  morphing.value = false;
  requestAnimationFrame(() => {
    morphing.value = true;
  });
  morphClassTimer = window.setTimeout(() => {
    morphing.value = false;
  }, 420);
}

function tickMorph(dt) {
  if (!morph) {
    morphBlink = 1;
    return;
  }
  morph.elapsed += dt;
  const t = clamp(morph.elapsed / morph.duration, 0, 1);
  pose = lerpPose(morph.from, morph.to, easeInOutCubic(t));
  morphBlink = morphSquash(t);
  if (t >= 1) {
    pose = { ...morph.to };
    morph = null;
    morphBlink = 1;
  }
}

function onPointerMove(event) {
  if (event.pointerType === "touch") return;
  pointer = { x: event.clientX, y: event.clientY };
}

function onPointerLeave() {
  pointer = null;
}

function aim(dt) {
  const box = fabRef.value?.getBoundingClientRect();
  if (!box || box.width === 0) return;

  if (pointer) {
    targetX = clamp((pointer.x - (box.left + box.width / 2)) / 90, -1, 1);
    targetY = clamp((pointer.y - (box.top + box.height / 2)) / 70, -1, 1);
  } else {
    nextWander -= dt;
    if (nextWander <= 0) {
      wanderX = (Math.random() - 0.5) * 1.6;
      wanderY = (Math.random() - 0.45) * 1.1;
      nextWander = 900 + Math.random() * 1800;
    }
    targetX = wanderX;
    targetY = wanderY;
  }

  const k = 1 - Math.exp(-dt / 120);
  lookX += (targetX - lookX) * k;
  lookY += (targetY - lookY) * k;
}

function tickBlink(dt) {
  if (blinkUntil > 0) {
    blinkUntil -= dt;
    const t = 1 - blinkUntil / 140;
    blink = t < 0.5 ? 1 - t * 1.7 : 0.15 + (t - 0.5) * 1.7;
    blink = clamp(blink, 0.08, 1);
    if (blinkUntil <= 0) blink = 1;
    return;
  }
  nextBlink -= dt;
  if (nextBlink <= 0) {
    blinkUntil = 140;
    nextBlink = 2200 + Math.random() * 2800;
  }
}

function paint() {
  const expr = exprRef.value;
  const eyes = eyesRef.value;
  const left = leftEyeRef.value;
  const right = rightEyeRef.value;
  if (!expr || !eyes || !left || !right) return;

  expr.setAttribute("transform", `translate(0 ${pose.shiftY})`);
  eyes.setAttribute("transform", `translate(${lookX * 5.2} ${lookY * 3.6})`);

  const blinkY = blink * morphBlink;
  const paintEye = (el, y, h, rx, cx) => {
    el.setAttribute("y", String(y));
    el.setAttribute("height", String(h));
    el.setAttribute("rx", String(rx));
    el.setAttribute("ry", String(rx));
    const cy = y + h / 2;
    el.setAttribute(
      "transform",
      `translate(${cx} ${cy}) scale(1 ${blinkY}) translate(${-cx} ${-cy})`
    );
  };
  paintEye(left, pose.leftY, pose.leftH, pose.leftRx, 23);
  paintEye(right, pose.rightY, pose.rightH, pose.rightRx, 41);
}

function loop(ms) {
  raf = requestAnimationFrame(loop);
  const dt = last ? Math.min(ms - last, 48) : 16;
  last = ms;
  if (reduced) {
    lookX = 0;
    lookY = 0;
    blink = 1;
    morphBlink = 1;
    paint();
    return;
  }
  aim(dt);
  tickBlink(dt);
  tickMorph(dt);
  paint();
}

function scheduleIdle() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    if (
      !dockOpen.value &&
      (ui.value.expression === "happy" || ui.value.expression === "down")
    ) {
      ui.value = { ...ui.value, expression: "idle" };
    }
  }, 1800);
}

watch(dockOpen, (open) => {
  if (open) {
    nextTick(() => inputRef.value?.focus());
    return;
  }
  loadSuggestions();
});

watch(
  () => ui.value.expression,
  (expression) => {
    beginPose(expression);
  }
);

function toggle() {
  if (dockOpen.value) {
    closeOpenDock({ restoreFocus: false });
    return;
  }
  stopWait();
  const sessionId = ui.value.sessionId;
  ui.value = { ...emptyAgentUi(), sessionId };
  dockOpen.value = true;
}

/**
 * @param {object} event
 * @param {number} gen
 */
function onEvent(event, gen) {
  if (gen !== turnGen) return;
  if (event.type === "debug" && event.entry) {
    debugEntries.value = appendDebugEntry(event.entry, debugEntries.value);
    return;
  }
  if (
    event.type !== "status" &&
    event.type !== "session" &&
    event.type !== "debug"
  ) {
    stopWait();
  }
  ui.value = applyAgentEvent(ui.value, event);
  if (event.type === "booked") {
    emit("booked");
    dockOpen.value = true;
    return;
  }
  if (event.type === "closed") {
    dockOpen.value = false;
    scheduleIdle();
    return;
  }
  if (ui.value.open) dockOpen.value = true;
}

/**
 * @param {Record<string, unknown>} body
 */
async function runTurn(body) {
  abortInFlightTurn();
  const gen = ++turnGen;
  const ac = new AbortController();
  turnAbort = ac;
  sending.value = true;
  const action = typeof body.action === "string" ? body.action : "message";
  if (action !== "cancel") startWait(action);
  try {
    await streamTurn(body, (e) => onEvent(e, gen), { signal: ac.signal });
  } catch (err) {
    if (ac.signal.aborted) return;
    stopWait();
    ui.value = applyAgentEvent(ui.value, {
      type: "error",
      msg: err.msg || err.message || "请求失败",
      code: err.code,
      expression: "sorry"
    });
    pushClientDebug("error", "前端请求失败", {
      msg: err.msg || err.message,
      code: err.code
    });
    dockOpen.value = true;
  } finally {
    stopWait();
    if (turnAbort === ac) turnAbort = null;
    sending.value = false;
  }
}

function sendMessage() {
  const message = draftText.value.trim();
  if (!message || sending.value) return;
  draftText.value = "";
  startMessageTurn({
    ...(ui.value.sessionId ? { sessionId: ui.value.sessionId } : {}),
    action: "message",
    message
  });
}

function startMessageTurn(body) {
  ui.value = {
    ...ui.value,
    open: true,
    card: null,
    backCard: null,
    status: ""
  };
  dockOpen.value = true;
  runTurn(body);
}

function dismissBooked() {
  if (ui.value.card?.type !== "booked") return;
  abortInFlightTurn();
  turnGen += 1;
  const sessionId = ui.value.sessionId;
  ui.value = { ...emptyAgentUi(), expression: "happy" };
  beginPose("happy");
  dockOpen.value = false;
  scheduleIdle();
  if (!sessionId) return;
  const ac = new AbortController();
  turnAbort = ac;
  streamTurn({ sessionId, action: "cancel" }, () => {}, { signal: ac.signal })
    .catch(() => {
      /* 本地已收起 */
    })
    .finally(() => {
      if (turnAbort === ac) turnAbort = null;
    });
}

function sendSuggestion(suggestion) {
  if (sending.value || !suggestion?.message) return;
  startMessageTurn(buildSuggestionTurnBody(suggestion, ui.value.sessionId));
}

function pickSlot(slot) {
  if (sending.value || !slot) return;
  runTurn({
    ...(ui.value.sessionId ? { sessionId: ui.value.sessionId } : {}),
    action: "pick_slot",
    slot
  });
}

function confirmDraft(title) {
  const draft = ui.value.card?.type === "confirm" ? ui.value.card.draft : null;
  if (!draft || sending.value) return;
  runTurn({
    ...(ui.value.sessionId ? { sessionId: ui.value.sessionId } : {}),
    action: "confirm",
    draftId: draft.draftId,
    title: String(title || "").slice(0, 50)
  });
}

function goBack() {
  abortInFlightTurn();
  ui.value = backFromConfirm(ui.value);
  dockOpen.value = true;
}

function dismiss() {
  abortInFlightTurn();
  stopWait();
  const sessionId = ui.value.sessionId;
  ui.value = applyAgentEvent(ui.value, {
    type: "closed",
    expression: "down"
  });
  dockOpen.value = false;
  scheduleIdle();
  if (!sessionId) return;

  const gen = ++turnGen;
  const ac = new AbortController();
  turnAbort = ac;
  streamTurn({ sessionId, action: "cancel" }, (e) => onEvent(e, gen), {
    signal: ac.signal
  })
    .catch(() => {
      /* 本地已收起 */
    })
    .finally(() => {
      if (turnAbort === ac) turnAbort = null;
    });
}

onMounted(() => {
  debugEnabled.value = readDebugEnabled();
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave);
  document.addEventListener("pointerdown", onDocPointerDown, true);
  window.addEventListener("keydown", onHotkey);
  raf = requestAnimationFrame(loop);
  loadSuggestions();
});

onBeforeUnmount(() => {
  abortInFlightTurn();
  stopWait();
  clearSuggestions();
  turnGen += 1;
  cancelAnimationFrame(raf);
  window.clearTimeout(idleTimer);
  window.clearTimeout(morphClassTimer);
  window.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerleave", onPointerLeave);
  document.removeEventListener("pointerdown", onDocPointerDown, true);
  window.removeEventListener("keydown", onHotkey);
});
</script>
