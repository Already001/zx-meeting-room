import { computed, ref, watch } from "vue";
import {
  createDict,
  deleteDict,
  listDicts,
  setDictEnabled,
  updateDict
} from "@/server/module/dict";
import { confirmAsk, showToastError, showToastSuccess } from "@/utils";

export const DICT_TYPES = [
  { id: "building", label: "建筑" },
  { id: "facility", label: "设施" }
];

const toastError = (error) => {
  const msg =
    error.msg ||
    (error.response && error.response.data && error.response.data.msg) ||
    error.message;
  showToastError(msg || "操作失败");
};

const typeLabelOf = (type) =>
  DICT_TYPES.find((item) => item.id === type)?.label || "";

/**
 * 字典表：建筑 / 设施 Tab；新增编辑弹窗校验；引用保护删除
 * @param {{ active?: import("vue").Ref<boolean> }} [options]
 */
export const useDicts = ({ active } = {}) => {
  const dicts = ref([]);
  const loading = ref(false);
  const saving = ref(false);
  const activeType = ref("building");
  const dialogVisible = ref(false);
  const editingId = ref(null);
  const draftName = ref("");
  const draftSort = ref(1);
  const formError = ref("");

  let loadSeq = 0;
  const canLoad = computed(() => (active ? active.value : true));

  const typeLabel = computed(() => typeLabelOf(activeType.value));

  const typeCounts = computed(() => {
    const counts = { building: 0, facility: 0 };
    dicts.value.forEach((item) => {
      if (item.type === "building" || item.type === "facility") {
        counts[item.type] += 1;
      }
    });
    return counts;
  });

  const rows = computed(() =>
    dicts.value
      .filter((item) => item.type === activeType.value)
      .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN"))
  );

  const dialogTitle = computed(
    () => `${editingId.value ? "编辑" : "新增"}${typeLabel.value}`
  );

  const namePlaceholder = computed(() =>
    activeType.value === "building" ? "例如：奥城" : "例如：电视"
  );

  const fetchList = async () => {
    if (!canLoad.value) return;
    const seq = ++loadSeq;
    loading.value = true;
    try {
      const data = await listDicts();
      if (seq !== loadSeq) return;
      dicts.value = Array.isArray(data) ? data : [];
    } catch (error) {
      if (seq !== loadSeq) return;
      dicts.value = [];
      toastError(error);
    } finally {
      if (seq === loadSeq) loading.value = false;
    }
  };

  const setActiveType = (type) => {
    if (type !== "building" && type !== "facility") return;
    activeType.value = type;
    closeEditor();
  };

  const openCreate = () => {
    const nextSort = rows.value.length
      ? Math.max(...rows.value.map((item) => item.sort)) + 1
      : 1;
    editingId.value = null;
    draftName.value = "";
    draftSort.value = nextSort;
    formError.value = "";
    dialogVisible.value = true;
  };

  const openEdit = (item) => {
    editingId.value = item.id;
    draftName.value = item.name;
    draftSort.value = item.sort;
    formError.value = "";
    dialogVisible.value = true;
  };

  const closeEditor = () => {
    dialogVisible.value = false;
    editingId.value = null;
    formError.value = "";
  };

  const onDraftNameInput = (value) => {
    draftName.value = value;
    formError.value = "";
  };

  const validateDraft = () => {
    const name = draftName.value.trim();
    if (!name) return "请输入名称";
    if (name.length > 20) return "名称不超过 20 个字";
    const dup = dicts.value.find(
      (item) =>
        item.type === activeType.value &&
        item.name === name &&
        item.id !== editingId.value
    );
    if (dup) return "同类型下已有相同名称";
    return "";
  };

  const normalizedSort = () => {
    const sort = Number(draftSort.value);
    return Number.isFinite(sort) && sort > 0 ? Math.floor(sort) : 1;
  };

  const submit = async () => {
    const error = validateDraft();
    if (error) {
      formError.value = error;
      return;
    }
    const payload = {
      name: draftName.value.trim(),
      sort: normalizedSort()
    };
    saving.value = true;
    try {
      if (editingId.value) {
        await updateDict(editingId.value, payload);
        showToastSuccess("已保存");
      } else {
        await createDict({
          type: activeType.value,
          ...payload
        });
        showToastSuccess("已新增");
      }
      closeEditor();
      await fetchList();
    } catch (err) {
      const msg = err.msg || err.message;
      if (
        msg === "请输入名称" ||
        msg === "名称不超过 20 个字" ||
        msg === "同类型下已有相同名称"
      ) {
        formError.value = msg;
      } else {
        toastError(err);
      }
    } finally {
      saving.value = false;
    }
  };

  const toggleEnabled = async (item) => {
    const next = !item.enabled;
    try {
      await setDictEnabled(item.id, next);
      showToastSuccess(next ? "已启用" : "已停用，表单中不再展示");
      await fetchList();
    } catch (error) {
      toastError(error);
    }
  };

  const remove = async (item) => {
    const used = item.usageCount || 0;
    if (used > 0) {
      showToastError(`有 ${used} 间会议室正在使用「${item.name}」，无法删除`);
      return;
    }
    const ok = await confirmAsk(`确定删除字典项「${item.name}」？`, {
      confirmText: "确定删除"
    });
    if (!ok) return;
    try {
      await deleteDict(item.id);
      showToastSuccess("已删除");
      await fetchList();
    } catch (error) {
      toastError(error);
    }
  };

  watch(
    () => (active ? active.value : true),
    (value) => {
      if (value) fetchList();
    },
    { immediate: true }
  );

  return {
    DICT_TYPES,
    dicts,
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
  };
};
