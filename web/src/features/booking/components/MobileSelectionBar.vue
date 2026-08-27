<template>
  <div v-if="room && selection" class="m-select-bar">
    <div class="m-select-room">{{ room.name }}</div>
    <div class="m-select-time">
      {{ dateText }} {{ fromMinutes(selection.start) }}-{{
        fromMinutes(selection.end)
      }}
      <span class="m-select-dur"
        >共 {{ TL.duration(selection.start, selection.end) }}</span
      >
    </div>

    <div v-if="quickOptions.length" class="m-select-quick">
      <button
        v-for="min in quickOptions"
        :key="min"
        type="button"
        class="m-chip"
        :class="{ active: selection.end - selection.start === min }"
        @click="emit('quickDuration', min)"
      >
        {{ min >= 60 ? `${min / 60}小时` : `${min}分钟` }}
      </button>
    </div>

    <div class="m-select-actions">
      <button type="button" class="btn-m-default" @click="emit('cancel')">
        取消
      </button>
      <button type="button" class="btn-m-primary" @click="emit('book')">
        预定
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { availableDurations, fromMinutes, TL } from "../time";

const props = defineProps({
  room: { type: Object, default: null },
  selection: { type: Object, default: null },
  dateText: { type: String, default: "" }
});

defineEmits(["cancel", "book", "quickDuration"]);

const quickOptions = computed(() => {
  if (!props.room || !props.selection) return [];
  return availableDurations(props.room, props.selection.start);
});
</script>
