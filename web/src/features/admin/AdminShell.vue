<template>
  <div class="flex h-full min-h-full">
    <aside
      class="w-60px shrink-0 bg-grayLight border-r border-edge flex flex-col items-center py-12px"
    >
      <div
        class="w-36px h-36px mb-20px rounded-8px bg-primary text-onPrimary flex items-center justify-center"
        aria-hidden="true"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </div>
      <nav class="w-full" aria-label="主导航">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          class="relative w-full h-44px flex flex-col items-center justify-center gap-2px border-none cursor-pointer text-10px leading-16px whitespace-nowrap"
          :class="
            active === item.id
              ? 'bg-primaryLight text-primary'
              : 'bg-transparent text-grayDark'
          "
          :aria-current="active === item.id ? 'page' : undefined"
          @click="router.push(item.path)"
        >
          <span
            v-if="active === item.id"
            class="absolute left-0 top-0 bottom-0 w-4px bg-primary"
          />
          <svg
            v-if="item.id === 'rooms'"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
          </svg>
          <svg
            v-else-if="item.id === 'history'"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <svg
            v-else
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path
              d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
            />
            <path d="M8 7h8M8 11h6" />
          </svg>
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </aside>
    <div class="flex-1 min-w-0 min-h-0 flex flex-col">
      <header
        class="h-48px shrink-0 bg-canvas border-b border-edge flex items-center px-20px text-16px font-500 leading-24px text-black whitespace-nowrap overflow-hidden text-ellipsis"
      >
        智信 · 智能会议室管理平台
      </header>
      <main class="flex-1 min-h-0 overflow-auto">
        <div class="p-20px bg-grayLight min-h-full">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

defineProps({
  active: {
    type: String,
    required: true,
    validator: (value) =>
      value === "rooms" || value === "dicts" || value === "history"
  }
});

const router = useRouter();

const navItems = [
  { id: "rooms", label: "会议室", path: "/admin" },
  { id: "history", label: "记录", path: "/admin/history" },
  { id: "dicts", label: "字典表", path: "/admin/dicts" }
];
</script>
