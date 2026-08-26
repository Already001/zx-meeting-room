<template>
  <AdminShell active="dicts">
    <div class="flex flex-col gap-16px">
      <div class="flex items-start justify-between gap-16px">
        <div>
          <h1 class="m-0 text-20px font-600 leading-32px text-black">字典表</h1>
          <p class="mt-4px mb-0 text-13px leading-18px text-grayDark">
            维护会议室表单使用的建筑、设施选项。默认已内置奥城 /
            生态城，以及电视 / 白板 / 投影。
          </p>
        </div>
        <el-button type="primary" @click="openCreate">
          新增{{ typeLabel }}
        </el-button>
      </div>

      <div class="flex gap-8px" role="tablist" aria-label="字典类型">
        <button
          v-for="tab in DICT_TYPES"
          :key="tab.id"
          type="button"
          role="tab"
          class="h-32px px-14px border rounded-20px text-13px inline-flex items-center gap-6px cursor-pointer font-inherit"
          :class="
            activeType === tab.id
              ? 'bg-primaryLight border-primaryBorder text-primary font-500'
              : 'bg-canvas border-hairline text-black'
          "
          :aria-selected="activeType === tab.id"
          @click="setActiveType(tab.id)"
        >
          {{ tab.label }}
          <span class="text-11px opacity-75">{{ typeCounts[tab.id] }}</span>
        </button>
      </div>

      <div class="zx-card !p-0 overflow-hidden">
        <el-table v-loading="loading" :data="rows" class="w-full">
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column prop="name" label="名称" min-width="160" />
          <el-table-column label="引用" width="120">
            <template #default="{ row }">
              {{ formatUsage(row.usageCount) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                {{ row.enabled ? "启用中" : "已停用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button type="primary" link @click="openEdit(row)">
                编辑
              </el-button>
              <el-button
                v-if="row.enabled"
                type="danger"
                link
                @click="toggleEnabled(row)"
              >
                停用
              </el-button>
              <el-button v-else type="primary" link @click="toggleEnabled(row)">
                启用
              </el-button>
              <el-button type="danger" link @click="remove(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <div class="py-48px flex flex-col items-center gap-8px">
              <span class="text-14px text-grayDark">
                暂无{{ typeLabel }}字典
              </span>
              <el-button type="primary" @click="openCreate">
                新增{{ typeLabel }}
              </el-button>
            </div>
          </template>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="400px"
      destroy-on-close
      @closed="closeEditor"
    >
      <div class="flex flex-col gap-14px">
        <div>
          <label class="block mb-6px text-13px leading-20px" for="dict-name">
            名称
          </label>
          <el-input
            id="dict-name"
            :model-value="draftName"
            maxlength="20"
            :placeholder="namePlaceholder"
            @update:model-value="onDraftNameInput"
          />
        </div>
        <div>
          <label class="block mb-6px text-13px leading-20px" for="dict-sort">
            排序
          </label>
          <el-input
            id="dict-sort"
            class="w-140px"
            type="number"
            min="1"
            :model-value="draftSort"
            @update:model-value="draftSort = $event"
          />
        </div>
        <div v-if="formError" class="text-13px text-danger" role="alert">
          {{ formError }}
        </div>
      </div>
      <template #footer>
        <el-button @click="closeEditor">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </AdminShell>
</template>

<script setup>
import { computed } from "vue";
import AdminShell from "./AdminShell.vue";
import { useAdminGate } from "./useAdminGate";
import { DICT_TYPES, useDicts } from "./useDicts";

const { ready, isAdmin } = useAdminGate();
const active = computed(() => ready.value && isAdmin.value);

const {
  loading,
  saving,
  activeType,
  typeLabel,
  typeCounts,
  rows,
  dialogVisible,
  dialogTitle,
  namePlaceholder,
  draftName,
  draftSort,
  formError,
  setActiveType,
  openCreate,
  openEdit,
  closeEditor,
  onDraftNameInput,
  submit,
  toggleEnabled,
  remove
} = useDicts({ active });

const formatUsage = (count) => (count > 0 ? `${count} 间会议室` : "未使用");
</script>
