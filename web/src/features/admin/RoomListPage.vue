<template>
  <AdminShell active="rooms">
    <div class="flex flex-col gap-16px">
      <div class="flex items-start justify-between gap-16px">
        <div>
          <h1 class="m-0 text-20px font-600 leading-32px text-black">
            会议室管理
          </h1>
          <p class="mt-4px mb-0 text-13px leading-18px text-grayDark">
            维护企业会议室主数据、位置、设施与预定规则
          </p>
        </div>
        <el-button type="primary" @click="goCreate">新建会议室</el-button>
      </div>
      <RoomFilters
        :keyword="keywordInput"
        :enabled-filter="enabledFilter"
        :building-name="buildingName"
        :floor-name="floorName"
        :building-options="buildingOptions"
        :floor-options="floorOptions"
        @update:keyword="onKeywordInput"
        @update:enabled-filter="setEnabledFilter"
        @update:building-name="setBuildingName"
        @update:floor-name="setFloorName"
        @reset="resetFilters"
      />
      <RoomTable
        :rooms="rooms"
        :dicts="dicts"
        :loading="loading"
        :has-filter="hasFilter"
        :total="total"
        :page="page"
        :page-size="pageSize"
        @edit="goEdit"
        @toggle="toggleEnabled"
        @create="goCreate"
        @reset="resetFilters"
        @update:page="setPage"
      />
    </div>
  </AdminShell>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import AdminShell from "./AdminShell.vue";
import RoomFilters from "./components/RoomFilters.vue";
import RoomTable from "./components/RoomTable.vue";
import { useAdminGate } from "./useAdminGate";
import { useRoomList } from "./useRoomList";

const router = useRouter();
const { ready, isAdmin } = useAdminGate();
const active = computed(() => ready.value && isAdmin.value);

const {
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
} = useRoomList({ active });

const onKeywordInput = (value) => {
  keywordInput.value = value;
};

const goCreate = () => router.push("/admin/rooms/new");
const goEdit = (id) => router.push(`/admin/rooms/${id}`);
</script>
