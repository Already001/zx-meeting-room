<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="emit('close')">
      <form
        class="bottom-sheet"
        :class="{ 'sheet-fullscreen': fullScreen }"
        @click.stop
        @submit.prevent="handleSubmit"
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
            type="submit"
            class="navbar-action"
            style="font-weight: 500"
            :disabled="submitting"
          >
            {{ submitting ? "提交中…" : "完成" }}
          </button>
        </div>

        <div class="sheet-body">
          <div class="form-group-card">
            <div class="form-cell">
              <input
                v-model="title"
                type="text"
                name="title"
                autocomplete="off"
                class="form-input-text"
                maxlength="50"
                aria-label="会议主题"
                :placeholder="titlePlaceholder"
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
                name="remark"
                autocomplete="off"
                class="form-input-text"
                maxlength="100"
                aria-label="会议说明"
                placeholder="例如：对齐议程…"
                style="text-align: right"
              />
            </div>
            <label
              v-if="room.allowRecurring && bookingDates.length < 2"
              class="form-cell"
            >
              <span class="form-cell-label">每周重复</span>
              <input
                v-model="repeatWeekly"
                type="checkbox"
                name="repeatWeekly"
              />
            </label>
          </div>
          <p v-if="formError" class="form-inline-error" aria-live="polite">
            {{ formError }}
          </p>
        </div>

        <div class="sheet-footer">
          <button type="submit" class="btn-m-primary" :disabled="submitting">
            {{ submitting ? "提交中…" : "提交预定" }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from "vue";
import { createBooking } from "@/server/module/booking";
import { createdCount } from "../mine";
import { fromMinutes } from "../time";
import { defaultBookingTitle } from "../defaultTitle";
import { getUserId, getUserName, showToastError } from "@/utils";

const props = defineProps({
  room: { type: Object, required: true },
  rangeText: { type: String, required: true },
  dateLabel: { type: String, required: true },
  dateIso: { type: String, required: true },
  dates: { type: Array, default: () => [] },
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  fullScreen: { type: Boolean, default: false }
});

const emit = defineEmits(["close", "success"]);

const title = ref("");
const remark = ref("");
const repeatWeekly = ref(false);
const submitting = ref(false);
const formError = ref("");
const hostName = getUserName() || "";
const titlePlaceholder = defaultBookingTitle(hostName);
const bookingDates = computed(() =>
  props.dates?.length ? props.dates : [props.dateIso]
);

const handleSubmit = async () => {
  if (submitting.value) return;
  formError.value = "";
  if (!getUserId()) {
    formError.value = "缺少用户信息，请重新登录";
    return;
  }
  submitting.value = true;
  try {
    const trimmed = title.value.trim();
    const dates = bookingDates.value;
    const result = await createBooking({
      roomId: props.room.id,
      date: dates[0],
      dates: dates.length > 1 ? dates : undefined,
      start: fromMinutes(props.start),
      end: fromMinutes(props.end),
      title: trimmed || defaultBookingTitle(hostName),
      remark: remark.value.trim(),
      repeatWeekly: Boolean(
        props.room.allowRecurring && repeatWeekly.value && dates.length < 2
      )
    });
    emit("success", createdCount(result));
  } catch (error) {
    formError.value =
      error.msg || error.message || "预定失败，请检查时段后重试";
    showToastError(formError.value);
  } finally {
    submitting.value = false;
  }
};
</script>
