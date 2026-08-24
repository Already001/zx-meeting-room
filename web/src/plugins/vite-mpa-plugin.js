/**
 * MPA 多页面应用插件
 * 集成路由回退与平台识别（本项目只有 main / zx / m 三个入口）
 */
export const mpaPlugin = (baseUrl = "/meeting/") => {
  return {
    name: "mpa-unified",
    // 开发服务器中间件 —— 处理子入口的 history 路由回退
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url;
        const routes = [
          { prefix: `${baseUrl}m/`, fallback: `${baseUrl}m/` },
          { prefix: `${baseUrl}zx/`, fallback: `${baseUrl}zx/` }
        ];

        for (const route of routes) {
          if (
            url.startsWith(route.prefix) &&
            !url.includes(".") &&
            url !== route.fallback
          ) {
            req.url = route.fallback;
            break;
          }
        }
        next();
      });
    },
    // HTML 转换 —— 注入平台标识，运行期读 window.__VITE_MPA_PLATFORM__ 判断宿主形态
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const { filename } = ctx;
        const platformMap = {
          "/m/index.html": "m",
          "/zx/index.html": "zx"
        };
        const platform = Object.keys(platformMap).find((key) =>
          filename.includes(key)
        );
        const platformPrefix = platform ? platformMap[platform] : "";
        if (platformPrefix) {
          const script = `<script>window.__VITE_MPA_PLATFORM__='${platformPrefix}';</script>`;
          return html.replace("<head>", `<head>${script}`);
        }
        return html;
      }
    }
  };
};
