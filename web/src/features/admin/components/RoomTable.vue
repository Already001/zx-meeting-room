<template>
  <div class="zx-card !p-0 overflow-hidden">
    <el-table v-loading="loading" :data="rooms" class="w-full">
      <el-table-column label="名称" min-width="160">
        <template #default="{ row }">
          <div>{{ row.name }}</div>
          <div
            v-if="row.groupName"
            class="text-12px leading-18px text-grayMedium"
          >
            分组：{{ row.groupName }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="buildingName" label="建筑" min-width="100" />
      <el-table-column prop="floorName" label="楼层" min-width="80" />
      <el-table-column label="容纳人数" width="90">
        <template #default="{ row }">{{ row.capacity }}人</template>
      </el-table-column>
      <el-table-column label="设施" min-width="160">
        <template #default="{ row }">
          {{ formatFacilities(row.facilities, dicts) }}
        </template>
      </el-table-column>
      <el-table-column label="开放时间" width="140">
        <template #default="{ row }">
          {{ row.openStart }} - {{ row.openEnd }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
            {{ row.enabled ? "启用中" : "已停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button type="primary" link @click="$emit('edit', row.id)">
            编辑
          </el-button>
          <el-button
            v-if="row.enabled"
            type="danger"
            link
            @click="$emit('toggle', row)"
          >
            停用
          </el-button>
          <el-button v-else type="primary" link @click="$emit('toggle', row)">
            启用
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <div class="py-48px flex flex-col items-center gap-8px">
          <span class="text-14px text-grayDark">
            {{ hasFilter ? "没有符合条件的会议室" : "暂无会议室" }}
          </span>
          <span class="text-13px text-grayMedium">
            {{
              hasFilter ? "试试调整筛选条件" : "新建一间会议室后即可维护主数据"
            }}
          </span>
          <el-button v-if="hasFilter" @click="$emit('reset')"
            >重置筛选</el-button
          >
          <el-button v-else type="primary" @click="$emit('create')">
            新建会议室
          </el-button>
        </div>
      </template>
    </el-table>
    <div
      v-if="total > 0"
      class="flex items-center justify-between px-16px py-12px border-t border-edge"
    >
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="$emit('update:page', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { formatFacilities } from "../format";

defineProps({
  rooms: { type: Array, default: () => [] },
  dicts: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  hasFilter: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 }
});

defineEmits(["edit", "toggle", "create", "reset", "update:page"]);
</script>
