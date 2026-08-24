<template>
  <div>
    <SmokeCard entry="zx（PC WebView）" />
    <div class="px-16px">
      <el-button type="primary" @click="visible = true">
        Element Plus 自检
      </el-button>
      <el-dialog v-model="visible" title="按需注册正常" width="320px">
        <span class="text-14px text-grayDark">Element Plus 已生效。</span>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import SmokeCard from "@/components/SmokeCard.vue";

const visible = ref(false);
</script>
