<template>
  <div class="flex flex-col gap-16px">
    <SmokeCard entry="zx（PC WebView）" />
    <div>
      <el-button @click="visible = true">Element Plus 自检</el-button>
      <el-dialog
        v-model="visible"
        title="按需注册正常"
        width="420px"
        align-center
        append-to-body
        destroy-on-close
        close-on-press-escape
      >
        <p class="m-0 text-14px leading-20px text-grayDark">
          Element Plus 已按智信主色与 8px 对话框圆角生效。
        </p>
        <template #footer>
          <el-button type="primary" @click="visible = false">知道了</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import SmokeCard from "@/components/SmokeCard.vue";

const visible = ref(false);
</script>
