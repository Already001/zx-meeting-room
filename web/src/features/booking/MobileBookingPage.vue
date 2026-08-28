<template>
  <div class="m-app">
    <div class="m-navbar">
      <button
        type="button"
        class="m-nav-icon"
        aria-label="返回"
        @click="showToastSuccess('返回上一页（智信内嵌）')"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span class="m-nav-title">预定会议室</span>

      <button
        type="button"
        class="m-nav-icon"
        aria-label="更多"
        @click="showMore = true"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="6" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="18" cy="12" r="1.7" />
        </svg>
      </button>
    </div>

    <div class="m-page" data-screen-label="预定会议室">
      <div class="m-home-toolbar">
        <label class="m-search">
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
          <input v-model="keyword" type="search" placeholder="搜索会议室" />
        </label>

        <div class="m-home-filters">
          <div class="m-home-filters-scroll">
            <button
              type="button"
              class="m-filter-chip date"
              @click="filterSheet = 'date'"
            >
              <span>{{ dateChip }}</span>
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
            <button
              type="button"
              class="m-filter-chip"
              :class="{ active: filters.place !== 'all' }"
              @click="filterSheet = 'place'"
            >
              <span>{{
                filters.place === "all" ? "建筑·楼层" : filters.place
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
            <button
              type="button"
              class="m-filter-chip"
              :class="{ active: filters.facilities.length > 0 }"
              @click="filterSheet = 'facilities'"
            >
              <span>{{
                filters.facilities.length > 0
                  ? `设施 ${filters.facilities.length}`
                  : "设施"
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
          </div>
          <button
            type="button"
            class="m-filter-reset"
            @click="resetHomeFilters"
          >
            重置
          </button>
        </div>
      </div>

      <MobileRoomList
        :rooms="visibleRooms"
        :selection="selection"
        :is-today="isToday"
        @update:selection="selection = $event"
        @tap-event="(room, event) => (occupancy = { room, event })"
        @open-room="detailRoom = $event"
        @notice="onNotice"
      />

      <MobileSelectionBar
        :room="selectedRoom"
        :selection="selection"
        :date-text="dateShort"
        @cancel="selection = null"
        @quick-duration="handleQuickDuration"
        @book="openBookingFromSelection"
      />
    </div>

    <MobileDateSheet
      v-if="filterSheet === 'date'"
      :days="days"
      :selected-date="boardDate"
      @select="onSelectDate"
      @close="filterSheet = null"
    />

    <MobileFilterSheet
      v-if="filterSheet === 'place' || filterSheet === 'facilities'"
      :type="filterSheet"
      :filters="filters"
      :places="places"
      :facility-options="facilityOptions"
      @apply="onFilterApply"
      @close="filterSheet = null"
    />

    <MobileMoreSheet
      v-if="showMore"
      @open-mine="openMine"
      @switch-user="switchDemoUser"
      @close="showMore = false"
    />

    <OccupancySheet
      v-if="occupancy"
      :room="occupancy.room"
      :event="occupancy.event"
      @close="occupancy = null"
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
      :full-screen="true"
      @close="closeBooking"
      @success="handleBookingSuccess"
    />

    <MyBookingsModal
      v-if="mine.open.value"
      :bookings="mine.items.value"
      @close="mine.open.value = false"
      @release="onRelease"
    />
    <ConfirmSheet
      v-if="confirmPayload"
      :title="confirmPayload.title"
      :message="confirmPayload.message"
      :confirm-text="confirmPayload.confirmText"
      @confirm="handleConfirmRelease"
      @cancel="confirmPayload = null"
    />
    <AiBuddyFab :lifted="Boolean(selection)" @booked="reload" />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { releaseBooking } from "@/server/module/booking";
import { switchDemoUser } from "@/features/demo/session";
import { useBoard } from "./useBoard";
import { useMine } from "./useMine";
import { extendSlotEnd, fromMinutes, shanghaiToday } from "./time";
import MobileRoomList from "./components/MobileRoomList.vue";
import MobileSelectionBar from "./components/MobileSelectionBar.vue";
import MobileDateSheet from "./components/MobileDateSheet.vue";
import MobileFilterSheet from "./components/MobileFilterSheet.vue";
import MobileMoreSheet from "./components/MobileMoreSheet.vue";
import CreateScheduleModal from "./components/CreateScheduleModal.vue";
import MyBookingsModal from "./components/MyBookingsModal.vue";
import RoomDetailModal from "./components/RoomDetailModal.vue";
import OccupancySheet from "./components/OccupancySheet.vue";
import ConfirmSheet from "./components/ConfirmSheet.vue";
import AiBuddyFab from "./components/AiBuddyFab.vue";
import "./booking.css";

const board = useBoard();
const mine = useMine();

const {
  boardDate,
  days,
  filters,
  keyword,
  selection,
  facilityOptions,
  places,
  rooms,
  visibleRooms,
  reload
} = board;

const showMore = ref(false);
const filterSheet = ref(null);
const detailRoom = ref(null);
const occupancy = ref(null);
const bookingRoom = ref(null);
const bookingRange = ref(null);
const confirmPayload = ref(null);

const dateChip = computed(() => {
  const d = days.value.find((x) => x.value === boardDate.value);
  return d ? d.chip : boardDate.value;
});

const dateShort = computed(() => {
  const d = days.value.find((x) => x.value === boardDate.value);
  return d ? d.short : boardDate.value;
});

const isToday = computed(() => boardDate.value === shanghaiToday());

const selectedRoom = computed(() => {
  if (!selection.value) return null;
  return (
    visibleRooms.value.find((r) => r.id === selection.value.roomId) || null
  );
});

const onNotice = (msg) => {
  showToastError(msg);
};

const resetHomeFilters = () => {
  filters.value = { place: "all", capacity: "all", facilities: [] };
  keyword.value = "";
  boardDate.value = shanghaiToday();
  selection.value = null;
};

const onSelectDate = (value) => {
  boardDate.value = value;
  selection.value = null;
  filterSheet.value = null;
};

const onFilterApply = (next) => {
  filters.value = next;
  filterSheet.value = null;
  selection.value = null;
};

const openBooking = (room, range) => {
  bookingRange.value = range;
  bookingRoom.value = room;
};

const openBookingFromSelection = () => {
  if (!selectedRoom.value || !selection.value) return;
  const picked = selection.value;
  openBooking(selectedRoom.value, {
    start: picked.start,
    end: picked.end,
    text: `${fromMinutes(picked.start)} - ${fromMinutes(picked.end)}`
  });
};

const handleQuickDuration = (minutes) => {
  if (!selection.value || !selectedRoom.value) return;
  const end = extendSlotEnd(
    selectedRoom.value,
    selection.value.start,
    minutes,
    { isToday: isToday.value }
  );
  if (end == null) return;
  selection.value = {
    ...selection.value,
    end
  };
};

const closeBooking = () => {
  bookingRoom.value = null;
  bookingRange.value = null;
};

const handleBookingSuccess = async (count = 1) => {
  closeBooking();
  detailRoom.value = null;
  selection.value = null;
  showToastSuccess(
    count > 1
      ? `已预定 ${count} 场，可在「我的预定」查看`
      : "预定成功，已加入「我的预定」"
  );
  await reload();
};

const handleBookFromDetail = (room) => {
  if (selection.value && selection.value.roomId === room.id) {
    detailRoom.value = null;
    openBookingFromSelection();
    return;
  }
  showToastError("请先在时间条上轻点选择空闲时段");
};

const openMine = async () => {
  showMore.value = false;
  if (!getUserId()) {
    showToastError("缺少用户信息，请重新登录");
    return;
  }
  mine.open.value = true;
  await mine.reload();
};

const onRelease = (booking) => {
  if (!getUserId()) {
    showToastError("缺少用户信息，请重新登录");
    return;
  }
  const range = `${booking.start} - ${booking.end}`;
  confirmPayload.value = {
    title: "释放会议室",
    message: `${booking.roomName} ${range}，释放后其他人可预定该时段。`,
    confirmText: "确认释放",
    booking
  };
};

const handleConfirmRelease = async () => {
  const booking = confirmPayload.value?.booking;
  if (!booking) return;
  try {
    await releaseBooking(booking.id);
    showToastSuccess("会议室已提前释放");
    confirmPayload.value = null;
    await Promise.all([reload(), mine.reload()]);
  } catch (error) {
    showToastError(error.msg || error.message || "操作失败");
  }
};
</script>
