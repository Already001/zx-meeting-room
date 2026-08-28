<template>
  <article class="ai-buddy-card ai-buddy-query" aria-label="空闲会议室">
    <h3 class="ai-buddy-card-title">{{ heading }}</h3>
    <ul v-if="rooms.length" class="ai-buddy-query-list">
      <li v-for="room in rooms" :key="room.roomId" class="ai-buddy-query-row">
        <div class="ai-buddy-query-meta">
          <strong>{{ room.roomName }}</strong>
          <span
            >{{ room.buildingName }} {{ room.floorName }} ·
            {{ room.capacity }}人</span
          >
        </div>
        <div class="ai-buddy-occ">
          <div class="ai-buddy-occ-head">
            <span>当天占用</span>
            <span>{{ room.openStart }}–{{ room.openEnd }}</span>
          </div>
          <div class="ai-buddy-mini" role="img" :aria-label="occLabel(room)">
            <span
              v-for="(seg, i) in miniSegments(room)"
              :key="`${room.roomId}-${i}`"
              class="ai-buddy-mini-seg"
              :class="seg.kind"
              :style="{ flexGrow: seg.span }"
            />
          </div>
          <p class="ai-buddy-occ-legend">
            <i class="is-busy" />已订 <i class="is-free" />空闲
          </p>
        </div>
        <div class="ai-buddy-slot-btns">
          <p class="ai-buddy-slot-hint">点选一个时段</p>
          <button
            v-for="slot in (room.slots || []).slice(0, 3)"
            :key="`${slot.roomId}-${slot.date}-${slot.start}-${slot.end}`"
            type="button"
            class="ai-buddy-slot-btn"
            :aria-label="`选择 ${slot.start} 到 ${slot.end}`"
            @click="emit('pick', slot)"
          >
            <span class="ai-buddy-slot-time"
              >{{ slot.start }}–{{ slot.end }}</span
            >
            <span class="ai-buddy-slot-cta">选这个</span>
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="ai-buddy-card-empty">没有可点的空档</p>
  </article>
</template>

<script setup>
import { toMinutes } from "../time";

defineProps({
  heading: { type: String, default: "" },
  rooms: { type: Array, default: () => [] }
});

const emit = defineEmits(["pick"]);

function occLabel(room) {
  const n = (room.busy || []).length;
  const hours = `${room.openStart} 至 ${room.openEnd}`;
  if (!n) return `当天占用条，开放 ${hours}，目前没有已订时段`;
  return `当天占用条，开放 ${hours}，已订 ${n} 段`;
}

function miniSegments(room) {
  const openS = toMinutes(room.openStart || "00:00");
  const openE = toMinutes(room.openEnd || "24:00");
  const busy = [...(room.busy || [])]
    .map((b) => ({
      start: Math.max(openS, toMinutes(b.start)),
      end: Math.min(openE, toMinutes(b.end))
    }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  const segs = [];
  let t = openS;
  for (const b of busy) {
    if (b.start > t) {
      segs.push({ kind: "free", span: b.start - t });
    }
    segs.push({ kind: "busy", span: b.end - Math.max(t, b.start) });
    t = Math.max(t, b.end);
  }
  if (t < openE) {
    segs.push({ kind: "free", span: openE - t });
  }
  return segs.filter((s) => s.span > 0);
}
</script>
