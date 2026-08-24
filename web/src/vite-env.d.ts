/// <reference types="vite/client" />

declare const JENKINS_BUILD_NUMBER: string;
declare const __BUILD_TARGET__: "main" | "zx" | "m";

declare module "~pages" {
  import type { RouteRecordRaw } from "vue-router";
  const routes: RouteRecordRaw[];
  export default routes;
}
declare module "~zx-pages" {
  import type { RouteRecordRaw } from "vue-router";
  const routes: RouteRecordRaw[];
  export default routes;
}
declare module "~m-pages" {
  import type { RouteRecordRaw } from "vue-router";
  const routes: RouteRecordRaw[];
  export default routes;
}

interface Window {
  __VITE_MPA_PLATFORM__?: "zx" | "m";
}
