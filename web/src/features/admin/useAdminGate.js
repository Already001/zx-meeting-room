import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getMe } from "@/server/module/me";
import { getCorpId, showToastError } from "@/utils";

/** 管理端入口门闩：缺企业不拉子页数据；非管理员踢回首页 */
export const useAdminGate = () => {
  const router = useRouter();
  const ready = ref(false);
  const isAdmin = ref(false);

  onMounted(async () => {
    if (!getCorpId()) {
      showToastError("缺少企业信息，请重新登录");
      ready.value = true;
      isAdmin.value = false;
      router.replace("/");
      return;
    }
    try {
      const me = await getMe();
      if (me.isAdmin === false) {
        showToastError("无管理权限");
        isAdmin.value = false;
        ready.value = true;
        router.replace("/");
        return;
      }
      isAdmin.value = true;
      ready.value = true;
    } catch (error) {
      showToastError(error.msg || error.message || "获取身份失败");
      isAdmin.value = false;
      ready.value = true;
    }
  });

  return { ready, isAdmin };
};
