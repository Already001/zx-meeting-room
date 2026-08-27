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
          <span class="sheet-title">新建日程</span>
          <button
            type="button"
            class="navbar-action"
            style="font-weight: 500"
            :disabled="submitting"
            @click="handleSubmit"
          >
            完成
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
            <div class="form-cell">
              <span class="form-cell-label">会议室</span>
              <span
                class="form-cell-value"
                style="color: var(--color-primary); font-weight: 500"
              >
                {{ room.name }}（{{ room.buildingName }} {{ room.floorName }}）
              </span>
            </div>
            <div class="form-cell">
              <span class="form-cell-label">预定时段</span>
              <span
                class="form-cell-value"
                style="font-weight: 500; color: var(--color-primary)"
              >
                {{ dateLabel }} · {{ rangeText }}
              </span>
            </div>
            <div class="form-cell">
              <span class="form-cell-label">预定人</span>
              <span class="form-cell-value">{{ hostName }}</span>
            </div>
          </div>

          <div class="form-group-card">
            <div class="form-cell">
              <span class="form-cell-label">会议提醒</span>
              <span class="form-cell-value">开始前 15 分钟</span>
            </div>
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
            <label v-if="room.allowRecurring" class="form-cell">
              <span class="form-cell-label">每周重复</span>
              <input v-model="repeatWeekly" type="checkbox" />
            </label>
          </div>
        </div>

        <div class="sheet-footer">
          <button
            type="button"
            class="btn-m-primary"
            :disabled="submitting"
            @click="handleSubmit"
          >
            提交预定
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from "vue";
import { createBooking } from "@/server/module/booking";
import { createdCount } from "../mine";
import { fromMinutes } from "../time";
import { getUserId, getUserName, showToastError } from "@/utils";

const props = defineProps({
  room: { type: Object, required: true },
  rangeText: { type: String, required: true },
  dateLabel: { type: String, required: true },
  dateIso: { type: String, required: true },
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  fullScreen: { type: Boolean, default: false }
});

const emit = defineEmits(["close", "success"]);

const title = ref("");
const remark = ref("");
const repeatWeekly = ref(false);
const submitting = ref(false);
const hostName = getUserName() || "";

const handleSubmit = async () => {
  if (submitting.value) return;
  if (!getUserId()) {
    showToastError("缺少用户信息，请重新登录");
    return;
  }
  submitting.value = true;
  try {
    const trimmed = title.value.trim();
    const result = await createBooking({
      roomId: props.room.id,
      date: props.dateIso,
      start: fromMinutes(props.start),
      end: fromMinutes(props.end),
      title: trimmed || "无主题会议",
      remark: remark.value.trim(),
      repeatWeekly: Boolean(props.room.allowRecurring && repeatWeekly.value)
    });
    emit("success", createdCount(result));
  } catch (error) {
    showToastError(error.msg || error.message || "预定失败");
  } finally {
    submitting.value = false;
  }
};
</script>
