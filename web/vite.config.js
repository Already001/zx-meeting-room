import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import { resolve } from "path";

import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";

import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import {
  ElementPlusResolver,
  VantResolver
} from "unplugin-vue-components/resolvers";
import { codeInspectorPlugin } from "code-inspector-plugin";

import exportConfig from "./export.config.js";
import { autoApiExports } from "./src/plugins/vite-auto-api-exports.js";
import { autoExportAssets } from "./src/plugins/vite-auto-assets-exports.js";
import { mpaPlugin } from "./src/plugins/vite-mpa-plugin.js";
import { createPagesPlugins } from "./src/plugins/vite-pages-config.js";

// 部署 base，改动需同步部署侧 nginx
const base = "/meeting/";

// MPA 构建目标
const buildTarget = process.env.BUILD_TARGET || "main";
const buildEntries = {
  main: "index.html", // 主应用
  zx: "zx/index.html", // 桌面端（PC WebView）
  m: "m/index.html" // 移动端（iOS / 安卓 WebView）
};

export default defineConfig(({ mode }) => {
  return {
    base,
    server: {
      // dev 反向代理：/api 走智信网关，/meetingApi 走本地 Hono
      proxy: {
        "/api": "http://192.168.10.25",
        "/meetingApi": "http://localhost:3100"
      },
      host: "0.0.0.0",
      port: 6273
    },
    preview: { port: 6273 },
    plugins: [
      codeInspectorPlugin({
        bundler: "vite",
        injectTo: [
          resolve(__dirname, "src/main.js"), // main 入口
          resolve(__dirname, "src/mpa/desktop/main.js"), // zx 入口
          resolve(__dirname, "src/mpa/mobile/main.js") // m 入口
        ],
        behavior: { copy: true }
      }),
      vue(),
      UnoCSS(),
      AutoImport({ resolvers: [ElementPlusResolver(), VantResolver()] }),
      Components({ resolvers: [ElementPlusResolver(), VantResolver()] }),
      autoExportAssets(exportConfig),
      autoApiExports(),
      ...createPagesPlugins(),
      mpaPlugin(base)
    ],
    define: {
      JENKINS_BUILD_NUMBER: JSON.stringify(
        process.env.BUILD_NUMBER || "NOT_JENKINS_CI"
      ),
      // 构建目标（main/zx/m），供运行期区分宿主形态
      __BUILD_TARGET__: JSON.stringify(buildTarget)
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
    },
    build: {
      assetsInlineLimit: 0,
      ...(mode !== "development" && { outDir: `dist_${buildTarget}` }),
      rollupOptions: {
        input:
          mode === "development"
            ? Object.fromEntries(
                Object.entries(buildEntries).map(([k, v]) => [
                  k,
                  resolve(__dirname, v)
                ])
              )
            : { [buildTarget]: resolve(__dirname, buildEntries[buildTarget]) }
      }
    }
  };
});
