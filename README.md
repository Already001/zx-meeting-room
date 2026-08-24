# zx-meeting-room

智能会议室前端 + Node 后端（pnpm workspace）。

- `web/` —— Vue 3 + Vite 7，MPA 三入口：`main`（独立浏览器）/ `zx`（PC WebView）/ `m`（iOS·安卓 WebView）
- `server/` —— Hono + TypeScript，端口 3100，路由前缀 `/meetingApi`

```bash
pnpm i
pnpm dev          # 前后端一起起
pnpm build        # 产出 web/dist/
```

部署 base `/meeting/`。详见 `CLAUDE.md`。

文档：

- 需求：`docs/智能会议室-需求文档.md`
- 规格：`docs/智能会议室-规格说明.md`
