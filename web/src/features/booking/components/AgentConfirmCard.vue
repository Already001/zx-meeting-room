<template>
  <article class="ai-buddy-card ai-buddy-confirm" aria-label="确认预定">
    <h3 class="ai-buddy-card-title">确认预定</h3>
    <label class="ai-buddy-confirm-field">
      <span>主题</span>
      <input
        v-model="title"
        type="text"
        maxlength="50"
        :placeholder="titlePlaceholder"
        aria-label="会议主题"
      />
    </label>
    <dl class="ai-buddy-confirm-kv">
      <div>
        <dt>会议室</dt>
        <dd>{{ slot.roomName }}</dd>
      </div>
      <div>
        <dt>地点</dt>
        <dd>{{ slot.buildingName }} {{ slot.floorName }}</dd>
      </div>
      <div>
        <dt>时间</dt>
        <dd>{{ slot.date }} {{ slot.start }}–{{ slot.end }}</dd>
      </div>
    </dl>
    <div class="ai-buddy-card-actions">
      <button type="button" class="ai-buddy-btn-ghost" @click="emit('cancel')">
        返回
      </button>
      <button
        type="button"
        class="ai-buddy-btn-primary"
        @click="emit('confirm', title.trim())"
      >
        确认预定
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { defaultBookingTitle } from "../defaultTitle";
import { getUserName } from "@/utils";

const props = defineProps({
  draft: { type: Object, required: true }
});

const emit = defineEmits(["confirm", "cancel"]);

const titlePlaceholder = defaultBookingTitle(getUserName());
const title = ref(props.draft?.title || "");
const slot = computed(() => props.draft?.slot || {});

watch(
  () => [props.draft?.draftId, props.draft?.title],
  () => {
    title.value = props.draft?.title || "";
  }
);
</script>
