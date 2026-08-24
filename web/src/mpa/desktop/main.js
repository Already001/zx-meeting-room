import "@unocss/reset/tailwind.css";
import "uno.css";
import "@/style.css";

import { createApp } from "vue";
import App from "./App.vue";
import { createAppRouter } from "@/router";
import { bootstrapAuthFromUrl } from "@/utils";
import routes from "~zx-pages";
import "@vant/touch-emulator";

// 登录态引导属于应用启动步骤，必须在挂载前完成
bootstrapAuthFromUrl();

const router = createAppRouter(routes, "zx/");

createApp(App).use(router).mount("#app");
