import { getCorpId, getUserId } from "@/utils";
import {
  canEnterDemoAdmin,
  clearDemoSession,
  demoEnterUrl,
  demoHomeUrl,
  hasDemoIdentity
} from "./demoTenants";

export {
  DEMO_ADMIN_TENANTS,
  DEMO_TENANTS,
  canEnterDemoAdmin,
  hasDemoIdentity
} from "./demoTenants";

export const currentHasDemoIdentity = () =>
  hasDemoIdentity(getCorpId(), getUserId());

/** 开发态三个入口共用一次 Vite，BUILD_TARGET 恒为 main，须读 MPA 注入的平台 */
export const currentCanEnterDemoAdmin = () => {
  const platform =
    typeof window !== "undefined" && window.__VITE_MPA_PLATFORM__
      ? window.__VITE_MPA_PLATFORM__
      : typeof __BUILD_TARGET__ !== "undefined"
        ? __BUILD_TARGET__
        : "main";
  return canEnterDemoAdmin(platform);
};

export const enterAsDemoUser = (corpId, user, dest = "booking") => {
  const path = dest === "admin" ? "admin" : "";
  location.assign(demoEnterUrl(corpId, user, import.meta.env.BASE_URL, path));
};

export const switchDemoUser = () => {
  clearDemoSession(sessionStorage);
  location.assign(demoHomeUrl(import.meta.env.BASE_URL));
};
