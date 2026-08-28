# 演示首页与多企业种子

| 项 | 内容 |
| --- | --- |
| 日期 | 2026-08-28 |
| 状态 | 待用户审阅 spec 文件 |
| 范围 | 无身份时的演示选人首页；启动时为固定演示企业写入字典/房间；身份仍走 URL query |
| 不包含 | 正式登录、企业表/企业 CRUD、按企业拆管理员配置表、第四 HTML 入口、JWT |
| 依赖 | `docs/superpowers/specs/2026-08-26-meeting-full-app-design.md`（`corpId` 隔离、`bootstrapAuthFromUrl`） |

---

## 1. 目标

本地/演示打开会议室应用时，先看到公司和模拟用户；点用户后按**现有方式**把身份拼进 URL 进入预定系统。生产仍由智信 WebView 带 query，不经过演示首页。

后端继续用 `corp_id` 隔离数据，不为「多企业」新建企业表。启动时给两家演示企业补齐空库种子，使点进不同公司看到不同房间、预定互不可见。

成功标准：

1. 无 `corpId` 或无 `userId`（sessionStorage）时，三入口 `/` 均为演示首页。
2. 点击用户打开当前入口根路径，query 为 `corpId`、`userId`、`userName`、`dept`；随后行为与手工拼 URL 一致。
3. 智信带参进入：不出现演示首页。
4. `zx-001` 与 `acme-001` 各有种子房间；A 企业预定不出现在 B 企业看板。
5. 「切换用户」清身份后回到演示首页。

---

## 2. 已拍板

| 项 | 结论 |
| --- | --- |
| 门户定位 | 演示/本地选人，不是产品登录 |
| 进系统方式 | `location.assign` 当前入口 `/` + query；`bootstrapAuthFromUrl` 落盘并剥参 |
| 多企业 | 现有 `zxCorpId` / `corp_id`；无企业表 |
| 目录来源 | 前端常量 `demoTenants.js`，与种子 ID 对齐 |
| 种子策略 | 该企业字典/房间数量为 0 才写入，不覆盖已有数据 |
| 管理员 | 全局 `MEETING_ADMIN_USER_IDS` 含 `demo-admin,acme-admin`；权限仍是白名单 + 当前企业数据 |

---

## 3. 入口与身份流

```
打开入口（main / zx / m）
  → bootstrapAuthFromUrl()
  → 有 meetingCorpId 且有 meetingUserId？
        是 → 预定看板（m 为移动预定页）；/admin* 走现有门闩
        否 → DemoHomePage
              点击用户 → location.assign(当前根路径 + query)
              刷新后走「是」分支
```

- 判断在 `web/src/features/demo` 一处导出（例如 `hasDemoIdentity()`），三个 `pages/index.vue` 只做：有身份则看板/移动预定，否则 `DemoHomePage`。
- 点击不调登录接口、不写 JWT。
- 跳转目标为当前 MPA 的 `import.meta.env.BASE_URL`（`/meeting/`、`/meeting/zx/`、`/meeting/m/`），再拼 query。
- Query 键名固定：`corpId`、`userId`、`userName`、`dept`。值做 `encodeURIComponent`，与现网手工 URL 一致。
- 生产智信带齐参数时，session 在启动时已有身份，首页不出现。

### 3.1 切换用户

PC `PcToolbar`、管理 `AdminShell`、移动预定顶栏各提供「切换用户」：

1. 删除 `meetingCorpId`、`meetingUserId`、`meetingUserName`、`meetingUserDept`。
2. 不删 `meetingToken`、`clientType`。
3. `location.assign` 当前入口根路径（无上述 query）。

无身份访问 `/admin*`：沿用缺企业提示，并回到 `/`（演示首页）。

---

## 4. 演示目录（前端常量）

文件：`web/src/features/demo/demoTenants.js`。仅用于展示与拼 URL，后端不读此文件。

| 企业名 | corpId | userId | 姓名 | 部门 | 展示角色 |
| --- | --- | --- | --- | --- | --- |
| 智信科技 | `zx-001` | `demo-admin` | 李明 | 研发 | 管理员 |
| 智信科技 | `zx-001` | `zx-u2` | 张伟 | 产品 | 员工 |
| 智信科技 | `zx-001` | `zx-u3` | 王芳 | 行政 | 员工 |
| 示例集团 | `acme-001` | `acme-admin` | 赵强 | 总经办 | 管理员 |
| 示例集团 | `acme-001` | `acme-u2` | 陈晨 | 研发 | 员工 |

`userId` 全局唯一，避免助手会话按 `userId` 跨企业串台。展示角色不参与鉴权；能否进管理只看环境变量白名单。

---

## 5. 后端种子

在 `getDb()` 完成 `ensureSchema` 之后调用（内存测试库由测试显式调用，避免每个单测都插入演示房，除非测种子本身）。

对 `zx-001`、`acme-001` 分别：

1. `ensureDefaultDicts(db, corpId)`（已有：该企业字典行数为 0 才插入默认楼宇/设施）。
2. 若该企业 `rooms` 行数为 0，插入 2～3 间启用中房间：开放时间、提前天数与现有建房默认值一致；楼宇名用该企业已有字典；房间名带企业区分（例如智信「A101 洽谈」、示例「总部 201」），避免两家看板视觉相同。

种子失败：打日志，不抛到进程退出。该企业无房时看板用现有空态。

`MEETING_ADMIN_USER_IDS` 默认/示例与本地 `.env` 含 `demo-admin,acme-admin`（可与现有测试值并存）。管理员只能改**当前请求 corpId** 下的房间与字典。

不新增 HTTP 路由。

---

## 6. 页面与样式

- `DemoHomePage.vue`：按公司分组的卡片，下列用户；管理员角标。UnoCSS + 现有主题 token。
- 移动入口同一组件，窄屏可单列；不单独做第三套视觉系统。
- 不新增 MPA HTML。

---

## 7. 错误处理与测试

- 前端：点击后整页跳转，不在门户调 `/meetingApi`。
- 服务端：新增测试——两企业各有房间；在 `zx-001` 写入预定后，`acme-001` 的 `GET /board` 不含该预定。种子测试：空库两次 `ensureDemoCorps` 房间数不变。
- 手工：无参打开 `main`/`zx`/`m` 见首页；李明进智信且能进管理；陈晨进示例集团无管理入口；切换用户回首页。

---

## 8. 明确不做

正式账号体系、企业注册/CRUD、按 `corpId` 分管理员表、演示目录 API、第四入口 `demo.html`。
