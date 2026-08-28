<template>
  <AdminShell active="history">
    <div class="flex flex-col gap-16px">
      <div>
        <h1 class="m-0 text-20px font-600 leading-32px text-black text-pretty">
          预定记录
        </h1>
        <p class="mt-4px mb-0 text-13px leading-18px text-grayDark">
          查看全部预定历史，点开一行可看创建 / 修改 / 释放审计
        </p>
      </div>
      <div class="zx-card !p-0 overflow-hidden">
        <el-table
          v-loading="loading"
          :data="list"
          class="w-full booking-history-table"
        >
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column label="时段" width="130">
            <template #default="{ row }"
              >{{ row.start }} - {{ row.end }}</template
            >
          </el-table-column>
          <el-table-column prop="title" label="主题" min-width="140" />
          <el-table-column label="会议室" min-width="160">
            <template #default="{ row }">
              {{ row.roomName }}（{{ row.buildingName }} {{ row.floorName }}）
            </template>
          </el-table-column>
          <el-table-column prop="hostUserName" label="预定人" width="100" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">{{
              statusLabel(row.status)
            }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openAudit(row)"
                >审计</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <div class="flex justify-end p-12px">
          <el-pagination
            background
            layout="prev, pager, next, total"
            :total="total"
            :page-size="pageSize"
            :current-page="page"
            @current-change="setPage"
          />
        </div>
      </div>
    </div>
    <el-drawer v-model="auditOpen" title="预定审计" size="420px">
      <el-timeline v-if="audits.length">
        <el-timeline-item
          v-for="item in audits"
          :key="item.id"
          :timestamp="item.createdAt"
        >
          {{ actionLabel(item.action) }}
          <span class="text-grayDark">
            · {{ item.actorUserName || item.actorUserId }}</span
          >
        </el-timeline-item>
      </el-timeline>
      <p v-else class="text-13px text-grayDark">暂无审计记录</p>
    </el-drawer>
  </AdminShell>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { listAdminBookings, listBookingAudit } from "@/server/module/booking";
import { showToastError } from "@/utils";
import { MINE_STATUS_LABEL } from "@/features/booking/mine";
import AdminShell from "./AdminShell.vue";
import { useAdminGate } from "./useAdminGate";

const ACTION_LABEL = {
  create: "创建",
  update: "修改",
  release: "释放"
};

const { ready, isAdmin } = useAdminGate();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const list = ref([]);
const total = ref(0);
const page = computed(() => Math.max(1, Number(route.query.page) || 1));
const pageSize = 20;
const auditOpen = ref(false);
const audits = ref([]);

const statusLabel = (status) => MINE_STATUS_LABEL[status] || status;
const actionLabel = (action) => ACTION_LABEL[action] || action;

const load = async () => {
  loading.value = true;
  try {
    const data = await listAdminBookings({ page: page.value, pageSize });
    list.value = Array.isArray(data?.list) ? data.list : [];
    total.value = Number(data?.total || 0);
  } catch (error) {
    list.value = [];
    total.value = 0;
    showToastError(error.msg || error.message || "加载失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

const setPage = (next) => {
  router.replace({ query: { ...route.query, page: String(next) } });
};

const openAudit = async (row) => {
  auditOpen.value = true;
  audits.value = [];
  try {
    const data = await listBookingAudit(row.id);
    audits.value = Array.isArray(data) ? data : [];
  } catch (error) {
    showToastError(error.msg || error.message || "加载审计失败，请稍后重试");
  }
};

watch([ready, isAdmin, page], ([isReady, admin]) => {
  if (isReady && admin) load();
});
</script>

<style scoped>
.booking-history-table {
  font-variant-numeric: tabular-nums;
}
</style>
