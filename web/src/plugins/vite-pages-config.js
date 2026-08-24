import Pages from "vite-plugin-pages";

/**
 * 三套文件式路由：主应用 / 桌面(zx) / 移动(m)
 * @returns {any[]}
 */
export const createPagesPlugins = () => {
  const pagesConfigs = [
    { dirs: "src/pages", moduleId: "~pages" },
    { dirs: "src/mpa/desktop/pages", moduleId: "~zx-pages" },
    { dirs: "src/mpa/mobile/pages", moduleId: "~m-pages" }
  ];

  return pagesConfigs.map((config) =>
    Pages({
      dirs: config.dirs,
      extensions: ["vue", "tsx", "ts", "js"],
      moduleId: config.moduleId
    })
  );
};
