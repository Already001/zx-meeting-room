<template>
  <div class="zx-card !p-16px">
    <div class="flex flex-wrap items-center gap-12px">
      <el-input
        class="w-260px"
        clearable
        placeholder="搜索会议室"
        :model-value="keyword"
        @update:model-value="$emit('update:keyword', $event)"
      />
      <el-select
        class="w-160px"
        :model-value="enabledFilter"
        @update:model-value="$emit('update:enabledFilter', $event)"
      >
        <el-option label="状态：全部" value="all" />
        <el-option label="启用中" value="true" />
        <el-option label="已停用" value="false" />
      </el-select>
      <el-select
        class="w-160px"
        :model-value="buildingName || ALL"
        @update:model-value="
          $emit('update:buildingName', $event === ALL ? '' : $event)
        "
      >
        <el-option label="建筑：全部" :value="ALL" />
        <el-option
          v-for="name in buildingOptions"
          :key="name"
          :label="name"
          :value="name"
        />
      </el-select>
      <el-select
        class="w-160px"
        :model-value="floorName || ALL"
        @update:model-value="
          $emit('update:floorName', $event === ALL ? '' : $event)
        "
      >
        <el-option label="楼层：全部" :value="ALL" />
        <el-option
          v-for="name in floorOptions"
          :key="name"
          :label="name"
          :value="name"
        />
      </el-select>
      <el-button @click="$emit('reset')">重置</el-button>
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
