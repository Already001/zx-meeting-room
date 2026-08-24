import { createRouter, createWebHistory } from "vue-router";
import { confirmNoted } from "./utils";

// 非 Jenkins CI 构建时 JENKINS_BUILD_NUMBER / build_version.build_number 都是哨兵值，
// 二者必然不相等，若不跳过会导致本地/非 CI 环境 100% 误报并刷新死循环。
const SKIP_MARKERS = ["NOT_JENKINS_CI", "NOT_CI", ""];

/**
 * 创建带「版本自更新」自愈能力的路由实例。
 * 三个入口（main/zx/m）统一走这里，避免只有 main 装了自愈逻辑。
 * @param {import('vue-router').RouteRecordRaw[]} routes 当前入口的路由表
 * @param {string} subPath 该入口相对部署 base 的子路径，如 "zx/"、"m/"；main 入口传 ""
 */
export const createAppRouter = (routes, subPath = "") => {
  const router = createRouter({
    history: createWebHistory(`${import.meta.env.BASE_URL}${subPath}`),
    routes
  });

  /**
   * 版本自更新：产物换版后旧页面的动态 import 会 404。
   * 捕获该错误 → 比对线上 build_version 与编译期常量 → 不一致就提示刷新。
   */
  router.onError((error, to) => {
    console.log("router.onError", { error, to });
    if (
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed")
    ) {
      fetch("/meeting/build_version", { cache: "no-cache" })
        .then((x) => x.text())
        .then((v) => {
          // @ts-ignore JENKINS_BUILD_NUMBER 是 vite define 注入的编译期常量
          if (SKIP_MARKERS.includes(JENKINS_BUILD_NUMBER)) return;
          // @ts-ignore 同上
          if (!new RegExp(JENKINS_BUILD_NUMBER).test(v)) {
            return confirmNoted("会议室已更新，是否刷新为最新版本?");
          }
        })
        .then((update) => {
          if (update) {
            location.reload();
          }
        });
    }
  });

  return router;
};
