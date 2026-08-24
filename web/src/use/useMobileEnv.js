import { computed, ref } from "vue";
import isMobile from "is-mobile";

// 全局响应式状态：宿主可显式设置，未设置时按 UA 判断
const mEnv = ref(false);

export const setMobileEnv = (env) => {
  mEnv.value = env;
};

export default () => {
  const mobileEnv = computed(() => mEnv.value || isMobile());
  return { mobileEnv, setMobileEnv };
};
