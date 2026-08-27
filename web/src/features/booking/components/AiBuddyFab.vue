<template>
  <Teleport to="body">
    <button
      ref="fabRef"
      type="button"
      class="ai-buddy"
      :class="{ 'is-lifted': lifted, 'is-open': dockOpen }"
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
          <filter
            :id="glowId"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="3.5"
              flood-color="#0a0a0c"
              flood-opacity="0.28"
            />
          </filter>
        </defs>
        <path
          class="ai-buddy-body"
          :filter="`url(#${glowId})`"
          d="M32.2 5.2c15.4 0 26.6 10.8 26.6 26.6 0 15.6-11.2 27-26.8 27C16.4 58.8 5.4 47.8 5.4 31.8 5.4 16.4 16.8 5.2 32.2 5.2Z"
        />
        <g class="ai-buddy-expr">
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
        </div>
      </div>

      <div
        v-if="!ui.card && !ui.status && suggestions.length"
        class="ai-buddy-prompts"
        aria-label="快捷会议建议"
      >
        <button
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          type="button"
          class="ai-buddy-prompt"
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
    <AgentDebugPanel
      v-if="debugEnabled"
      :entries="debugEntries"
      @clear="debugEntries = []"
    />
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { getAgentSuggestions } from "@/server/module/agent";
import { showToastSuccess } from "@/utils";
import { applyAgentEvent, backFromConfirm, emptyAgentUi } from "../agent/applyEvent";
import { appendDebugEntry, readDebugEnabled, writeDebugEnabled } from "../agent/debugLog";
import { streamTurn } from "../agent/streamTurn";
import { buildSuggestionTurnBody } from "../agent/suggestions";
import AgentConfirmCard from "./AgentConfirmCard.vue";
import AgentDebugPanel from "./AgentDebugPanel.vue";
import AgentQueryCard from "./AgentQueryCard.vue";

defineProps({
  lifted: { type: Boolean, default: false }
});

const emit = defineEmits(["booked"]);

const glowId = `ai-buddy-glow-${Math.random().toString(36).slice(2, 8)}`;

const fabRef = ref(null);
const eyesRef = ref(null);
const leftEyeRef = ref(null);
const rightEyeRef = ref(null);
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
  if (!(event.altKey && event.shiftKey && event.code === "KeyD")) return;
  event.preventDefault();
  debugEnabled.value = !debugEnabled.value;
  writeDebugEnabled(debugEnabled.value);
}

function abortInFlightTurn() {
  if (turnAbort) {
    turnAbort.abort();
    turnAbort = null;
  }
}

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
    if (gen !== suggestionsGeneration || !dockOpen.value) return;
    suggestions.value = Array.isArray(list) ? list : [];
  } catch {
    if (gen === suggestionsGeneration) suggestions.value = [];
  } finally {
    if (gen === suggestionsGeneration) suggestionsLoaded.value = true;
  }
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
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
  const eyes = eyesRef.value;
  const left = leftEyeRef.value;
  const right = rightEyeRef.value;
  if (!eyes || !left || !right) return;
  eyes.setAttribute("transform", `translate(${lookX * 5.2} ${lookY * 3.6})`);
  left.setAttribute(
    "transform",
    `translate(23 30) scale(1 ${blink}) translate(-23 -30)`
  );
  right.setAttribute(
    "transform",
    `translate(41 30) scale(1 ${blink}) translate(-41 -30)`
  );
}

function loop(ms) {
  raf = requestAnimationFrame(loop);
  const dt = last ? Math.min(ms - last, 48) : 16;
  last = ms;
  if (reduced) {
    lookX = 0;
    lookY = 0;
    blink = 1;
    paint();
    return;
  }
  aim(dt);
  tickBlink(dt);
  paint();
}

function scheduleIdle() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    if (!dockOpen.value && (ui.value.expression === "happy" || ui.value.expression === "down")) {
      ui.value = { ...ui.value, expression: "idle" };
    }
  }, 1800);
}

watch(dockOpen, (open) => {
  if (open) {
    nextTick(() => inputRef.value?.focus());
  }
});

function toggle() {
  if (dockOpen.value) {
    if (ui.value.sessionId || ui.value.card) {
      dismiss();
    } else {
      abortInFlightTurn();
      turnGen += 1;
      dockOpen.value = false;
    }
    return;
  }
  const sessionId = ui.value.sessionId;
  ui.value = { ...emptyAgentUi(), sessionId };
  dockOpen.value = true;
  loadSuggestions();
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
  ui.value = applyAgentEvent(ui.value, event);
  if (event.type === "booked") {
    clearSuggestions();
    showToastSuccess("预定成功");
    emit("booked");
    dockOpen.value = false;
    scheduleIdle();
    return;
  }
  if (event.type === "closed") {
    clearSuggestions();
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
  try {
    await streamTurn(body, (e) => onEvent(e, gen), { signal: ac.signal });
  } catch (err) {
    if (ac.signal.aborted) return;
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
  suggestions.value = [];
  ui.value = {
    ...ui.value,
    open: true,
    status: "正在理解",
    expression: "focus"
  };
  dockOpen.value = true;
  runTurn(body);
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
  clearSuggestions();
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
  streamTurn(
    { sessionId, action: "cancel" },
    (e) => onEvent(e, gen),
    { signal: ac.signal }
  )
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
  window.addEventListener("keydown", onHotkey);
  raf = requestAnimationFrame(loop);
});

onBeforeUnmount(() => {
  abortInFlightTurn();
  clearSuggestions();
  turnGen += 1;
  cancelAnimationFrame(raf);
  window.clearTimeout(idleTimer);
  window.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerleave", onPointerLeave);
  window.removeEventListener("keydown", onHotkey);
});
</script>
