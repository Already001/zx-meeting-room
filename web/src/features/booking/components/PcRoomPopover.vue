<template>
  <Teleport to="body">
    <div
      class="tl-room-pop"
      role="dialog"
      aria-labelledby="tl-room-pop-title"
      :style="{ left: `${left}px`, top: `${top}px` }"
      @pointerdown.stop
    >
      <div class="tl-room-pop-head">
        <div id="tl-room-pop-title" class="tl-room-pop-title">
          {{ room.name }}
        </div>
        <div class="tl-room-pop-icons" aria-hidden="true">
          <span class="tl-room-icon-btn"><RoomPhoneIcon /></span>
          <span class="tl-room-icon-btn"><RoomScreenIcon /></span>
        </div>
      </div>

      <section class="tl-room-pop-section">
        <div class="tl-room-pop-h">基础信息</div>
        <div class="tl-room-pop-row">
          <span>分组</span>
          <span>{{ room.groupName || "" }}</span>
        </div>
        <div class="tl-room-pop-row">
          <span>容纳人数</span>
          <span>{{ room.capacity }}人</span>
        </div>
        <div class="tl-room-pop-row">
          <span>会议室设施</span>
          <span>{{ facilityText }}</span>
        </div>
      </section>

      <section class="tl-room-pop-section">
        <div class="tl-room-pop-h">预定规则</div>
        <div class="tl-room-pop-row">
          <span>全员可见</span>
        </div>
        <div class="tl-room-pop-row">
          <span>开放时间</span>
          <span>{{ openLabel }}</span>
        </div>
        <div class="tl-room-pop-row">
          <span>可提前预定范围</span>
          <span>{{ aheadLabel }}</span>
        </div>
      </section>

      <section class="tl-room-pop-section">
        <div class="tl-room-pop-h">备注信息</div>
        <div class="tl-room-pop-note">{{ noteText }}</div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";
import RoomPhoneIcon from "./RoomPhoneIcon.vue";
import RoomScreenIcon from "./RoomScreenIcon.vue";

const AHEAD_LABEL = {
  7: "7天内",
  30: "30天内",
  90: "3个月内",
  180: "6个月内"
};

const props = defineProps({
  room: { type: Object, required: true },
  left: { type: Number, required: true },
  top: { type: Number, required: true }
});

const facilityText = computed(
  () => (props.room.facilities || []).join("、") || "无"
);

const openLabel = computed(() => {
  const fmt = (t) => String(t || "").replace(/^0(\d:)/, "$1");
  return `${fmt(props.room.openStart)} - ${fmt(props.room.openEnd)}`;
});

const aheadLabel = computed(
  () =>
    AHEAD_LABEL[props.room.bookAheadDays] || `${props.room.bookAheadDays}天内`
);

const noteText = computed(() => {
  const place = [props.room.buildingName, props.room.floorName]
    .filter(Boolean)
    .join("");
  return props.room.locationNote || place || "";
});
</script>
