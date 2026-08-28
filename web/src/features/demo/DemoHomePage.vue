<template>
  <div class="zx-page min-h-100vh bg-layout-gradient px-16px py-32px">
    <div class="mx-auto" :class="showAdmin ? 'max-w-960px' : 'max-w-720px'">
      <h1 class="m-0 text-22px font-600 leading-32px text-pretty">
        智能会议室
      </h1>
      <p
        class="mt-8px mb-24px text-14px leading-22px text-grayDark text-pretty"
      >
        选择企业和用户进入预定{{
          showAdmin ? "或管理" : ""
        }}（演示身份，将拼入地址栏参数）
      </p>
      <div class="grid gap-16px" :class="showAdmin ? 'md:grid-cols-2' : ''">
        <section>
          <h2 class="m-0 mb-12px text-16px font-500 leading-24px">
            预定会议室
          </h2>
          <DemoTenantList :tenants="DEMO_TENANTS" dest="booking" />
        </section>
        <section v-if="showAdmin">
          <h2 class="m-0 mb-4px text-16px font-500 leading-24px">会议室管理</h2>
          <p class="m-0 mb-12px text-12px leading-18px text-mute">
            仅管理员；进入房间、字典与预定记录
          </p>
          <DemoTenantList :tenants="DEMO_ADMIN_TENANTS" dest="admin" />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import DemoTenantList from "./DemoTenantList.vue";
import {
  DEMO_ADMIN_TENANTS,
  DEMO_TENANTS,
  currentCanEnterDemoAdmin
} from "./session";

const showAdmin = currentCanEnterDemoAdmin();
</script>
