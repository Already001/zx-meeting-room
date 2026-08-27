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
        <div class="ai-buddy-mini" aria-hidden="true">
          <button
            v-for="(seg, i) in miniSegments(room)"
            :key="`${room.roomId}-${i}`"
            type="button"
            class="ai-buddy-mini-seg"
            :class="seg.kind"
            :style="{ flexGrow: seg.span }"
            :disabled="seg.kind !== 'free' || !seg.slot"
            @click="seg.slot && emit('pick', seg.slot)"
          />
        </div>
        <div class="ai-buddy-slot-btns">
          <button
            v-for="slot in (room.slots || []).slice(0, 3)"
            :key="`${slot.roomId}-${slot.date}-${slot.start}-${slot.end}`"
            type="button"
            class="ai-buddy-slot-btn"
            @click="emit('pick', slot)"
          >
            {{ slot.start }}–{{ slot.end }}
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

function overlappingSlot(room, startM, endM) {
  return (room.slots || []).find((slot) => {
    const a = toMinutes(slot.start);
    const b = toMinutes(slot.end);
    return a < endM && b > startM;
  });
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
      segs.push({
        kind: "free",
        span: b.start - t,
        slot: overlappingSlot(room, t, b.start)
      });
    }
    segs.push({ kind: "busy", span: b.end - Math.max(t, b.start), slot: null });
    t = Math.max(t, b.end);
  }
  if (t < openE) {
    segs.push({
      kind: "free",
      span: openE - t,
      slot: overlappingSlot(room, t, openE)
    });
  }
  return segs.filter((s) => s.span > 0);
}
</script>
