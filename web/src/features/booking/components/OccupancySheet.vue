<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="emit('close')">
      <div class="bottom-sheet" @click.stop>
        <div class="sheet-drag-handle" />
        <div class="sheet-header">
          <span class="sheet-title">该时段已被预定</span>
          <button type="button" class="navbar-action" @click="emit('close')">
            关闭
          </button>
        </div>
        <div class="sheet-body">
          <div class="form-group-card">
            <div class="form-cell">
              <span class="form-cell-label">会议主题</span>
              <span class="form-cell-value" style="font-weight: 600">{{
                event.title
              }}</span>
            </div>
            <div class="form-cell">
              <span class="form-cell-label">时间</span>
              <span class="form-cell-value"
                >{{ event.start }} - {{ event.end }}</span
              >
            </div>
            <div class="form-cell">
              <span class="form-cell-label">会议室</span>
              <span class="form-cell-value"
                >{{ room.name }}（{{ room.buildingName }}
                {{ room.floorName }}）</span
              >
            </div>
            <div class="form-cell">
              <span class="form-cell-label">预定人</span>
              <span class="form-cell-value">{{ hostText }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  room: { type: Object, required: true },
  event: { type: Object, required: true }
});

defineEmits(["close"]);

const hostText = computed(() =>
  props.event.mine ? "我" : `${props.event.host} · ${props.event.dept || ""}`.replace(/ · $/, "")
);
</script>
