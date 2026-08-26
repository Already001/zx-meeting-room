<template>
  <div class="pc-app">
    <PcToolbar
      :date-label="dateLabel"
      :days="days"
      :selected-date="boardDate"
      :keyword="keyword"
      :filters="filters"
      :places="places"
      :facility-options="facilityOptions"
      :capacity-options="CAPACITY_OPTIONS"
      :show-host="showHost"
      :show-legend="showLegend"
      :is-admin="isAdmin"
      :mine-open="mine.open.value"
      @update:keyword="keyword = $event"
      @update:filters="onFilters"
      @select-date="onSelectDate"
      @prev-day="shiftDay(-1)"
      @next-day="shiftDay(1)"
      @today="goToday"
      @reset="resetFilters"
      @toggle-host="showHost = !showHost"
      @toggle-legend="showLegend = !showLegend"
      @open-mine="toggleMine"
      @refresh="onRefresh"
      @admin="router.push('/admin')"
    />

    <PcTimelineBoard
      :rooms="visibleRooms"
      :selection="selection"
      :show-host="showHost"
      :is-today="isToday"
      :booking-open="Boolean(bookingRoom)"
      @update:selection="selection = $event"
      @commit="handleCommitRange"
      @notice="onNotice"
      @open-room="detailRoom = $event"
    />

    <RoomDetailModal
      v-if="detailRoom"
      :room="detailRoom"
      @close="detailRoom = null"
      @book="handleBookFromDetail"
    />
    <CreateScheduleModal
      v-if="bookingRoom && bookingRange"
      :room="bookingRoom"
      :range-text="bookingRange.text"
      :date-label="dateShort"
      :date-iso="boardDate"
      :start="bookingRange.start"
      :end="bookingRange.end"
      :full-screen="false"
      @close="closeBooking"
      @success="handleBookingSuccess"
    />
    <MyBookingsModal
      v-if="mine.open"
      :bookings="mine.items.value"
      @close="mine.open = false"
      @release="onRelease"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getMe } from "@/server/module/me";
import {
  getUserId,
  showToastError,
  showToastSuccess
} from "@/utils";
import { useBoard } from "./useBoard";
import { useMine } from "./useMine";
import { fromMinutes, shanghaiToday } from "./time";
import PcToolbar from "./components/PcToolbar.vue";
import PcTimelineBoard from "./components/PcTimelineBoard.vue";
import CreateScheduleModal from "./components/CreateScheduleModal.vue";
import MyBookingsModal from "./components/MyBookingsModal.vue";
import RoomDetailModal from "./components/RoomDetailModal.vue";
import "./booking.css";

const router = useRouter();
const isAdmin = ref(false);
const showHost = ref(false);
const showLegend = ref(false);
const detailRoom = ref(null);
const bookingRoom = ref(null);
const bookingRange = ref(null);

const board = useBoard();
const mine = useMine();

const {
  CAPACITY_OPTIONS,
  boardDate,
  days,
  filters,
  keyword,
  selection,
  facilityOptions,
  places,
  visibleRooms,
  reload
} = board;

const dateLabel = computed(() => {
  const d = days.value.find((x) => x.value === boardDate.value);
  return d ? `${boardDate.value} (${d.weekday})` : boardDate.value;
});

const dateShort = computed(() => {
  const d = days.value.find((x) => x.value === boardDate.value);
  return d ? d.short : boardDate.value;
});

const isToday = computed(() => boardDate.value === shanghaiToday());

const onNotice = (msg) => {
  if (msg === "已刷新会议室占用") {
    showToastSuccess(msg);
    return;
  }
  showToastError(msg);
};

const onFilters = (next) => {
  filters.value = next;
  selection.value = null;
};

const onSelectDate = (value) => {
  boardDate.value = value;
  selection.value = null;
};

const shiftDay = (delta) => {
  const list = days.value;
  const i = list.findIndex((d) => d.value === boardDate.value);
  const next = list[i + delta];
  if (!next) return;
  boardDate.value = next.value;
  selection.value = null;
};

const goToday = () => {
  boardDate.value = shanghaiToday();
  selection.value = null;
};

const resetFilters = () => {
  filters.value = { place: "all", capacity: "all", facilities: [] };
  keyword.value = "";
  selection.value = null;
};

const onRefresh = async () => {
  await reload();
  showToastSuccess("已刷新会议室占用");
};

const toggleMine = async () => {
  if (mine.open.value) {
    mine.open.value = false;
    return;
  }
  if (!getUserId()) {
    showToastError("缺少用户信息，请重新登录");
    return;
  }
  mine.open.value = true;
  await mine.reload();
};

const handleCommitRange = (room, picked) => {
  bookingRange.value = {
    start: picked.start,
    end: picked.end,
    text: `${fromMinutes(picked.start)} - ${fromMinutes(picked.end)}`
  };
  bookingRoom.value = room;
  selection.value = null;
};

const closeBooking = () => {
  bookingRoom.value = null;
  bookingRange.value = null;
};

const handleBookingSuccess = async () => {
  closeBooking();
  detailRoom.value = null;
  selection.value = null;
  showToastSuccess("预定成功，已加入「我的预定」");
  mine.open.value = true;
  await Promise.all([reload(), mine.reload()]);
};

const handleBookFromDetail = (room) => {
  if (selection.value && selection.value.roomId === room.id) {
    detailRoom.value = null;
    handleCommitRange(room, selection.value);
    return;
  }
  showToastError("请先在时间条上轻点选择空闲时段");
};

const onRelease = async (booking) => {
  if (!getUserId()) {
    showToastError("缺少用户信息，请重新登录");
    return;
  }
  const ok = await mine.askRelease(booking);
  if (ok) await reload();
};

onMounted(async () => {
  try {
    const me = await getMe();
    isAdmin.value = Boolean(me && me.isAdmin);
  } catch {
    isAdmin.value = false;
  }
});
</script>
