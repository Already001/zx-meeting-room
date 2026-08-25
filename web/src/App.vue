<template>
  <el-config-provider :locale="zhCn">
    <PageFrame>
      <router-view />
    </PageFrame>
  </el-config-provider>
</template>

<script setup>
import zhCn from "element-plus/es/locale/lang/zh-cn";
import PageFrame from "@/components/PageFrame.vue";
</script>
