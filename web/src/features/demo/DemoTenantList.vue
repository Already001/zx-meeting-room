<template>
  <div>
    <article
      v-for="tenant in tenants"
      :key="tenant.corpId"
      class="zx-card mb-16px last:mb-0"
    >
      <h3 class="m-0 text-16px font-500 leading-24px">{{ tenant.name }}</h3>
      <p class="mt-4px mb-12px text-12px leading-18px text-mute">
        corpId {{ tenant.corpId }}
      </p>
      <ul class="m-0 p-0 list-none flex flex-col gap-8px">
        <li v-for="user in tenant.users" :key="user.userId">
          <button
            type="button"
            class="w-full flex items-center justify-between gap-12px px-12px py-10px rounded-8px border border-edge bg-grayLight text-left cursor-pointer hover:border-primaryBorder hover:bg-primaryLight"
            @click="enterAsDemoUser(tenant.corpId, user, dest)"
          >
            <span class="min-w-0">
              <span class="block text-14px leading-20px font-500 truncate">{{
                user.userName
              }}</span>
              <span class="block text-12px leading-18px text-grayDark truncate"
                >{{ user.dept }} · {{ user.userId }}</span
              >
            </span>
            <span
              class="shrink-0 text-12px leading-18px px-8px py-2px rounded-4px"
              :class="
                user.role === 'admin'
                  ? 'bg-primaryLight text-primary'
                  : 'bg-canvas text-grayDark'
              "
            >
              {{
                dest === "admin"
                  ? "进入管理"
                  : user.role === "admin"
                    ? "管理员"
                    : "员工"
              }}
            </span>
          </button>
        </li>
      </ul>
    </article>
  </div>
</template>

<script setup>
import { enterAsDemoUser } from "./session";

defineProps({
  tenants: { type: Array, required: true },
  dest: { type: String, required: true }
});
</script>
