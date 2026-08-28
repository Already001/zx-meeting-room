<template>
  <div class="pc-chrome">
    <div class="pc-filter-row">
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

      <label class="pc-search pc-search-grow">
        <span class="sr-only">搜索会议室</span>
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
          type="search"
          placeholder="搜索会议室"
          :value="keyword"
          @input="emit('update:keyword', $event.target.value)"
        />
      </label>

      <div class="pc-dropdown" @pointerdown.stop>
        <button
          type="button"
          class="pc-advanced-btn"
          :class="{
            active: filters.capacity !== 'all' || filters.facilities.length > 0
          }"
          @click="toggleMenu('advanced')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          高级搜索
        </button>
        <div v-if="openMenu === 'advanced'" class="pc-menu pc-menu-wide">
          <div class="pc-adv-label">人数</div>
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
          <div class="pc-adv-label">设施</div>
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
          <button type="button" class="pc-menu-item" @click="emit('reset')">
            重置筛选
          </button>
        </div>
      </div>

      <div class="pc-toolbar-end">
        <button
          type="button"
          class="pc-link-btn"
          :class="{ 'is-open': mineOpen }"
          @click="emit('openMine')"
        >
          我的预定
        </button>
      </div>
    </div>

    <div class="pc-filter-row pc-filter-row-sub">
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
        :title="viewMode === 'week' ? '上一周' : '前一天'"
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
      <button
        type="button"
        class="pc-text-btn pc-today-btn"
        @click="emit('today')"
      >
        回到今天
      </button>
      <button
        type="button"
        class="pc-icon-btn"
        :title="viewMode === 'week' ? '下一周' : '后一天'"
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
      <div class="pc-view-switch" role="radiogroup" aria-label="视图">
        <button
          type="button"
          class="pc-view-chip"
          role="radio"
          :aria-checked="viewMode === 'day'"
          :class="{ active: viewMode === 'day' }"
          @click="emit('changeView', 'day')"
        >
          日
        </button>
        <button
          type="button"
          class="pc-view-chip"
          role="radio"
          :aria-checked="viewMode === 'week'"
          :class="{ active: viewMode === 'week' }"
          title="工作日拖选时段，可跨天"
          @click="emit('changeView', 'week')"
        >
          周
        </button>
      </div>

      <div class="pc-toolbar-end pc-toolbar-checks">
        <button type="button" class="pc-link-btn" @click="emit('switchUser')">
          切换用户
        </button>
        <button
          v-if="isAdmin"
          type="button"
          class="pc-link-btn"
          @click="emit('admin')"
        >
          会议室管理
        </button>
      </div>
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
  isAdmin: { type: Boolean, default: false },
  mineOpen: { type: Boolean, default: false },
  viewMode: { type: String, default: "day" }
});

const emit = defineEmits([
  "update:keyword",
  "selectDate",
  "prevDay",
  "nextDay",
  "today",
  "update:filters",
  "reset",
  "openMine",
  "admin",
  "switchUser",
  "changeView"
]);

const openMenu = ref(null);

const placeLabel = computed(() =>
  props.filters.place === "all" ? "建筑 · 楼层" : props.filters.place
);

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
};

const toggleFacility = (name) => {
  const current = props.filters.facilities || [];
  const next = current.includes(name)
    ? current.filter((f) => f !== name)
    : [...current, name];
  patchFilters({ facilities: next });
};
</script>
