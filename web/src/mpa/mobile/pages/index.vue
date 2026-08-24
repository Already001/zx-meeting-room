<template>
  <div>
    <SmokeCard entry="m（iOS / 安卓 WebView）" />
    <div class="px-16px">
      <van-button type="primary" size="small" @click="show = true">
        Vant 自检
      </van-button>
      <van-popup v-model:show="show" round position="bottom" class="p-16px">
        <span class="text-14px text-grayDark">Vant 已生效。</span>
      </van-popup>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import SmokeCard from "@/components/SmokeCard.vue";

const show = ref(false);
</script>
