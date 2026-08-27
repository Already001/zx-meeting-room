import { computed, ref, watch } from "vue";
import { CAPACITY_OPTIONS } from "./constants";
import { roomMatchesFilters, roomPlace } from "./filters";
import { addDays, shanghaiToday } from "./time";
import { getBoard } from "@/server/module/booking";
import { showToastError } from "@/utils";

const WEEK_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const toastError = (error) => {
  const msg =
    error.msg ||
    (error.response && error.response.data && error.response.data.msg) ||
    error.message;
  showToastError(msg || "加载失败");
};

const weekdayOf = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return WEEK_LABELS[new Date(y, m - 1, d).getDay()];
};

const buildDays = (baseIso, count) =>
  Array.from({ length: count }, (_, i) => {
    const value = addDays(baseIso, i);
    const [, mm, dd] = value.split("-");
    const month = Number(mm);
    const day = Number(dd);
    const weekday = weekdayOf(value);
    return {
      value,
      week: i === 0 ? "今天" : i === 1 ? "明天" : weekday,
      weekday,
      day: `${month}/${day}`,
      short: `${month}月${day}日`,
      chip: `${mm}月${dd}日 ${weekday}`
    };
  });

/**
 * 预定看板：日期轴、筛选、占用数据
 */
export const useBoard = () => {
  const today = shanghaiToday();
  const boardDate = ref(today);
  const days = computed(() => buildDays(today, 14));
  const filters = ref({ place: "all", capacity: "all", facilities: [] });
  const keyword = ref("");
  const selection = ref(null);
  const rooms = ref([]);
  const facilityOptions = ref([]);
  const loading = ref(false);

  let loadSeq = 0;

  const places = computed(() => {
    const set = new Set(rooms.value.map(roomPlace));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-CN"));
  });

  const visibleRooms = computed(() =>
    rooms.value.filter((room) =>
      roomMatchesFilters(room, filters.value, keyword.value)
    )
  );

  const reload = async () => {
    const seq = ++loadSeq;
    loading.value = true;
    try {
      const data = await getBoard(boardDate.value);
      if (seq !== loadSeq) return;
      rooms.value = Array.isArray(data?.rooms) ? data.rooms : [];
      facilityOptions.value = Array.isArray(data?.facilityOptions)
        ? data.facilityOptions
        : [];
    } catch (error) {
      if (seq !== loadSeq) return;
      rooms.value = [];
      facilityOptions.value = [];
      toastError(error);
    } finally {
      if (seq === loadSeq) loading.value = false;
    }
  };

  watch(
    boardDate,
    () => {
      reload();
    },
    { immediate: true }
  );

  watch(visibleRooms, (list) => {
    if (!selection.value) return;
    if (!list.some((r) => r.id === selection.value.roomId)) {
      selection.value = null;
    }
  });

  return {
    CAPACITY_OPTIONS,
    boardDate,
    days,
    filters,
    keyword,
    selection,
    rooms,
    facilityOptions,
    loading,
    places,
    visibleRooms,
    reload
  };
};
