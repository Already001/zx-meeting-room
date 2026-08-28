<template>
  <div class="zx-card !py-12px !px-16px">
    <div class="flex items-center gap-12px flex-nowrap overflow-x-auto">
      <el-input
        class="!w-220px shrink-0"
        clearable
        placeholder="搜索会议室"
        :model-value="keyword"
        @update:model-value="$emit('update:keyword', $event)"
      />
      <div class="flex items-center gap-8px shrink-0">
        <span class="text-13px text-grayDark whitespace-nowrap">状态</span>
        <el-select
          class="!w-120px"
          :model-value="enabledFilter"
          @update:model-value="$emit('update:enabledFilter', $event)"
        >
          <el-option label="全部" value="all" />
          <el-option label="启用中" value="true" />
          <el-option label="已停用" value="false" />
        </el-select>
      </div>
      <div class="flex items-center gap-8px shrink-0">
        <span class="text-13px text-grayDark whitespace-nowrap">建筑</span>
        <el-select
          class="!w-140px"
          :model-value="buildingName || ALL"
          @update:model-value="
            $emit('update:buildingName', $event === ALL ? '' : $event)
          "
        >
          <el-option label="全部" :value="ALL" />
          <el-option
            v-for="name in buildingOptions"
            :key="name"
            :label="name"
            :value="name"
          />
        </el-select>
      </div>
      <div class="flex items-center gap-8px shrink-0">
        <span class="text-13px text-grayDark whitespace-nowrap">楼层</span>
        <el-select
          class="!w-140px"
          :model-value="floorName || ALL"
          @update:model-value="
            $emit('update:floorName', $event === ALL ? '' : $event)
          "
        >
          <el-option label="全部" :value="ALL" />
          <el-option
            v-for="name in floorOptions"
            :key="name"
            :label="name"
            :value="name"
          />
        </el-select>
      </div>
      <el-button class="shrink-0 ml-auto" @click="$emit('reset')">重置</el-button>
    </div>
  </div>
</template>

<script setup>
const ALL = "__all__";

defineProps({
  keyword: { type: String, default: "" },
  enabledFilter: { type: String, default: "all" },
  buildingName: { type: String, default: "" },
  floorName: { type: String, default: "" },
  buildingOptions: { type: Array, default: () => [] },
  floorOptions: { type: Array, default: () => [] }
});

defineEmits([
  "update:keyword",
  "update:enabledFilter",
  "update:buildingName",
  "update:floorName",
  "reset"
]);
</script>
