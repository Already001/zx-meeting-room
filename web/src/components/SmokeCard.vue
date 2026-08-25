<template>
  <section class="zx-card" aria-labelledby="smoke-title">
    <h1 id="smoke-title" class="m-0 text-20px font-600 leading-32px text-black">
      智能会议室 · 冒烟页
    </h1>
    <p class="mt-8px mb-0 text-13px text-grayDark leading-18px">
      当前入口与运行时状态，便于确认三端壳子与登录态是否接通。
    </p>

    <dl
      class="mt-16px mb-0 grid grid-cols-[112px_1fr] gap-x-16px gap-y-12px text-14px leading-20px"
    >
      <dt class="m-0 text-grayDark">入口</dt>
      <dd class="m-0 text-black">{{ entry }}</dd>

      <dt class="m-0 text-grayDark">构建目标</dt>
      <dd class="m-0 text-black">{{ buildTarget }}</dd>

      <dt class="m-0 text-grayDark">MPA 平台</dt>
      <dd class="m-0 text-black">{{ platform }}</dd>

      <dt class="m-0 text-grayDark">登录 token</dt>
      <dd class="m-0 text-black">{{ tokenState }}</dd>

      <dt class="m-0 text-grayDark">企业 corpId</dt>
      <dd class="m-0 text-black">{{ corpId || "（无）" }}</dd>

      <dt class="m-0 text-grayDark">后端 health</dt>
      <dd class="m-0 min-h-20px">
        <span
          v-if="healthStatus === 'loading'"
          class="text-grayDark"
          aria-busy="true"
        >
          请求中…
        </span>
        <span v-else-if="healthStatus === 'ok'" class="text-black">{{
          healthText
        }}</span>
        <div v-else class="flex items-center flex-wrap gap-8px">
          <span class="text-danger" role="alert">{{ healthText }}</span>
          <button
            type="button"
            class="h-32px px-16px text-14px leading-none text-primary bg-primaryLight border border-primaryBorder rounded-4px"
            @click="loadHealth"
          >
            重试
          </button>
        </div>
      </dd>
    </dl>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { getToken, getCorpId } from "@/utils";
import { getHealth } from "@/server";

defineProps({
  entry: { type: String, required: true }
});

const buildTarget = __BUILD_TARGET__;
const platform = window.__VITE_MPA_PLATFORM__ || "（main 入口无此标识）";

// 登录态引导已在各入口 main.js 挂载前统一调用 bootstrapAuthFromUrl()，
// 这里只读展示，不再重复解析 URL。
const corpId = ref(getCorpId());
const tokenState = computed(() =>
  getToken() ? "已获取" : "无（可用 ?token= 注入）"
);

const healthStatus = ref("loading");
const healthText = ref("请求中…");

const loadHealth = async () => {
  healthStatus.value = "loading";
  healthText.value = "请求中…";
  try {
    const data = await getHealth();
    healthStatus.value = "ok";
    healthText.value = `ok=${data.ok} ts=${data.ts}`;
  } catch (error) {
    healthStatus.value = "error";
    healthText.value = `失败：${error && error.message ? error.message : JSON.stringify(error)}`;
  }
};

onMounted(loadHealth);
</script>
