<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="emit('close')">
      <div
        class="bottom-sheet bookings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookings-dialog-title"
        @click.stop
      >
        <div class="sheet-drag-handle" />
        <div class="sheet-header">
          <span id="bookings-dialog-title" class="sheet-title">我的预定</span>
          <button type="button" class="navbar-action" @click="emit('close')">
            关闭
          </button>
        </div>
        <div class="sheet-body bookings-dialog-body">
          <div v-if="!bookings.length" class="bookings-empty">
            <span class="bookings-empty-title">暂无预定</span>
            <span class="bookings-empty-caption"
              >在时间轴上拖选空闲时段即可预定</span
            >
          </div>
          <ul v-else class="booking-list">
            <li v-for="b in bookings" :key="b.id" class="booking-row">
              <div class="booking-row-main">
                <div class="booking-row-head">
                  <span class="booking-row-title">{{ b.title }}</span>
                  <span
                    class="room-status-badge"
                    :class="b.status === 'ongoing' ? 'ongoing' : 'upcoming'"
                  >
                    {{ b.status === "ongoing" ? "进行中" : "待开始" }}
                  </span>
                </div>
                <div class="booking-row-meta">
                  {{ b.date }} {{ b.start }} - {{ b.end }}
                </div>
                <div class="booking-row-meta">
                  {{ b.roomName }}（{{ b.buildingName }} {{ b.floorName }}）
                </div>
              </div>
              <button
                type="button"
                class="booking-release"
                @click="emit('release', b)"
              >
                释放
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from "vue";

defineProps({
  bookings: { type: Array, default: () => [] }
});

const emit = defineEmits(["close", "release"]);

const onKey = (event) => {
  if (event.key === "Escape") emit("close");
};

onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>
