<template>
  <div
    class="tl-board"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
  >
    <div class="tl-board-inner">
      <div class="tl-row tl-head-row">
        <div class="tl-room-cell tl-head-cell">会议室</div>
        <div class="tl-track tl-axis">
          <span
            v-for="h in visibleHours"
            :key="h"
            class="tl-axis-label"
            :class="{ 'tl-axis-label-first': h === 0 }"
            :style="{ left: TL.pct(h * 60) }"
          >
            {{ String(h).padStart(2, "0") }}:00
          </span>
          <span
            v-if="isToday && rooms.length > 0"
            class="tl-axis-now"
            :style="{ left: TL.pct(nowMin) }"
          >
            {{ fromMinutes(nowMin) }}
          </span>
          <span
            v-if="selection"
            class="tl-axis-pick"
            :style="{
              left: TL.pct((selection.start + selection.end) / 2)
            }"
          >
            {{ fromMinutes(selection.start) }}-{{ fromMinutes(selection.end) }}
          </span>
        </div>
      </div>

      <div class="tl-body">
        <div
          v-if="rooms.length > 0 && !(selection && selection.confirmed)"
          class="tl-guides"
        >
          <div class="tl-room-cell tl-guides-spacer" />
          <div class="tl-track">
            <span
              v-if="isToday"
              class="tl-line-now"
              :style="{ left: TL.pct(nowMin) }"
            />
            <template v-if="selection">
              <span
                class="tl-line-pick"
                :style="{ left: TL.pct(selection.start) }"
              />
              <span
                class="tl-line-pick"
                :style="{ left: TL.pct(selection.end) }"
              />
            </template>
          </div>
        </div>

        <div v-if="rooms.length === 0" class="pc-empty">
          <span class="pc-empty-title">没有符合筛选条件的会议室</span>
          <span class="pc-empty-caption">试试调整建筑、楼层或设施条件</span>
        </div>

        <div
          v-for="room in rooms"
          :key="room.id"
          class="tl-row"
          :class="{ 'is-picking': selection && selection.roomId === room.id }"
        >
          <button
            type="button"
            class="tl-room-cell"
            style="cursor: pointer; border: none; text-align: left"
            @click="emit('openRoom', room)"
          >
            <div class="tl-room-name">
              <span>{{ room.name }}</span>
            </div>
            <div class="tl-room-meta">
              {{ room.capacity }}人 · {{ (room.facilities || []).join("/") }}
            </div>
          </button>

          <div class="tl-track" @pointerdown="handlePointerDown(room, $event)">
            <span
              v-if="isToday && nowMin > 0"
              class="tl-past"
              :style="{ width: TL.pct(nowMin) }"
            />
            <div
              v-for="ev in room.busyEvents || []"
              :key="`${room.id}-${ev.start}-${ev.end}-${ev.title}`"
              class="tl-event"
              :class="{ mine: ev.mine }"
              :style="{
                left: TL.pct(toMinutes(ev.start)),
                width: TL.pct(toMinutes(ev.end) - toMinutes(ev.start))
              }"
              @mouseenter="showTip(ev, $event.currentTarget)"
              @mouseleave="tip = null"
            >
              <template v-if="showHost">
                <span class="tl-event-time">{{ ev.start }}-{{ ev.end }}</span>
                <span class="tl-event-title">{{
                  ev.mine ? `${ev.title} · 我` : `${ev.title} · ${ev.host}`
                }}</span>
              </template>
            </div>

            <div
              v-if="selection && selection.roomId === room.id"
              class="tl-picking"
              :style="{
                left: TL.pct(selection.start),
                width: TL.pct(selection.end - selection.start)
              }"
            >
              <span class="tl-picking-label">
                {{ fromMinutes(selection.start) }}-{{
                  fromMinutes(selection.end)
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport v-if="tip" to="body">
      <div
        class="tl-tooltip"
        :style="{ left: `${tip.left}px`, top: `${tip.top}px` }"
      >
        {{ tip.event.start }}-{{ tip.event.end }}
        <template v-if="tip.event.mine">
          我的预定 · <b>{{ tip.event.title }}</b>
        </template>
        <template v-else>
          已被 <b>{{ tip.event.host }}</b> 预定
        </template>
      </div>
    </Teleport>

    <Teleport
      v-if="selection?.confirmed && !bookingOpen && confirmRoom"
      to="body"
    >
      <div
        class="tl-confirm-overlay"
        @click="emit('update:selection', null)"
        @pointerdown.stop
      >
        <div
          class="tl-confirm-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tl-confirm-title"
          @click.stop
        >
          <div class="tl-confirm-head">
            <span id="tl-confirm-title" class="type-title-sm">确认预定</span>
          </div>
          <div class="tl-confirm-body">
            <div class="tl-confirm-kv">
              <span>会议室</span>
              <strong>{{ confirmRoom.name }}</strong>
            </div>
            <div class="tl-confirm-kv">
              <span>时段</span>
              <strong>
                {{ fromMinutes(selection.start) }}-{{
                  fromMinutes(selection.end)
                }}
                · {{ TL.duration(selection.start, selection.end) }}
              </strong>
            </div>
          </div>
          <div class="tl-confirm-actions">
            <button
              type="button"
              class="tl-btn-ghost"
              @click="emit('update:selection', null)"
            >
              取消
            </button>
            <button
              ref="confirmBtn"
              type="button"
              class="tl-btn-primary"
              @click="emit('commit', confirmRoom, selection)"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { clipOpen, fromMinutes, toMinutes, TL } from "../time";

const props = defineProps({
  rooms: { type: Array, default: () => [] },
  selection: { type: Object, default: null },
  showHost: { type: Boolean, default: false },
  isToday: { type: Boolean, default: false },
  bookingOpen: { type: Boolean, default: false }
});

const emit = defineEmits(["update:selection", "commit", "notice", "openRoom"]);

const shanghaiNowMinutes = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const pick = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return pick("hour") * 60 + pick("minute");
};

const nowMin = ref(shanghaiNowMinutes());
const dragRef = ref(null);
/** 拖选过程中最新选区（pointerup 时 props 可能尚未同步） */
const lastSelection = ref(null);
const tip = ref(null);
const confirmBtn = ref(null);

let timer = 0;

const onConfirmKey = (e) => {
  if (e.key === "Escape" && props.selection?.confirmed && !props.bookingOpen) {
    emit("update:selection", null);
  }
};

onMounted(() => {
  timer = window.setInterval(() => {
    nowMin.value = shanghaiNowMinutes();
  }, 30000);
});

onBeforeUnmount(() => {
  window.clearInterval(timer);
  window.removeEventListener("keydown", onConfirmKey);
});

const axisHourHidden = (hourMin) => {
  const near = (a, b, windowMin) => Math.abs(a - b) < windowMin;
  if (props.isToday && near(hourMin, nowMin.value, 40)) return true;
  const sel = props.selection;
  if (!sel) return false;
  if (near(hourMin, sel.start, 40)) return true;
  if (near(hourMin, sel.end, 40)) return true;
  const mid = (sel.start + sel.end) / 2;
  return near(hourMin, mid, 48);
};

const visibleHours = computed(() =>
  TL.HOURS.filter((h) => !axisHourHidden(h * 60))
);

const confirmRoom = computed(() => {
  const sel = props.selection;
  if (!sel) return null;
  return props.rooms.find((r) => r.id === sel.roomId) || null;
});

const handlePointerDown = (room, e) => {
  if (e.button !== 0) return;
  if (e.target.closest(".tl-event") || e.target.closest(".tl-confirm-card")) {
    if (e.target.closest(".tl-event")) {
      emit("notice", "该时段已被占用，请选择空闲区域");
    }
    return;
  }

  const track = e.currentTarget;
  const rect = track.getBoundingClientRect();
  const anchor = TL.minuteAt(rect, e.clientX);
  if (props.isToday && anchor < nowMin.value) {
    emit("notice", "该时段已过期");
    return;
  }
  if (TL.isBusyAt(room, anchor)) {
    emit("notice", "该时段已被占用，请选择空闲区域");
    return;
  }

  let [low, high] = TL.freeBounds(room.busyEvents || [], anchor);
  [low, high] = clipOpen(
    low,
    high,
    room.openStart || "00:00",
    room.openEnd || "24:00"
  );
  if (props.isToday) low = Math.max(low, TL.nextOpen(nowMin.value));
  if (high - low < TL.SNAP) {
    emit("notice", "剩余空闲不足 30 分钟");
    return;
  }
  if (anchor < low || anchor >= high) {
    emit("notice", "剩余空闲不足 30 分钟");
    return;
  }

  const start = Math.max(low, anchor);
  dragRef.value = { room, rect, anchor: start, low, high };
  lastSelection.value = {
    roomId: room.id,
    start,
    end: Math.min(high, start + TL.SNAP),
    confirmed: false
  };
  emit("update:selection", lastSelection.value);
  try {
    track.setPointerCapture(e.pointerId);
  } catch {
    // 无真实 pointer 时仍保留选中态
  }
};

const handlePointerMove = (e) => {
  const drag = dragRef.value;
  if (!drag) return;
  const minute = TL.minuteAt(drag.rect, e.clientX);
  let start = Math.min(drag.anchor, minute);
  let end = Math.max(drag.anchor, minute);
  if (end === start) end = start + TL.SNAP;
  start = Math.max(drag.low, start);
  end = Math.min(drag.high, end);
  if (end - start < TL.SNAP) return;
  lastSelection.value = {
    roomId: drag.room.id,
    start,
    end,
    confirmed: false
  };
  emit("update:selection", lastSelection.value);
};

const handlePointerUp = () => {
  if (!dragRef.value) return;
  dragRef.value = null;
  const sel = lastSelection.value || props.selection;
  if (sel) {
    emit("update:selection", { ...sel, confirmed: true });
  }
};

const showTip = (ev, el) => {
  const rect = el.getBoundingClientRect();
  tip.value = {
    event: ev,
    left: rect.left + rect.width / 2,
    top: rect.top
  };
};

watch(
  () => Boolean(props.selection?.confirmed && !props.bookingOpen),
  async (open) => {
    window.removeEventListener("keydown", onConfirmKey);
    if (!open) return;
    window.addEventListener("keydown", onConfirmKey);
    await nextTick();
    confirmBtn.value?.focus();
  }
);
</script>
