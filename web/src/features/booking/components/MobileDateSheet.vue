<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="emit('close')">
      <div class="bottom-sheet" @click.stop>
        <div class="sheet-drag-handle" />
        <div class="sheet-header">
          <button type="button" class="navbar-action" @click="emit('close')">
            关闭
          </button>
          <span class="sheet-title">选择日期</span>
          <span style="width: 40px" />
        </div>
        <div class="sheet-body">
          <div class="m-option-list">
            <button
              v-for="d in days"
              :key="d.value"
              type="button"
              class="m-option-row"
              :class="{ active: selectedDate === d.value }"
              @click="emit('select', d.value)"
            >
              <span
                >{{ d.chip
                }}{{
                  d.week === "今天"
                    ? "（今天）"
                    : d.week === "明天"
                      ? "（明天）"
                      : ""
                }}</span
              >
              <svg
                v-if="selectedDate === d.value"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-success)"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  days: { type: Array, default: () => [] },
  selectedDate: { type: String, required: true }
});

defineEmits(["select", "close"]);
</script>
