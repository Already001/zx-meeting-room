<template>
  <div
    class="tl-board"
    :class="{ 'is-week': isWeek }"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @scroll="onBoardScroll"
  >
    <div class="tl-board-inner">
      <div class="tl-row tl-head-row" :class="{ 'is-week': isWeek }">
        <div class="tl-room-cell tl-head-cell">会议室</div>
        <div class="tl-track tl-axis">
          <template v-if="isWeek">
            <span
              v-for="(d, i) in weekDates"
              :key="d.value"
              class="tl-axis-label tl-axis-label-week"
              :style="{ left: WEEK.pct(i, TL.DAY_MIN / 2) }"
            >
              <span>{{ d.weekday }}</span>
              <span class="tl-axis-date">{{ d.day }}</span>
            </span>
            <span
              v-if="showNow"
              class="tl-axis-now"
              :style="{ left: weekNowLeft }"
            >
              {{ fromMinutes(nowMin) }}
            </span>
            <span
              v-if="weekSelection"
              class="tl-axis-pick"
              :style="{
                left: WEEK.pct(weekSelection.startDay, weekSelection.start)
              }"
            >
              {{ fromMinutes(weekSelection.start) }}
            </span>
            <span
              v-if="weekSelection"
              class="tl-axis-pick"
              :style="{
                left: WEEK.pct(weekSelection.endDay, weekSelection.end)
              }"
            >
              {{ fromMinutes(weekSelection.end) }}
            </span>
          </template>
          <template v-else>
            <span
              v-for="h in visibleHours"
              :key="h"
              class="tl-axis-label"
              :class="{
                'tl-axis-label-first': h === 0,
                'tl-axis-label-last': h === 23
              }"
              :style="{ left: TL.pct(h * 60) }"
            >
              {{ String(h).padStart(2, "0") }}:00
            </span>
            <span
              v-if="showNow"
              class="tl-axis-now"
              :style="{ left: TL.pct(nowMin) }"
            >
              {{ fromMinutes(nowMin) }}
            </span>
            <span
              v-if="selection"
              class="tl-axis-pick"
              :style="{ left: TL.pct(selection.start) }"
            >
              {{ fromMinutes(selection.start) }}
            </span>
            <span
              v-if="selection"
              class="tl-axis-pick"
              :style="{ left: TL.pct(selection.end) }"
            >
              {{ fromMinutes(selection.end) }}
            </span>
          </template>
        </div>
      </div>

      <div class="tl-body">
        <div v-if="showNow || selection" class="tl-guides">
          <div class="tl-room-cell tl-guides-spacer" />
          <div class="tl-track">
            <span
              v-if="showNow"
              class="tl-line-now"
              :style="{ left: isWeek ? weekNowLeft : TL.pct(nowMin) }"
            />
            <template v-if="weekSelection">
              <span
                class="tl-line-pick"
                :style="{
                  left: WEEK.pct(weekSelection.startDay, weekSelection.start)
                }"
              />
              <span
                class="tl-line-pick"
                :style="{
                  left: WEEK.pct(weekSelection.endDay, weekSelection.end)
                }"
              />
            </template>
            <template v-else-if="selection">
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

        <div
          v-for="room in rooms"
          :key="room.id"
          class="tl-row"
          :class="{ 'is-picking': selection && selection.roomId === room.id }"
        >
          <button
            type="button"
            class="tl-room-cell"
            @click="toggleRoomPop(room, $event.currentTarget)"
          >
            <div class="tl-room-name">
              <span class="tl-room-name-text">{{ room.name }}</span>
              <span class="tl-room-badge">常用</span>
            </div>
            <div class="tl-room-meta-row">
              <span class="tl-room-meta">
                {{ room.capacity }}人 {{ (room.facilities || []).join("/") }}
              </span>
              <span class="tl-room-icons" aria-hidden="true">
                <RoomPhoneIcon />
                <RoomScreenIcon />
              </span>
            </div>
          </button>

          <div class="tl-track" @pointerdown="handlePointerDown(room, $event)">
            <span
              v-if="pastWidth"
              class="tl-past"
              :style="{ width: pastWidth }"
            />
            <div
              v-for="ev in roomEvents(room)"
              :key="ev.key"
              class="tl-event"
              :class="{ mine: ev.mine }"
              :style="ev.style"
              @mouseenter="showTip(ev, $event.currentTarget)"
              @mouseleave="tip = null"
            >
              <span class="tl-event-title">{{ ev.title }}</span>
            </div>

            <template
              v-if="
                selection &&
                selection.roomId === room.id &&
                selection.view === 'week'
              "
            >
              <div
                v-for="dayIndex in weekPickingDays"
                :key="`${room.id}-pick-${dayIndex}`"
                :ref="
                  dayIndex === selection.startDay ? bindPickingEl : undefined
                "
                class="tl-picking"
                :style="
                  WEEK.eventStyle(dayIndex, selection.start, selection.end)
                "
              >
                <span
                  v-if="dayIndex === selection.startDay"
                  class="tl-picking-label"
                >
                  {{ pickingLabel }}
                </span>
              </div>
            </template>
            <div
              v-else-if="selection && selection.roomId === room.id"
              :ref="bindPickingEl"
              class="tl-picking"
              :style="pickingStyle"
            >
              <span class="tl-picking-label">{{ pickingLabel }}</span>
            </div>
          </div>
        </div>

        <div class="tl-row tl-fill" aria-hidden="true">
          <div class="tl-room-cell" />
          <div class="tl-track" />
        </div>

        <div v-if="rooms.length === 0" class="pc-empty">
          <span class="pc-empty-title">没有符合筛选条件的会议室</span>
          <span class="pc-empty-caption">试试调整建筑、楼层或设施条件</span>
        </div>
      </div>
    </div>

    <Teleport
      v-if="selection?.confirmed && !bookingOpen && confirmRoom"
      to="body"
    >
      <div
        ref="confirmCard"
        class="tl-confirm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tl-confirm-title"
        :style="{ left: `${confirmPos.left}px`, top: `${confirmPos.top}px` }"
        @pointerdown.stop
        @click.stop
      >
        <p id="tl-confirm-title" class="tl-confirm-text">
          {{ confirmText }}
        </p>
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
    </Teleport>

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

    <PcRoomPopover
      v-if="roomPop"
      :room="roomPop.room"
      :left="roomPop.left"
      :top="roomPop.top"
    />
  </div>
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
import {
  fromMinutes,
  slotWindow,
  TL,
  toMinutes,
  WEEK,
  weekDaySlotWindow,
  weekExpandDays,
  weekRangeLabel
} from "../time";
import { placeConfirmCard } from "../confirmPlace";
import PcRoomPopover from "./PcRoomPopover.vue";
import RoomPhoneIcon from "./RoomPhoneIcon.vue";
import RoomScreenIcon from "./RoomScreenIcon.vue";

const props = defineProps({
  rooms: { type: Array, default: () => [] },
  selection: { type: Object, default: null },
  isToday: { type: Boolean, default: false },
  bookingOpen: { type: Boolean, default: false },
  viewMode: { type: String, default: "day" },
  weekDates: { type: Array, default: () => [] },
  todayIso: { type: String, default: "" }
});

const emit = defineEmits(["update:selection", "commit", "notice"]);

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
const confirmCard = ref(null);
const pickingEl = ref(null);
const confirmPos = ref({ left: 0, top: 0 });
const roomPop = ref(null);

const bindPickingEl = (el) => {
  pickingEl.value = el || null;
};

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
  document.addEventListener("pointerdown", onDocPointerDown);
  document.addEventListener("keydown", onRoomPopKey);
});

onBeforeUnmount(() => {
  window.clearInterval(timer);
  window.removeEventListener("keydown", onConfirmKey);
  window.removeEventListener("resize", syncConfirmPos);
  document.removeEventListener("pointerdown", onDocPointerDown);
  document.removeEventListener("keydown", onRoomPopKey);
});

const isWeek = computed(() => props.viewMode === "week");

const weekSelection = computed(() =>
  props.selection?.view === "week" ? props.selection : null
);

const todayWeekIndex = computed(() => {
  if (!props.todayIso) return -1;
  return props.weekDates.findIndex((d) => d.value === props.todayIso);
});

const weekNowLeft = computed(() => {
  const i = todayWeekIndex.value;
  if (i < 0) return WEEK.pct(0);
  return WEEK.pct(i, nowMin.value);
});

const showNow = computed(() => {
  if (nowMin.value <= 0 || nowMin.value >= TL.DAY_MIN) return false;
  if (isWeek.value) return todayWeekIndex.value >= 0;
  return props.isToday;
});

const pastWidth = computed(() => {
  if (isWeek.value) {
    const i = todayWeekIndex.value;
    if (i < 0) {
      const last = props.weekDates[props.weekDates.length - 1];
      if (last && props.todayIso && last.value < props.todayIso) return "100%";
      return "";
    }
    return WEEK.pct(i, nowMin.value);
  }
  if (props.isToday && nowMin.value > 0) return TL.pct(nowMin.value);
  return "";
});

const pickingStyle = computed(() => {
  const sel = props.selection;
  if (!sel) return {};
  return {
    left: TL.pct(sel.start),
    width: TL.pct(sel.end - sel.start)
  };
});

const weekPickingDays = computed(() => {
  const sel = weekSelection.value;
  if (!sel) return [];
  const days = [];
  for (let i = sel.startDay; i <= sel.endDay; i += 1) days.push(i);
  return days;
});

const pickingLabel = computed(() => {
  const sel = props.selection;
  if (!sel) return "";
  if (sel.view === "week") {
    return weekRangeLabel(sel.startDay, sel.endDay, sel.start, sel.end);
  }
  return `${fromMinutes(sel.start)}-${fromMinutes(sel.end)}`;
});

const confirmText = computed(() => {
  const sel = props.selection;
  if (!sel) return "";
  if (sel.view === "week") {
    const days = sel.endDay - sel.startDay + 1;
    const slot = `${weekRangeLabel(sel.startDay, sel.endDay, sel.start, sel.end)} ${TL.duration(sel.start, sel.end)}`;
    return days > 1 ? `${slot} · ${days} 天` : slot;
  }
  return `${fromMinutes(sel.start)}-${fromMinutes(sel.end)} ${TL.duration(sel.start, sel.end)}`;
});

const roomEvents = (room) => {
  if (isWeek.value) {
    return (room.weekDays || []).flatMap((day, i) =>
      (day.busyEvents || []).map((ev) => ({
        ...ev,
        key: `${room.id}-${day.date}-${ev.start}-${ev.end}-${ev.title}`,
        style: WEEK.eventStyle(i, toMinutes(ev.start), toMinutes(ev.end))
      }))
    );
  }
  return (room.busyEvents || []).map((ev) => ({
    ...ev,
    key: `${room.id}-${ev.start}-${ev.end}-${ev.title}`,
    style: {
      left: TL.pct(toMinutes(ev.start)),
      width: TL.pct(toMinutes(ev.end) - toMinutes(ev.start))
    }
  }));
};

const axisHourHidden = (hourMin) => {
  const near = (a, b, windowMin) => Math.abs(a - b) < windowMin;
  if (props.isToday && near(hourMin, nowMin.value, 40)) return true;
  const sel = props.selection;
  if (!sel || sel.view === "week") return false;
  if (near(hourMin, sel.start, 40)) return true;
  if (near(hourMin, sel.end, 40)) return true;
  const mid = (sel.start + sel.end) / 2;
  return near(hourMin, mid, 48);
};

const visibleHours = computed(() =>
  TL.HOURS.filter((h) => !axisHourHidden(h * 60))
);

const closeRoomPop = () => {
  roomPop.value = null;
};

const FALLBACK_CARD = { width: 280, height: 96 };

const syncConfirmPos = () => {
  const el = pickingEl.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const board = el.closest(".tl-board")?.getBoundingClientRect();
  const cardEl = confirmCard.value;
  confirmPos.value = placeConfirmCard({
    row: {
      left: rect.left,
      width: rect.width,
      top: rect.top,
      bottom: rect.bottom
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      bottom: Math.min(window.innerHeight, board?.bottom ?? window.innerHeight)
    },
    card: cardEl
      ? { width: cardEl.offsetWidth, height: cardEl.offsetHeight }
      : FALLBACK_CARD
  });
};

const onBoardScroll = () => {
  closeRoomPop();
  syncConfirmPos();
};

const toggleRoomPop = (room, el) => {
  if (roomPop.value?.room.id === room.id) {
    closeRoomPop();
    return;
  }
  const rect = el.getBoundingClientRect();
  roomPop.value = {
    room,
    left: Math.round(rect.right + 8),
    top: Math.round(rect.top)
  };
};

const onDocPointerDown = (e) => {
  if (!roomPop.value) return;
  if (e.target.closest(".tl-room-pop") || e.target.closest(".tl-room-cell")) {
    return;
  }
  closeRoomPop();
};

const onRoomPopKey = (e) => {
  if (e.key === "Escape") closeRoomPop();
};

const confirmRoom = computed(() => {
  const sel = props.selection;
  if (!sel) return null;
  return props.rooms.find((r) => r.id === sel.roomId) || null;
});

const handlePointerDown = (room, e) => {
  if (e.button !== 0) return;
  if (props.selection?.confirmed) {
    emit("update:selection", null);
    return;
  }
  if (e.target.closest(".tl-event") || e.target.closest(".tl-confirm-card")) {
    if (e.target.closest(".tl-event")) {
      emit("notice", "该时段已被占用，请选择空闲区域");
    }
    return;
  }

  const track = e.currentTarget;
  const rect = track.getBoundingClientRect();

  if (isWeek.value) {
    const { dayIndex, minute } = WEEK.pointAt(rect, e.clientX);
    const day = room.weekDays?.[dayIndex];
    const opts = { todayIso: props.todayIso, nowMin: nowMin.value };
    if (
      day &&
      props.todayIso &&
      day.date === props.todayIso &&
      minute < nowMin.value
    ) {
      emit("notice", "该时段已过期");
      return;
    }
    if (day && TL.eventAt({ busyEvents: day.busyEvents || [] }, minute)) {
      emit("notice", "该时段已被占用，请选择空闲区域");
      return;
    }
    const [low, high] = weekDaySlotWindow(room, dayIndex, minute, opts);
    if (high - low < TL.SNAP) {
      emit("notice", "剩余空闲不足 30 分钟");
      return;
    }
    const start = Math.max(low, minute);
    if (start >= high || high - start < TL.SNAP) {
      emit("notice", "剩余空闲不足 30 分钟");
      return;
    }
    dragRef.value = {
      view: "week",
      room,
      rect,
      anchorDay: dayIndex,
      anchorMin: start,
      low,
      high,
      opts
    };
    lastSelection.value = {
      view: "week",
      roomId: room.id,
      startDay: dayIndex,
      endDay: dayIndex,
      start,
      end: Math.min(high, start + TL.SNAP),
      dates: day ? [day.date] : [],
      confirmed: false
    };
    emit("update:selection", lastSelection.value);
    try {
      track.setPointerCapture(e.pointerId);
    } catch {
      // 无真实 pointer 时仍保留选中态
    }
    return;
  }

  const anchor = TL.minuteAt(rect, e.clientX);
  if (props.isToday && anchor < nowMin.value) {
    emit("notice", "该时段已过期");
    return;
  }
  if (TL.isBusyAt(room, anchor)) {
    emit("notice", "该时段已被占用，请选择空闲区域");
    return;
  }

  const [low, high] = slotWindow(room, anchor, {
    isToday: props.isToday,
    nowMin: nowMin.value
  });
  if (high - low < TL.SNAP) {
    emit("notice", "剩余空闲不足 30 分钟");
    return;
  }
  const start = Math.max(low, anchor);
  if (start >= high || high - start < TL.SNAP) {
    emit("notice", "剩余空闲不足 30 分钟");
    return;
  }
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
  if (drag.view === "week") {
    const point = WEEK.pointAt(drag.rect, e.clientX);
    let start = Math.min(drag.anchorMin, point.minute);
    let end = Math.max(drag.anchorMin, point.minute);
    if (end === start) end = start + TL.SNAP;
    start = Math.max(drag.low, start);
    end = Math.min(drag.high, end);
    if (end - start < TL.SNAP) return;
    const [startDay, endDay] = weekExpandDays(
      drag.room,
      drag.anchorDay,
      point.dayIndex,
      start,
      end,
      drag.opts
    );
    if (endDay < startDay) return;
    lastSelection.value = {
      view: "week",
      roomId: drag.room.id,
      startDay,
      endDay,
      start,
      end,
      dates: (drag.room.weekDays || [])
        .slice(startDay, endDay + 1)
        .map((d) => d.date),
      confirmed: false
    };
    emit("update:selection", lastSelection.value);
    return;
  }
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
    window.removeEventListener("resize", syncConfirmPos);
    if (!open) return;
    syncConfirmPos();
    window.addEventListener("keydown", onConfirmKey);
    window.addEventListener("resize", syncConfirmPos);
    await nextTick();
    syncConfirmPos();
    confirmBtn.value?.focus();
  }
);

watch(
  () =>
    props.selection
      ? `${props.selection.roomId}:${props.selection.view || "day"}:${props.selection.start}:${props.selection.end}:${props.selection.startDay ?? ""}:${props.selection.endDay ?? ""}`
      : "",
  async () => {
    if (!props.selection?.confirmed || props.bookingOpen) return;
    await nextTick();
    syncConfirmPos();
  }
);
</script>
