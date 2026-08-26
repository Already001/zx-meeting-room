import { onBeforeUnmount, onMounted, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { confirmAsk } from "@/utils";

/**
 * 表单脏检查：JSON.stringify(form) 对比 snapshot。
 * 路由离开弹确认；beforeunload 阻止浏览器直接关掉脏页。
 * @param {Record<string, unknown>} form
 */
export const useDirtyGuard = (form) => {
  const snapshot = ref(JSON.stringify(form));

  const isDirty = () => JSON.stringify(form) !== snapshot.value;

  const markClean = () => {
    snapshot.value = JSON.stringify(form);
  };

  const confirmLeave = async () => {
    if (!isDirty()) return true;
    return confirmAsk("放弃未保存的修改？", {
      confirmText: "确定放弃",
      cancelText: "继续编辑"
    });
  };

  const onBeforeUnload = (e) => {
    if (!isDirty()) return;
    e.preventDefault();
  };

  onMounted(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", onBeforeUnload);
  });

  onBeforeRouteLeave(async () => {
    const ok = await confirmLeave();
    return ok;
  });

  return { isDirty, markClean, confirmLeave };
};
