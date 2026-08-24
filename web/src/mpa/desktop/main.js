import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import routes from "~zx-pages";

import "@unocss/reset/tailwind.css";
import "uno.css";
import "@vant/touch-emulator";
import "element-plus/dist/index.css";
import "vant/lib/index.css";
import "@/style.css";

const router = createRouter({
  history: createWebHistory(`${import.meta.env.BASE_URL}zx/`),
  routes
});

createApp(App).use(router).mount("#app");
