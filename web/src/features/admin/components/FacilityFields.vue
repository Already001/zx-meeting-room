<template>
  <div class="flex flex-wrap gap-16px">
    <template v-if="options.length">
      <el-checkbox
        v-for="name in options"
        :key="name"
        :model-value="modelValue.includes(name)"
        @update:model-value="toggle(name, $event)"
      >
        {{ name }}
      </el-checkbox>
    </template>
    <span v-else class="text-13px text-grayDark">
      请先在「字典表」维护设施选项
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] }
});

const emit = defineEmits(["update:modelValue"]);

const toggle = (name, checked) => {
  const next = new Set(props.modelValue);
  if (checked) next.add(name);
  else next.delete(name);
  emit("update:modelValue", [...next]);
};
</script>
