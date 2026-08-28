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
      :is-admin="isAdmin"
      :mine-open="mine.open.value"
      :view-mode="viewMode"
      @update:keyword="keyword = $event"
      @update:filters="onFilters"
      @select-date="onSelectDate"
      @prev-day="shiftBoard(-1)"
      @next-day="shiftBoard(1)"
      @today="goToday"
      @reset="resetFilters"
      @open-mine="toggleMine"
      @admin="router.push('/admin')"
      @switch-user="switchDemoUser"
      @change-view="onChangeView"
    />

    <PcTimelineBoard
      :rooms="visibleRooms"
      :selection="selection"
      :is-today="isToday"
      :booking-open="Boolean(bookingRoom)"
      :view-mode="viewMode"
      :week-dates="weekDaysMeta"
      :today-iso="todayIso"
      @update:selection="selection = $event"
      @commit="handleCommitRange"
      @notice="onNotice"
    />

    <CreateScheduleModal
      v-if="bookingRoom && bookingRange"
      :room="bookingRoom"
      :range-text="bookingRange.text"
      :date-label="bookingRange.dateLabel"
      :date-iso="bookingRange.dateIso"
      :dates="bookingRange.dates"
      :start="bookingRange.start"
      :end="bookingRange.end"
      :full-screen="false"
      @close="closeBooking"
      @success="handleBookingSuccess"
    />
    <MyBookingsModal
      v-if="mine.open.value"
      :bookings="mine.items.value"
      @close="closeMine"
      @release="onRelease"
    />
    <AiBuddyFab @booked="reload" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { switchDemoUser } from "@/features/demo/session";
import { getUserId, showToastError, showToastSuccess } from "@/utils";
import { useBoard } from "./useBoard";
import { useMine } from "./useMine";
import {
  addDays,
  formatMonthDay,
  fromMinutes,
  shanghaiToday,
  weekRangeLabel,
  workweekOf
} from "./time";
import PcToolbar from "./components/PcToolbar.vue";
import PcTimelineBoard from "./components/PcTimelineBoard.vue";
import CreateScheduleModal from "./components/CreateScheduleModal.vue";
import MyBookingsModal from "./components/MyBookingsModal.vue";
import AiBuddyFab from "./components/AiBuddyFab.vue";
import "./booking.css";

const router = useRouter();
const isAdmin = ref(false);
const bookingRoom = ref(null);
const bookingRange = ref(null);

const board = useBoard();
const mine = useMine();

const {
  CAPACITY_OPTIONS,
  boardDate,
  viewMode,
  days,
  workweekDates,
  weekDaysMeta,
  weekLabel,
  filters,
  keyword,
  selection,
  facilityOptions,
  places,
  rooms,
  visibleRooms,
  reload
} = board;

const todayIso = shanghaiToday();

const dateLabel = computed(() => {
  if (viewMode.value === "week") {
    return `${weekLabel.value}（周一至周五）`;
  }
  const d = days.value.find((x) => x.value === boardDate.value);
  return d ? `${boardDate.value} (${d.weekday})` : boardDate.value;
});

const dateShort = computed(() => {
  const d = days.value.find((x) => x.value === boardDate.value);
  return d ? d.short : boardDate.value;
});

const isToday = computed(() => boardDate.value === todayIso);

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

const onChangeView = (mode) => {
  if (viewMode.value === mode) return;
  viewMode.value = mode;
  selection.value = null;
};

const shiftBoard = (delta) => {
  const list = days.value;
  if (viewMode.value === "week") {
    const week = workweekOf(addDays(workweekDates.value[0], delta * 7));
    const hit = list.find((d) => week.includes(d.value));
    if (!hit) return;
    boardDate.value = hit.value;
    selection.value = null;
    return;
  }
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

const closeMine = () => {
  mine.open.value = false;
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
  if (picked.view === "week") {
    const dates = picked.dates || [];
    bookingRange.value = {
      start: picked.start,
      end: picked.end,
      dates,
      dateIso: dates[0] || boardDate.value,
      dateLabel:
        dates.length > 1
          ? `${formatMonthDay(dates[0])} – ${formatMonthDay(dates[dates.length - 1])}`
          : formatMonthDay(dates[0] || boardDate.value),
      text: weekRangeLabel(
        picked.startDay,
        picked.endDay,
        picked.start,
        picked.end
      )
    };
    bookingRoom.value = room;
    selection.value = null;
    return;
  }
  bookingRange.value = {
    start: picked.start,
    end: picked.end,
    dates: [boardDate.value],
    dateIso: boardDate.value,
    dateLabel: dateShort.value,
    text: `${fromMinutes(picked.start)} - ${fromMinutes(picked.end)}`
  };
  bookingRoom.value = room;
  selection.value = null;
};

const closeBooking = () => {
  bookingRoom.value = null;
  bookingRange.value = null;
};

const handleBookingSuccess = async (count = 1) => {
  closeBooking();
  selection.value = null;
  showToastSuccess(
    count > 1
      ? `已预定 ${count} 场，可在「我的预定」查看`
      : "预定成功，已加入「我的预定」"
  );
  await reload();
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
