import { computed, reactive, ref, unref, watch } from "vue";
import { useRouter } from "vue-router";
import { createRoom, getRoom, updateRoom } from "@/server/module/room";
import { listDicts } from "@/server/module/dict";
import { showToastError, showToastSuccess } from "@/utils";
import { BOOK_AHEAD_OPTIONS, FLOOR_OPTIONS } from "./constants";

const toastError = (error) => {
  const msg =
    error.msg ||
    (error.response && error.response.data && error.response.data.msg) ||
    error.message;
  showToastError(msg || "操作失败");
};

const emptyForm = () => ({
  name: "",
  groupName: "",
  buildingName: "",
  floorName: "",
  capacity: null,
  facilities: [],
  locationNote: "",
  openStart: "07:00",
  openEnd: "23:00",
  bookAheadDays: 90,
  needApproval: false,
  allowRecurring: false,
  allowPreempt: false,
  enabled: true
});

const dictNames = (dicts, type) =>
  dicts
    .filter((d) => d.type === type && d.enabled)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN"))
    .map((d) => d.name);

/** 会议室新建/编辑：拉字典与房间、校验、组装 payload */
export const useRoomForm = ({ id, active } = {}) => {
  const router = useRouter();
  const formRef = ref(null);
  const form = reactive(emptyForm());
  const dicts = ref([]);
  const loading = ref(true);
  const saving = ref(false);
  let loadSeq = 0;

  const isEdit = computed(() => Boolean(unref(id)));

  const buildingOptions = computed(() => {
    const names = dictNames(dicts.value, "building");
    if (form.buildingName && !names.includes(form.buildingName)) {
      return [form.buildingName, ...names];
    }
    return names;
  });

  const facilityOptions = computed(() => {
    const names = dictNames(dicts.value, "facility");
    const extra = (form.facilities || []).filter((f) => !names.includes(f));
    return [...names, ...extra];
  });

  const floorOptions = computed(() => {
    const names = [...FLOOR_OPTIONS];
    if (form.floorName && !names.includes(form.floorName)) {
      names.unshift(form.floorName);
    }
    return names;
  });

  const applyEmpty = () => {
    Object.assign(form, emptyForm());
  };

  const applyRoom = (room) => {
    form.name = room.name || "";
    form.groupName = room.groupName || "";
    form.buildingName = room.buildingName || "";
    form.floorName = room.floorName || "";
    form.capacity = room.capacity == null ? null : Number(room.capacity);
    form.facilities = Array.isArray(room.facilities) ? [...room.facilities] : [];
    form.locationNote = room.locationNote || "";
    form.openStart = room.openStart || "07:00";
    form.openEnd = room.openEnd || "23:00";
    form.bookAheadDays = room.bookAheadDays || 90;
    form.needApproval = Boolean(room.needApproval);
    form.allowRecurring = Boolean(room.allowRecurring);
    form.allowPreempt = Boolean(room.allowPreempt);
    form.enabled = room.enabled !== false;
  };

  const toPayload = () => {
    const optionOrder = facilityOptions.value;
    const selected = new Set(form.facilities);
    return {
      name: String(form.name || "").trim(),
      groupName: String(form.groupName || "").trim() || null,
      buildingName: String(form.buildingName || "").trim(),
      floorName: String(form.floorName || "").trim(),
      capacity: Number(form.capacity),
      facilities: optionOrder.filter((name) => selected.has(name)),
      locationNote: String(form.locationNote || "").trim() || null,
      openStart: form.openStart,
      openEnd: form.openEnd,
      bookAheadDays: Number(form.bookAheadDays),
      needApproval: Boolean(form.needApproval),
      allowRecurring: Boolean(form.allowRecurring),
      allowPreempt: Boolean(form.allowPreempt),
      enabled: Boolean(form.enabled)
    };
  };

  const validateOpenHours = (_rule, _value, callback) => {
    if (!form.openStart || !form.openEnd) {
      callback(new Error("请选择开放时间"));
      return;
    }
    if (form.openEnd <= form.openStart) {
      callback(new Error("结束时间必须晚于开始时间"));
      return;
    }
    callback();
  };

  const rules = {
    name: [
      {
        validator: (_rule, value, callback) => {
          const trimmed = String(value || "").trim();
          if (!trimmed) callback(new Error("请输入名称"));
          else if (trimmed.length > 30) callback(new Error("名称不超过 30 个字"));
          else callback();
        },
        trigger: "blur"
      }
    ],
    buildingName: [
      { required: true, message: "请选择建筑", trigger: "change" }
    ],
    floorName: [{ required: true, message: "请选择楼层", trigger: "change" }],
    capacity: [
      {
        validator: (_rule, value, callback) => {
          const cap = Number(value);
          if (
            value === null ||
            value === undefined ||
            value === "" ||
            !Number.isInteger(cap) ||
            cap < 1 ||
            cap > 999
          ) {
            callback(new Error("请输入容纳人数（1-999整数）"));
          } else callback();
        },
        trigger: "change"
      }
    ],
    openStart: [{ validator: validateOpenHours, trigger: "change" }],
    openEnd: [{ validator: validateOpenHours, trigger: "change" }],
    bookAheadDays: [
      { required: true, message: "请选择可提前预定范围", trigger: "change" }
    ]
  };

  const fetchForm = async (roomId) => {
    const seq = ++loadSeq;
    loading.value = true;
    try {
      const dictData = await listDicts();
      if (seq !== loadSeq) return;
      dicts.value = Array.isArray(dictData) ? dictData : [];
      if (roomId) {
        const room = await getRoom(roomId);
        if (seq !== loadSeq) return;
        applyRoom(room);
      } else {
        applyEmpty();
      }
    } catch (error) {
      if (seq !== loadSeq) return;
      toastError(error);
      if (roomId) router.push("/admin");
    } finally {
      if (seq === loadSeq) loading.value = false;
    }
  };

  const save = async () => {
    if (saving.value) return false;
    try {
      await formRef.value.validate();
    } catch {
      showToastError("请检查表单必填项");
      return false;
    }
    saving.value = true;
    try {
      const payload = toPayload();
      const roomId = unref(id);
      if (roomId) await updateRoom(roomId, payload);
      else await createRoom(payload);
      showToastSuccess("保存成功");
      return true;
    } catch (error) {
      toastError(error);
      return false;
    } finally {
      saving.value = false;
    }
  };

  const canLoad = computed(() => (active ? unref(active) : true));

  watch(
    () => ({ ok: canLoad.value, roomId: unref(id) || "" }),
    (state) => {
      if (state.ok) fetchForm(state.roomId);
    },
    { immediate: true }
  );

  return {
    formRef,
    form,
    dicts,
    loading,
    saving,
    isEdit,
    buildingOptions,
    facilityOptions,
    floorOptions,
    bookAheadOptions: BOOK_AHEAD_OPTIONS,
    rules,
    save,
    validateOpenHours
  };
};
