import { computed, ref } from "vue";
import isMobile from "is-mobile";
import { resolveDevice } from "./device.js";

const forced = ref(null);

const currentDevice = () =>
  resolveDevice({
    mpaPlatform:
      typeof window !== "undefined" ? window.__VITE_MPA_PLATFORM__ : undefined,
    buildTarget:
      typeof __BUILD_TARGET__ !== "undefined" ? __BUILD_TARGET__ : "main",
    uaIsMobile: isMobile(),
    forced: forced.value
  });

const applyDeviceAttr = () => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.device = currentDevice();
};

export const setMobileEnv = (env) => {
  forced.value = env ? "mobile" : "pc";
  applyDeviceAttr();
};

export const applyDeviceEnv = () => {
  applyDeviceAttr();
};

applyDeviceAttr();

export default () => {
  const mobileEnv = computed(() => currentDevice() === "mobile");
  return { mobileEnv, setMobileEnv };
};
