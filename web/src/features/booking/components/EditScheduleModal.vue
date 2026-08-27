<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="emit('close')">
      <div
        class="bottom-sheet"
        :class="{ 'sheet-fullscreen': fullScreen }"
        @click.stop
      >
        <div class="sheet-drag-handle" />
        <div class="sheet-header">
          <button
            type="button"
            class="navbar-action"
            style="color: var(--color-body)"
            :disabled="submitting"
            @click="emit('close')"
          >
            取消
          </button>
          <span class="sheet-title">修改预定</span>
          <button
            type="button"
            class="navbar-action"
            style="font-weight: 500"
            :disabled="submitting"
            @click="handleSubmit"
          >
            保存
          </button>
        </div>

        <div class="sheet-body">
          <div class="form-group-card">
            <div class="form-cell">
              <input
                v-model="title"
                type="text"
                class="form-input-text"
                maxlength="50"
                placeholder="填写会议主题..."
                style="font-size: 16px; font-weight: 500"
              />
            </div>
          </div>

          <div class="form-group-card">
            <label class="form-cell">
              <span class="form-cell-label">会议室</span>
              <select v-model="roomId" class="form-input-text" style="text-align: right">
                <option v-for="room in roomOptions" :key="room.id" :value="room.id">
                  {{ room.name }}（{{ room.buildingName }} {{ room.floorName }}）
                </option>
              </select>
            </label>
            <label class="form-cell">
              <span class="form-cell-label">日期</span>
              <input v-model="date" type="date" class="form-input-text" style="text-align: right" />
            </label>
            <label class="form-cell">
              <span class="form-cell-label">开始</span>
              <select v-model="start" class="form-input-text" style="text-align: right">
                <option v-for="opt in timeOptions" :key="`s-${opt}`" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </label>
            <label class="form-cell">
              <span class="form-cell-label">结束</span>
              <select v-model="end" class="form-input-text" style="text-align: right">
                <option v-for="opt in timeOptions" :key="`e-${opt}`" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </label>
            <div class="form-cell">
              <span class="form-cell-label">会议说明</span>
              <input
                v-model="remark"
                type="text"
                class="form-input-text"
                maxlength="100"
                placeholder="添加会议议程或备注"
                style="text-align: right"
              />
            </div>
          </div>
        </div>

        <div class="sheet-footer">
          <button
            type="button"
            class="btn-m-primary"
            :disabled="submitting"
            @click="handleSubmit"
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from "vue";
import { updateBooking } from "@/server/module/booking";
import { fromMinutes } from "../time";
import { getUserId, showToastError } from "@/utils";

const props = defineProps({
  booking: { type: Object, required: true },
  rooms: { type: Array, default: () => [] },
  fullScreen: { type: Boolean, default: false }
});

const emit = defineEmits(["close", "success"]);

const title = ref(props.booking.title || "");
const remark = ref(props.booking.remark || "");
const roomId = ref(props.booking.roomId);
const date = ref(props.booking.date);
const start = ref(props.booking.start);
const end = ref(props.booking.end);
const submitting = ref(false);

const timeOptions = Array.from({ length: 49 }, (_, i) => fromMinutes(i * 30));

const roomOptions = computed(() => {
  const list = [...props.rooms];
  if (
    props.booking.roomId &&
    !list.some((room) => room.id === props.booking.roomId)
  ) {
    list.unshift({
      id: props.booking.roomId,
      name: props.booking.roomName,
      buildingName: props.booking.buildingName,
      floorName: props.booking.floorName
    });
  }
  return list;
});

const handleSubmit = async () => {
  if (submitting.value) return;
  if (!getUserId()) {
    showToastError("缺少用户信息，请重新登录");
    return;
  }
  submitting.value = true;
  try {
    const trimmed = title.value.trim();
    await updateBooking(props.booking.id, {
      roomId: roomId.value,
      date: date.value,
      start: start.value,
      end: end.value,
      title: trimmed || "无主题会议",
      remark: remark.value.trim()
    });
    emit("success");
  } catch (error) {
    showToastError(error.msg || error.message || "修改失败");
  } finally {
    submitting.value = false;
  }
};
</script>
