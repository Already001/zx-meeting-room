import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import routes from "~m-pages";

import "@unocss/reset/tailwind.css";
import "uno.css";
import "element-plus/dist/index.css";
import "vant/lib/index.css";
import "@/style.css";

const router = createRouter({
  history: createWebHistory(`${import.meta.env.BASE_URL}m/`),
  routes
});

createApp(App).use(router).mount("#app");
