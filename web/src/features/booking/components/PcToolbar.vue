<template>
  <div class="pc-chrome">
    <header class="pc-topbar">
      <div class="pc-topbar-left">
        <span class="pc-brand-mark" aria-hidden="true">会</span>
        <h1 class="pc-brand-title">预定会议室</h1>
      </div>
      <div class="pc-topbar-right">
        <button
          v-if="isAdmin"
          type="button"
          class="pc-text-btn"
          @click="emit('admin')"
        >
          会议室管理
        </button>
        <button
          type="button"
          class="pc-ghost-btn"
          :class="{ 'is-open': mineOpen }"
          @click="emit('openMine')"
        >
          我的预定
        </button>
      </div>
    </header>

    <div class="pc-filterbar">
      <div class="pc-date-nav">
        <button
          type="button"
          class="pc-icon-btn"
          title="前一天"
          @click="emit('prevDay')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div class="pc-dropdown" @pointerdown.stop>
          <button
            type="button"
            class="pc-select pc-date-select"
            @click="toggleMenu('date')"
          >
            <span>{{ dateLabel }}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
          <div v-if="openMenu === 'date'" class="pc-menu pc-menu-date">
            <button
              v-for="d in days"
              :key="d.value"
              type="button"
              class="pc-menu-item"
              :class="{ active: selectedDate === d.value }"
              @click="selectDate(d.value)"
            >
              {{ d.chip
              }}{{
                d.week === "今天"
                  ? "（今天）"
                  : d.week === "明天"
                    ? "（明天）"
                    : ""
              }}
            </button>
          </div>
        </div>
        <button
          type="button"
          class="pc-icon-btn"
          title="后一天"
          @click="emit('nextDay')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button
          type="button"
          class="pc-text-btn pc-today-btn"
          @click="emit('today')"
        >
          今天
        </button>
      </div>

      <div class="pc-filterbar-split" />

      <div class="pc-search">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="搜索会议室"
          :value="keyword"
          @input="emit('update:keyword', $event.target.value)"
        />
      </div>

      <div class="pc-dropdown" @pointerdown.stop>
        <button
          type="button"
          class="pc-select pc-select-wide"
          :class="{ active: filters.place !== 'all' }"
          @click="toggleMenu('place')"
        >
          <span :class="{ 'pc-select-placeholder': filters.place === 'all' }">{{
            placeLabel
          }}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div v-if="openMenu === 'place'" class="pc-menu">
          <button
            type="button"
            class="pc-menu-item"
            :class="{ active: filters.place === 'all' }"
            @click="setPlace('all')"
          >
            全部建筑楼层
          </button>
          <button
            v-for="p in places"
            :key="p"
            type="button"
            class="pc-menu-item"
            :class="{ active: filters.place === p }"
            @click="setPlace(p)"
          >
            {{ p }}
          </button>
        </div>
      </div>

      <div class="pc-dropdown" @pointerdown.stop>
        <button
          type="button"
          class="pc-select"
          :class="{ active: filters.capacity !== 'all' }"
          @click="toggleMenu('capacity')"
        >
          <span
            :class="{ 'pc-select-placeholder': filters.capacity === 'all' }"
            >{{ capacityLabel }}</span
          >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div v-if="openMenu === 'capacity'" class="pc-menu">
          <button
            v-for="opt in capacityOptions"
            :key="opt.id"
            type="button"
            class="pc-menu-item"
            :class="{ active: filters.capacity === opt.id }"
            @click="setCapacity(opt.id)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="pc-dropdown" @pointerdown.stop>
        <button
          type="button"
          class="pc-select"
          :class="{ active: filters.facilities.length > 0 }"
          @click="toggleMenu('facilities')"
        >
          <span
            :class="{
              'pc-select-placeholder': filters.facilities.length === 0
            }"
            >{{ facilityLabel }}</span
          >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div v-if="openMenu === 'facilities'" class="pc-menu pc-menu-wide">
          <button
            v-for="f in facilityOptions"
            :key="f"
            type="button"
            class="pc-menu-item"
            @click="toggleFacility(f)"
          >
            <span>{{ f }}</span>
            <svg
              v-if="filters.facilities.includes(f)"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-success)"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>

      <button type="button" class="pc-text-btn" @click="emit('reset')">
        重置
      </button>

      <div class="pc-toolbar-end pc-toolbar-tools">
        <button
          type="button"
          class="pc-tool-link"
          :class="{ active: showLegend }"
          @click="emit('toggleLegend')"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>图例</span>
        </button>
        <button
          type="button"
          class="pc-tool-link"
          :class="{ active: showHost }"
          @click="emit('toggleHost')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>显示预定人</span>
        </button>
        <button
          type="button"
          class="pc-icon-btn"
          title="刷新"
          @click="emit('refresh')"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="showLegend" class="pc-legend-row">
      <span class="pc-legend-item"
        ><i class="pc-legend-dot free" />空闲可预定</span
      >
      <span class="pc-legend-item"
        ><i class="pc-legend-dot busy" />他人已预定</span
      >
      <span class="pc-legend-item"
        ><i class="pc-legend-dot mine" />我的预定</span
      >
      <span class="pc-legend-item"
        ><i class="pc-legend-dot picking" />当前选择</span
      >
      <span class="pc-legend-hint"
        >在空闲区域拖选时段；红色为当前时间，此刻之前不可预定</span
      >
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  dateLabel: { type: String, required: true },
  days: { type: Array, default: () => [] },
  selectedDate: { type: String, required: true },
  keyword: { type: String, default: "" },
  filters: { type: Object, required: true },
  places: { type: Array, default: () => [] },
  facilityOptions: { type: Array, default: () => [] },
  capacityOptions: { type: Array, default: () => [] },
  showHost: { type: Boolean, default: false },
  showLegend: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  mineOpen: { type: Boolean, default: false }
});

const emit = defineEmits([
  "update:keyword",
  "selectDate",
  "prevDay",
  "nextDay",
  "today",
  "update:filters",
  "reset",
  "toggleHost",
  "toggleLegend",
  "openMine",
  "refresh",
  "admin"
]);

const openMenu = ref(null);

const placeLabel = computed(() =>
  props.filters.place === "all" ? "建筑 · 楼层" : props.filters.place
);

const facilityLabel = computed(() =>
  props.filters.facilities.length > 0
    ? `设施 ${props.filters.facilities.length}`
    : "设施"
);

const capacityLabel = computed(() => {
  const opt = props.capacityOptions.find((c) => c.id === props.filters.capacity);
  return opt && opt.id !== "all" ? opt.label : "人数";
});

const closeMenu = () => {
  openMenu.value = null;
};

const toggleMenu = (name) => {
  openMenu.value = openMenu.value === name ? null : name;
};

watch(openMenu, (name) => {
  document.removeEventListener("pointerdown", closeMenu);
  if (name) document.addEventListener("pointerdown", closeMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", closeMenu);
});

const selectDate = (value) => {
  emit("selectDate", value);
  openMenu.value = null;
};

const patchFilters = (patch) => {
  emit("update:filters", { ...props.filters, ...patch });
};

const setPlace = (place) => {
  patchFilters({ place });
  openMenu.value = null;
};

const setCapacity = (capacity) => {
  patchFilters({ capacity });
  openMenu.value = null;
};

const toggleFacility = (name) => {
  const current = props.filters.facilities || [];
  const next = current.includes(name)
    ? current.filter((f) => f !== name)
    : [...current, name];
  patchFilters({ facilities: next });
};
</script>
