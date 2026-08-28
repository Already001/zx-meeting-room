<template>
  <Teleport to="body">
    <button
      type="button"
      class="agent-debug-chip"
      :aria-expanded="open"
      @click="open = !open"
    >
      日志
      <span v-if="entries.length" class="agent-debug-chip-n">{{
        entries.length
      }}</span>
    </button>

    <aside
      v-if="open"
      class="agent-debug"
      role="dialog"
      aria-label="助手调试日志"
    >
      <header class="agent-debug-head">
        <div>
          <p class="agent-debug-kicker">Meeting · Trace</p>
          <h2 class="agent-debug-title">模型日志</h2>
        </div>
        <div class="agent-debug-head-actions">
          <button
            type="button"
            class="agent-debug-ghost"
            @click="emit('clear')"
          >
            清空
          </button>
          <button
            type="button"
            class="agent-debug-ghost"
            aria-label="关闭日志"
            @click="open = false"
          >
            收起
          </button>
        </div>
      </header>

      <nav class="agent-debug-tabs" aria-label="日志分类">
        <button
          v-for="tab in DEBUG_CATS"
          :key="tab.id"
          type="button"
          class="agent-debug-tab"
          :class="{ 'is-on': filter === tab.id }"
          @click="filter = tab.id"
        >
          {{ tab.label }}
          <em v-if="tab.id !== 'all'">{{ counts[tab.id] || 0 }}</em>
        </button>
      </nav>

      <ol v-if="visible.length" class="agent-debug-list">
        <li
          v-for="row in visible"
          :key="row.id"
          class="agent-debug-row"
          :data-tone="row.cat"
        >
          <div class="agent-debug-rail" aria-hidden="true" />
          <div class="agent-debug-body">
            <div class="agent-debug-meta">
              <div class="agent-debug-tags">
                <span class="agent-debug-cat">{{ catLabel(row.cat) }}</span>
                <span v-if="row.round" class="agent-debug-round">{{
                  formatRound(row.round)
                }}</span>
              </div>
              <time>{{ formatTime(row.ts) }}</time>
            </div>
            <h3>{{ rowHeading(row) }}</h3>
            <pre v-if="row.data !== undefined">{{ formatData(row.data) }}</pre>
          </div>
        </li>
      </ol>
      <p v-else class="agent-debug-empty">
        还没有日志。对黑球说一句话后会出现请求、工具参数和空档结果。
      </p>
    </aside>
  </Teleport>
</template>

<script setup>
import { computed, ref } from "vue";
import { CAT_META, DEBUG_CATS, formatRound } from "../agent/debugLog";

const props = defineProps({
  entries: { type: Array, default: () => [] }
});

defineEmits(["clear"]);

const open = ref(true);
const filter = ref("all");

const counts = computed(() => {
  /** @type {Record<string, number>} */
  const acc = { turn: 0, http: 0, search: 0, reply: 0, error: 0 };
  for (const row of props.entries) {
    if (acc[row.cat] != null) acc[row.cat] += 1;
  }
  return acc;
});

const visible = computed(() => {
  if (filter.value === "all") return props.entries;
  return props.entries.filter((row) => row.cat === filter.value);
});

function catLabel(cat) {
  return CAT_META[cat]?.label || cat;
}

function rowHeading(row) {
  const loop = formatRound(row.round);
  return loop ? `${loop} · ${row.title}` : row.title;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatData(data) {
  try {
    return typeof data === "string" ? data : JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
</script>
