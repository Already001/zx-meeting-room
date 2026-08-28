<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="emit('close')">
      <div class="m-action-sheet" @click.stop>
        <button type="button" class="m-action-btn" @click="emit('openMine')">
          我的预定
        </button>
        <button type="button" class="m-action-btn" @click="emit('switchUser')">
          切换用户
        </button>
        <button
          type="button"
          class="m-action-btn m-action-cancel"
          @click="emit('close')"
        >
          取消
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineEmits(["openMine", "switchUser", "close"]);
</script>
