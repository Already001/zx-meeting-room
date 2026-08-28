<template>
  <div class="m-room-list">
    <div v-if="!rooms.length" class="m-empty">
      <span class="m-empty-title">没有符合筛选条件的会议室</span>
      <span class="m-empty-caption">试试调整日期、楼层或设施</span>
    </div>
    <article v-for="room in rooms" :key="room.id" class="m-room-card">
      <div class="m-room-head">
        <button
          type="button"
          class="m-room-main"
          @click="emit('openRoom', room)"
        >
          <span class="m-room-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect
                x="3.5"
                y="4"
                width="17"
                height="12"
                rx="2"
                stroke="var(--color-primary)"
                stroke-width="1.6"
              />
              <path
                d="M8 20h8M12 16v4"
                stroke="var(--color-primary)"
                stroke-width="1.6"
                stroke-linecap="round"
              />
              <path
                d="M7.5 13.2l3.2-3.4 2.6 2.1 3.7-4.4"
                stroke="var(--color-primary)"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="m-room-copy">
            <span class="m-room-title-row">
              <span class="m-room-name">{{ room.name }}</span>
              <span v-if="room.favorite" class="m-room-badge">常用</span>
            </span>
            <span class="m-room-meta">
              {{ room.capacity }}人&nbsp;&nbsp;{{
                (room.facilities || []).join(" / ")
              }}
            </span>
          </span>
        </button>
      </div>

      <div class="m-mini">
        <div class="m-mini-bar" @click="handleTapTrack(room, $event)">
          <div class="m-mini-track">
            <span
              v-if="pastEnd > TL.LIST_START"
              class="m-mini-past"
              :style="{
                left: TL.listPct(TL.LIST_START),
                width: TL.listWidth(TL.LIST_START, pastEnd)
              }"
            />
            <span
              v-for="ev in visibleEvents(room)"
              :key="`${room.id}-${ev.start}-${ev.end}-${ev.title}`"
              class="m-mini-busy"
              :class="{ mine: ev.mine }"
              :style="{
                left: TL.listPct(toMinutes(ev.start)),
                width: TL.listWidth(toMinutes(ev.start), toMinutes(ev.end))
              }"
              @click.stop="emit('tapEvent', room, ev)"
            />
          </div>
          <span
            v-if="isPicking(room)"
            class="m-mini-pick"
            :style="{
              left: TL.listPct(selection.start),
              width: TL.listWidth(selection.start, selection.end)
            }"
          />
          <span
            v-if="isToday && nowMin >= TL.LIST_START && nowMin <= TL.LIST_END"
            class="m-mini-now"
            :style="{ left: TL.listPct(nowMin) }"
          />
        </div>
        <div class="m-mini-hours">
          <span v-for="h in TL.LIST_HOURS" :key="h">{{ h }}</span>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { pickTapSlot, toMinutes, TL } from "../time";

const M_DEFAULT_DURATION = 60;

const props = defineProps({
  rooms: { type: Array, default: () => [] },
  selection: { type: Object, default: null },
  isToday: { type: Boolean, default: false }
});

const emit = defineEmits([
  "update:selection",
  "tapEvent",
  "openRoom",
  "notice"
]);

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
const pastEnd = computed(() =>
  props.isToday ? Math.min(nowMin.value, TL.LIST_END) : TL.LIST_START
);

let timer = 0;

onMounted(() => {
  timer = window.setInterval(() => {
    nowMin.value = shanghaiNowMinutes();
  }, 30000);
});

onBeforeUnmount(() => {
  window.clearInterval(timer);
});

const isPicking = (room) =>
  props.selection && props.selection.roomId === room.id;

const visibleEvents = (room) =>
  (room.busyEvents || []).filter((ev) => {
    const start = toMinutes(ev.start);
    const end = toMinutes(ev.end);
    return end > TL.LIST_START && start < TL.LIST_END;
  });

const handleTapTrack = (room, e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const minute = TL.minuteAtList(rect, e.clientX);
  const event = TL.eventAt(room, minute);
  if (event) {
    emit("tapEvent", room, event);
    return;
  }
  if (props.isToday && minute < nowMin.value) {
    emit("notice", "该时段已过期");
    return;
  }

  const slot = pickTapSlot(room, minute, {
    isToday: props.isToday,
    nowMin: nowMin.value,
    duration: M_DEFAULT_DURATION,
    listStart: TL.LIST_START,
    listEnd: TL.LIST_END
  });
  if (!slot) {
    emit("notice", "剩余空闲不足 30 分钟");
    return;
  }
  emit("update:selection", {
    roomId: room.id,
    start: slot.start,
    end: slot.end
  });
};
</script>
