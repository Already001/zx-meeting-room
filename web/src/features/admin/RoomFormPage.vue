<template>
  <AdminShell active="rooms">
    <div v-loading="loading" class="flex flex-col gap-16px">
      <div class="flex items-center gap-12px">
        <el-button @click="onCancel">返回</el-button>
        <h1 class="m-0 text-20px font-600 leading-32px text-black">
          {{ isEdit ? "编辑会议室" : "新建会议室" }}
        </h1>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="right"
        label-width="132px"
        require-asterisk-position="right"
        class="flex flex-col gap-16px"
      >
        <section class="zx-card">
          <h2 class="m-0 mb-16px text-15px font-600 leading-22px text-black">
            基本信息
          </h2>
          <el-form-item label="会议室名称" prop="name">
            <el-input
              v-model="form.name"
              maxlength="30"
              placeholder="例如：1号会议室（1-30字）"
              class="max-w-480px"
            />
          </el-form-item>
          <el-form-item label="所属分组" prop="groupName">
            <el-input
              v-model="form.groupName"
              maxlength="20"
              placeholder="选填，例如：研发区 / 高管区（上限20字）"
              class="max-w-480px"
            />
          </el-form-item>
          <el-form-item label="所在位置" required>
            <BuildingFloorFields
              :building-name="form.buildingName"
              :floor-name="form.floorName"
              :building-options="buildingOptions"
              :floor-options="floorOptions"
              @update:building-name="form.buildingName = $event"
              @update:floor-name="form.floorName = $event"
            />
          </el-form-item>
          <el-form-item label="容纳人数" prop="capacity">
            <div class="flex items-center gap-8px">
              <el-input-number
                v-model="form.capacity"
                :min="1"
                :max="999"
                :precision="0"
                :controls="true"
                class="w-140px"
              />
              <span class="text-14px text-black">人</span>
            </div>
          </el-form-item>
        </section>

        <section class="zx-card">
          <h2 class="m-0 mb-16px text-15px font-600 leading-22px text-black">
            会议室设施
          </h2>
          <FacilityFields
            v-model="form.facilities"
            :options="facilityOptions"
          />
        </section>

        <section class="zx-card">
          <h2 class="m-0 mb-16px text-15px font-600 leading-22px text-black">
            预定规则
          </h2>
          <el-form-item label="开放时间" prop="openStart">
            <div class="flex items-center gap-8px flex-wrap">
              <el-time-picker
                v-model="form.openStart"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="开始"
                class="w-140px"
              />
              <span class="text-13px text-grayDark">至</span>
              <el-time-picker
                v-model="form.openEnd"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="结束"
                class="w-140px"
                @change="onOpenEndChange"
              />
            </div>
          </el-form-item>
          <el-form-item label="提前预定" prop="bookAheadDays">
            <el-select v-model="form.bookAheadDays" class="w-220px">
              <el-option
                v-for="opt in bookAheadOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="预定需审批">
            <div class="flex items-center gap-8px">
              <el-switch v-model="form.needApproval" />
              <span class="text-13px text-grayDark">
                {{ form.needApproval ? "开启" : "关闭" }}（仅数据落库）
              </span>
            </div>
          </el-form-item>
          <el-form-item label="允许周期预定">
            <div class="flex items-center gap-8px">
              <el-switch v-model="form.allowRecurring" />
              <span class="text-13px text-grayDark">
                {{ form.allowRecurring ? "开启" : "关闭" }}（仅数据落库）
              </span>
            </div>
          </el-form-item>
          <el-form-item label="支持会议室抢占">
            <div class="flex items-center gap-8px">
              <el-switch v-model="form.allowPreempt" />
              <span class="text-13px text-grayDark">
                {{ form.allowPreempt ? "开启" : "关闭" }}（仅数据落库）
              </span>
            </div>
          </el-form-item>
          <el-form-item label="状态" prop="enabled">
            <el-radio-group v-model="form.enabled">
              <el-radio :value="true">启用中</el-radio>
              <el-radio :value="false">已停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </section>

        <section class="zx-card">
          <h2 class="m-0 mb-16px text-15px font-600 leading-22px text-black">
            备注信息
          </h2>
          <el-form-item label="备注" prop="locationNote">
            <el-input
              v-model="form.locationNote"
              type="textarea"
              :rows="3"
              maxlength="100"
              show-word-limit
              placeholder="门牌、投影仪连接线、特定使用须知等补充信息（上限100字）"
              class="max-w-640px"
            />
          </el-form-item>
        </section>
      </el-form>

      <div class="flex justify-end gap-12px pb-8px">
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">
          {{ saving ? "保存中..." : "保存" }}
        </el-button>
      </div>
    </div>
  </AdminShell>
</template>

<script setup>
import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import AdminShell from "./AdminShell.vue";
import BuildingFloorFields from "./components/BuildingFloorFields.vue";
import FacilityFields from "./components/FacilityFields.vue";
import { useAdminGate } from "./useAdminGate";
import { useDirtyGuard } from "./useDirtyGuard";
import { useRoomForm } from "./useRoomForm";

const props = defineProps({
  id: { type: String, default: "" }
});

const router = useRouter();
const { ready, isAdmin } = useAdminGate();
const active = computed(() => ready.value && isAdmin.value);

const roomId = computed(() => props.id || "");

const {
  formRef,
  form,
  loading,
  saving,
  isEdit,
  buildingOptions,
  facilityOptions,
  floorOptions,
  bookAheadOptions,
  rules,
  save
} = useRoomForm({ id: roomId, active });

const { markClean } = useDirtyGuard(form);

watch(loading, (now, prev) => {
  if (prev && !now) markClean();
});

const onOpenEndChange = () => {
  formRef.value?.validateField("openStart");
};

const onCancel = () => {
  router.push("/admin");
};

const onSave = async () => {
  const ok = await save();
  if (!ok) return;
  markClean();
  router.push("/admin");
};
</script>
