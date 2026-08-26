<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="emit('close')">
      <div class="bottom-sheet" @click.stop>
        <div class="sheet-drag-handle" />
        <div class="sheet-header">
          <span class="sheet-title">会议室详情</span>
          <button type="button" class="navbar-action" @click="emit('close')">
            关闭
          </button>
        </div>

        <div class="sheet-body">
          <div class="form-group-card">
            <div class="form-cell">
              <span class="form-cell-label">会议室名称</span>
              <span class="form-cell-value" style="font-weight: 500">{{
                room.name
              }}</span>
            </div>
            <div class="form-cell">
              <span class="form-cell-label">所在位置</span>
              <span class="form-cell-value"
                >{{ room.buildingName }} {{ room.floorName }}</span
              >
            </div>
            <div class="form-cell">
              <span class="form-cell-label">容纳人数</span>
              <span class="form-cell-value">{{ room.capacity }} 人</span>
            </div>
            <div class="form-cell">
              <span class="form-cell-label">门牌/位置指引</span>
              <span class="form-cell-value">{{
                room.locationNote || "无"
              }}</span>
            </div>
          </div>

          <div class="sheet-group-title">设备设施</div>
          <div class="form-group-card">
            <div class="form-cell">
              <span class="form-cell-label">支持设备</span>
              <span class="form-cell-value">{{ facilityText }}</span>
            </div>
          </div>

          <div class="sheet-group-title">预定规则</div>
          <div class="form-group-card">
            <div class="form-cell">
              <span class="form-cell-label">开放时间</span>
              <span class="form-cell-value"
                >{{ room.openStart }} - {{ room.openEnd }}</span
              >
            </div>
            <div class="form-cell">
              <span class="form-cell-label">最长提前</span>
              <span class="form-cell-value">{{ aheadLabel }}</span>
            </div>
            <div class="form-cell">
              <span class="form-cell-label">周期预定</span>
              <span class="form-cell-value">{{
                room.allowRecurring ? "支持" : "不支持"
              }}</span>
            </div>
          </div>
        </div>

        <div v-if="showBook" class="sheet-footer">
          <button
            type="button"
            class="btn-m-primary"
            @click="emit('book', room)"
          >
            预定该会议室
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";

const AHEAD_LABEL = {
  7: "7天内",
  30: "30天内",
  90: "90天内",
  180: "180天内"
};

const props = defineProps({
  room: { type: Object, required: true },
  showBook: { type: Boolean, default: true }
});

defineEmits(["close", "book"]);

const facilityText = computed(() =>
  (props.room.facilities || []).join("、") || "无"
);

const aheadLabel = computed(
  () => AHEAD_LABEL[props.room.bookAheadDays] || `${props.room.bookAheadDays}天内`
);
</script>
