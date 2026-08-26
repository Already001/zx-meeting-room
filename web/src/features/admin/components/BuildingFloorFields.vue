<template>
  <div class="flex gap-12px w-full">
    <el-form-item prop="buildingName" label-width="0" class="flex-1 !mb-0">
      <el-select
        class="w-full"
        filterable
        :model-value="buildingName"
        placeholder="请选择建筑"
        @update:model-value="onBuilding"
      >
        <el-option
          v-for="name in buildingOptions"
          :key="name"
          :label="name"
          :value="name"
        />
      </el-select>
    </el-form-item>
    <el-form-item prop="floorName" label-width="0" class="flex-1 !mb-0">
      <el-select
        class="w-full"
        filterable
        :model-value="floorName"
        :placeholder="buildingName ? '请选择楼层' : '请先选择建筑'"
        :disabled="!buildingName"
        @update:model-value="$emit('update:floorName', $event)"
      >
        <el-option
          v-for="name in floorOptions"
          :key="name"
          :label="name"
          :value="name"
        />
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup>
defineProps({
  buildingName: { type: String, default: "" },
  floorName: { type: String, default: "" },
  buildingOptions: { type: Array, default: () => [] },
  floorOptions: { type: Array, default: () => [] }
});

const emit = defineEmits(["update:buildingName", "update:floorName"]);

const onBuilding = (value) => {
  emit("update:buildingName", value);
  emit("update:floorName", "");
};
</script>
