<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="emit('cancel')">
      <div class="m-action-sheet" @click.stop>
        <div class="m-action-desc">
          <strong>{{ title }}</strong>
          <span>{{ message }}</span>
        </div>
        <button type="button" class="m-action-btn danger" @click="emit('confirm')">
          {{ confirmText }}
        </button>
        <button type="button" class="m-action-btn" @click="emit('cancel')">
          取消
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  title: { type: String, default: "提示" },
  message: { type: String, required: true },
  confirmText: { type: String, default: "确定" }
});

defineEmits(["confirm", "cancel"]);
</script>
