import { computed, ref, watch } from "vue";
import { listRooms, setRoomEnabled } from "@/server/module/room";
import { listDicts } from "@/server/module/dict";
import { confirmAsk, showToastError, showToastSuccess } from "@/utils";

const PAGE_SIZE = 20;

const toastError = (error) => {
  const msg =
    error.msg ||
    (error.response && error.response.data && error.response.data.msg) ||
    error.message;
  showToastError(msg || "操作失败");
};

/**
 * 会议室列表：keyword 防抖 300ms（重置立即）；启停走 confirmAsk
 * @param {{ active?: import("vue").Ref<boolean> }} [options]
 */
export const useRoomList = ({ active } = {}) => {
  const keywordInput = ref("");
  const keyword = ref("");
  const enabledFilter = ref("all");
  const buildingName = ref("");
  const floorName = ref("");
  const page = ref(1);
  const pageSize = PAGE_SIZE;
  const rooms = ref([]);
  const dicts = ref([]);
  const total = ref(0);
  const loading = ref(false);

  let keywordTimer = 0;
  let loadSeq = 0;
  let skipKeywordWatch = false;

  const canLoad = computed(() => (active ? active.value : true));

  const hasFilter = computed(
    () =>
      Boolean(keywordInput.value.trim()) ||
      enabledFilter.value !== "all" ||
      Boolean(buildingName.value) ||
      Boolean(floorName.value)
  );

  const buildingOptions = computed(() => {
    const names = dicts.value
      .filter((d) => d.type === "building" && d.enabled)
      .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN"))
      .map((d) => d.name);
    if (buildingName.value && !names.includes(buildingName.value)) {
      return [...names, buildingName.value];
    }
    return names;
  });

  const floorOptions = computed(() => {
    const set = new Set();
    rooms.value.forEach((room) => {
      if (!buildingName.value || room.buildingName === buildingName.value) {
        if (room.floorName) set.add(room.floorName);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-CN"));
  });

  const fetchOnce = async (seq) => {
    try {
      const dictData = await listDicts();
      if (seq !== loadSeq) return;
      dicts.value = Array.isArray(dictData) ? dictData : [];
    } catch (error) {
      if (seq !== loadSeq) return;
      dicts.value = [];
      toastError(error);
    }

    const params = {
      page: page.value,
      pageSize
    };
    const kw = keyword.value.trim();
    if (kw) params.keyword = kw;
    if (enabledFilter.value === "true") params.enabled = true;
    if (enabledFilter.value === "false") params.enabled = false;
    if (buildingName.value) params.buildingName = buildingName.value;
    if (floorName.value) params.floorName = floorName.value;

    try {
      const data = await listRooms(params);
      if (seq !== loadSeq) return;
      rooms.value = (data && data.list) || [];
      total.value = (data && data.total) || 0;
    } catch (error) {
      if (seq !== loadSeq) return;
      rooms.value = [];
      total.value = 0;
      toastError(error);
    }
  };

  const fetchList = async () => {
    if (!canLoad.value) return;
    const seq = ++loadSeq;
    loading.value = true;
    try {
      await fetchOnce(seq);
      if (seq !== loadSeq) return;
      if (floorName.value && !floorOptions.value.includes(floorName.value)) {
        floorName.value = "";
        await fetchOnce(seq);
      }
    } finally {
      if (seq === loadSeq) loading.value = false;
    }
  };

  const refetch = () => {
    page.value = 1;
    fetchList();
  };

  watch(keywordInput, (value) => {
    if (skipKeywordWatch) return;
    clearTimeout(keywordTimer);
    keywordTimer = setTimeout(() => {
      keyword.value = value.trim();
      refetch();
    }, 300);
  });

  const resetFilters = () => {
    clearTimeout(keywordTimer);
    skipKeywordWatch = true;
    keywordInput.value = "";
    skipKeywordWatch = false;
    keyword.value = "";
    enabledFilter.value = "all";
    buildingName.value = "";
    floorName.value = "";
    page.value = 1;
    fetchList();
  };

  const setEnabledFilter = (value) => {
    enabledFilter.value = value;
    refetch();
  };

  const setBuildingName = (value) => {
    buildingName.value = value || "";
    refetch();
  };

  const setFloorName = (value) => {
    floorName.value = value || "";
    refetch();
  };

  const setPage = (next) => {
    page.value = next;
    fetchList();
  };

  const toggleEnabled = async (room) => {
    const next = !room.enabled;
    if (!next) {
      const ok = await confirmAsk("停用后该会议室将不可被预定，确定停用？", {
        confirmText: "确定停用"
      });
      if (!ok) return;
    }
    try {
      await setRoomEnabled(room.id, next);
      showToastSuccess(next ? "已启用" : "已停用");
      await fetchList();
    } catch (error) {
      toastError(error);
    }
  };

  watch(
    () => (active ? active.value : true),
    (value) => {
      if (value) fetchList();
    },
    { immediate: true }
  );

  return {
    keywordInput,
    enabledFilter,
    buildingName,
    floorName,
    page,
    pageSize,
    rooms,
    dicts,
    total,
    loading,
    hasFilter,
    buildingOptions,
    floorOptions,
    resetFilters,
    setEnabledFilter,
    setBuildingName,
    setFloorName,
    setPage,
    toggleEnabled
  };
};
