<template>
  <div class="p-16px">
    <h1 class="text-18px font-600 text-black m-0">智能会议室 · 冒烟页</h1>
    <ul class="mt-12px p-0 list-none text-14px text-grayDark leading-28px">
      <li>入口（entry）：{{ entry }}</li>
      <li>__BUILD_TARGET__：{{ buildTarget }}</li>
      <li>__VITE_MPA_PLATFORM__：{{ platform }}</li>
      <li>token：{{ tokenState }}</li>
      <li>corpId：{{ corpId || "（无）" }}</li>
      <li>后端 health：{{ healthText }}</li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { bootstrapAuthFromUrl } from "@/utils";
import { getHealth } from "@/server";

defineProps({
  entry: { type: String, required: true }
});

const buildTarget = __BUILD_TARGET__;
const platform = window.__VITE_MPA_PLATFORM__ || "（main 入口无此标识）";

const auth = bootstrapAuthFromUrl();
const corpId = ref(auth.corpId);
const tokenState = computed(() => (auth.token ? "已获取" : "无（可用 ?token= 注入）"));

const healthText = ref("请求中…");

onMounted(async () => {
  try {
    const data = await getHealth();
    healthText.value = `ok=${data.ok} ts=${data.ts}`;
  } catch (error) {
    healthText.value = `失败：${error && error.message ? error.message : JSON.stringify(error)}`;
  }
});
</script>
