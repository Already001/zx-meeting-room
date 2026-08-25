<template>
  <div class="flex flex-col gap-16px p-16px">
    <SmokeCard entry="m（iOS / 安卓 WebView）" />
    <div>
      <van-button type="primary" @click="show = true">Vant 自检</van-button>
      <van-popup
        v-model:show="show"
        round
        position="bottom"
        close-on-popstate
        :style="{
          padding: '20px',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))'
        }"
      >
        <p class="m-0 text-16px font-500 leading-24px text-black">
          按需注册正常
        </p>
        <p class="mt-8px mb-16px text-14px leading-20px text-grayDark">
          Vant 已按智信主色生效。
        </p>
        <van-button type="primary" block @click="show = false"
          >知道了</van-button
        >
      </van-popup>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import SmokeCard from "@/components/SmokeCard.vue";

const show = ref(false);
</script>
