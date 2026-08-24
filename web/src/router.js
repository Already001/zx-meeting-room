import { createRouter, createWebHistory } from "vue-router";
import routes from "~pages";
import { confirmNoted } from "./utils";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
        if (!new RegExp(JENKINS_BUILD_NUMBER).test(v)) {
          return confirmNoted("会议室已更新，是否刷新为最新版本?");
        }
      })
      .then((update) => {
        if (update) {
          location.href = location.href;
        }
      });
  }
});
