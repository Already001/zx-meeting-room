<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="emit('close')">
      <div class="bottom-sheet" @click.stop>
        <div class="sheet-drag-handle" />
        <div class="sheet-header">
          <button type="button" class="navbar-action" @click="emit('close')">
            关闭
          </button>
          <span class="sheet-title">{{ title }}</span>
          <span style="width: 40px" />
        </div>

        <div class="sheet-body">
          <div v-if="type === 'place'" class="m-option-list">
            <button
              v-for="p in placeOptions"
              :key="p"
              type="button"
              class="m-option-row"
              :class="{ active: draft.place === p }"
              @click="draft.place = p"
            >
              <span>{{ p === "all" ? "全部建筑楼层" : p }}</span>
              <svg
                v-if="draft.place === p"
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

          <div v-else class="m-chip-grid">
            <button
              v-for="f in facilityOptions"
              :key="f"
              type="button"
              class="m-chip"
              :class="{ active: draft.facilities.includes(f) }"
              @click="toggleFacility(f)"
            >
              {{ f }}
            </button>
          </div>
        </div>

        <div class="sheet-footer">
          <button type="button" class="btn-m-default" @click="resetDraft">
            重置
          </button>
          <button type="button" class="btn-m-primary" @click="apply">确定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  type: { type: String, required: true },
  filters: { type: Object, required: true },
  places: { type: Array, default: () => [] },
  facilityOptions: { type: Array, default: () => [] }
});

const emit = defineEmits(["apply", "close"]);

const draft = ref({ ...props.filters });

watch(
  () => props.filters,
  (next) => {
    draft.value = { ...next };
  }
);

const title = computed(() =>
  props.type === "place" ? "建筑 · 楼层" : "设备设施"
);

const placeOptions = computed(() => ["all", ...props.places]);

const toggleFacility = (name) => {
  const list = draft.value.facilities;
  draft.value = {
    ...draft.value,
    facilities: list.includes(name)
      ? list.filter((f) => f !== name)
      : [...list, name]
  };
};

const resetDraft = () => {
  draft.value = { ...draft.value, place: "all", facilities: [] };
};

const apply = () => {
  emit("apply", { ...draft.value });
};
</script>
