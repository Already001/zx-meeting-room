import PptxGenJS from "pptxgenjs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outFile = join(__dirname, "智能会议室-项目汇报-2026-08-28.pptx");

const BLUE = "3E7EFF";
const BLUE_DK = "2E6BE6";
const INK = "1F2329";
const BODY = "5D616B";
const MUTE = "8F959E";
const CANVAS = "FFFFFF";
const SOFT = "F4F6F8";
const PRIMARY_BG = "EBF2FF";
const HAIR = "E1E5EB";
const SUCCESS = "1A9E6A";
const WARN = "B36B00";

const FONT = "Microsoft YaHei";
const W = 13.333;
const H = 7.5;

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "智能会议室项目组";
pptx.title = "智信 · 智能会议室 项目进展汇报";
pptx.subject = "2026-08-28 内部汇报";

const bg = (slide, color = SOFT) => {
  slide.background = { color };
};

const footer = (slide, n, total = 14) => {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 7.28,
    w: W,
    h: 0.22,
    fill: { color: SOFT }
  });
  slide.addText("智信 · 智能会议室", {
    x: 0.5,
    y: 7.28,
    w: 6,
    h: 0.22,
    fontFace: FONT,
    fontSize: 10,
    color: MUTE,
    valign: "middle"
  });
  slide.addText(`${n} / ${total}`, {
    x: 11.2,
    y: 7.28,
    w: 1.6,
    h: 0.22,
    fontFace: FONT,
    fontSize: 10,
    color: MUTE,
    align: "right",
    valign: "middle"
  });
};

const addKicker = (slide, text) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.5,
    y: 0.32,
    w: 0.12,
    h: 0.28,
    fill: { color: BLUE },
    rectRadius: 0.04
  });
  slide.addText(text, {
    x: 0.76,
    y: 0.28,
    w: 8,
    h: 0.36,
    fontFace: FONT,
    fontSize: 12,
    color: BLUE,
    bold: true,
    valign: "middle"
  });
};

const addTitle = (slide, text) => {
  slide.addText(text, {
    x: 0.5,
    y: 0.62,
    w: 12.3,
    h: 0.55,
    fontFace: FONT,
    fontSize: 26,
    color: INK,
    bold: true
  });
};

const card = (slide, x, y, w, h) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: CANVAS },
    line: { color: HAIR, width: 1 },
    rectRadius: 0.08
  });
};

// 1 封面
{
  const s = pptx.addSlide();
  bg(s, CANVAS);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: H, fill: { color: BLUE } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.95, w: W, h: 0.55, fill: { color: SOFT } });
  s.addText("内部汇报  ·  2026.08.28", {
    x: 0.7,
    y: 1.5,
    w: 10,
    h: 0.35,
    fontFace: FONT,
    fontSize: 14,
    color: BLUE,
    bold: true
  });
  s.addText("智信 · 智能会议室", {
    x: 0.7,
    y: 2.05,
    w: 12,
    h: 0.85,
    fontFace: FONT,
    fontSize: 40,
    color: INK,
    bold: true
  });
  s.addText("嵌入智信 PC / iOS / 安卓 WebView 的会议室预定与管理平台\n管理主数据 · 看板预定 · 对话找房 · 企业隔离", {
    x: 0.7,
    y: 3.05,
    w: 11,
    h: 0.9,
    fontFace: FONT,
    fontSize: 16,
    color: BODY
  });
  s.addText("项目进展汇报", {
    x: 0.7,
    y: 7.05,
    w: 6,
    h: 0.35,
    fontFace: FONT,
    fontSize: 13,
    color: MUTE,
    valign: "middle"
  });
  s.addText("约 12–15 分钟", {
    x: 9.5,
    y: 7.05,
    w: 3.3,
    h: 0.35,
    fontFace: FONT,
    fontSize: 13,
    color: MUTE,
    align: "right",
    valign: "middle"
  });
  s.addNotes(
    "开场：这是智信内嵌的智能会议室。今天不讲融资故事，讲我们交付了什么、怎么架构、边界在哪、下一步建议。"
  );
}

// 2 议程
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "AGENDA");
  addTitle(s, "今天讲五件事");
  const items = [
    ["01", "为什么做", "会议室难约、占用看不见、管理分散"],
    ["02", "做成了什么", "管理端 + PC/移动预定 + 对话助手"],
    ["03", "怎么做成的", "三入口 MPA、Hono API、SQLite 事务"],
    ["04", "规则与边界", "强制校验、企业隔离、明确不做"],
    ["05", "下一步", "审批/周期、提醒、正式身份"]
  ];
  items.forEach((it, i) => {
    const x = 0.5 + (i % 5) * 2.5;
    card(s, x, 1.5, 2.32, 4.9);
    s.addText(it[0], {
      x,
      y: 1.75,
      w: 2.32,
      h: 0.55,
      fontFace: FONT,
      fontSize: 22,
      color: BLUE,
      bold: true,
      align: "center"
    });
    s.addText(it[1], {
      x: x + 0.12,
      y: 2.45,
      w: 2.08,
      h: 0.7,
      fontFace: FONT,
      fontSize: 16,
      color: INK,
      bold: true,
      align: "center"
    });
    s.addText(it[2], {
      x: x + 0.16,
      y: 3.3,
      w: 2.0,
      h: 2.4,
      fontFace: FONT,
      fontSize: 13,
      color: BODY,
      align: "center"
    });
  });
  footer(s, 2);
}

// 3 问题
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "问题");
  addTitle(s, "会议室预定，一直缺一张「真占用」图");
  const pains = [
    ["看不见", "员工不知道哪间空、哪段被占，只能群里问、门口看。"],
    ["订不准", "口头占用、过期不放、重复预定，冲突靠事后协调。"],
    ["管不住", "房间主数据、设施、开放时间散落，停用/改名无法统一。"],
    ["端割裂", "PC 要看板，手机要轻操作，智信三端 WebView 不能各做一套。"]
  ];
  pains.forEach((p, i) => {
    const y = 1.4 + i * 1.35;
    card(s, 0.5, y, 12.3, 1.22);
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.7,
      y: y + 0.32,
      w: 0.1,
      h: 0.58,
      fill: { color: BLUE },
      rectRadius: 0.04
    });
    s.addText(p[0], {
      x: 1.05,
      y: y + 0.18,
      w: 2.4,
      h: 0.86,
      fontFace: FONT,
      fontSize: 18,
      color: INK,
      bold: true,
      valign: "middle"
    });
    s.addText(p[1], {
      x: 3.5,
      y: y + 0.18,
      w: 8.9,
      h: 0.86,
      fontFace: FONT,
      fontSize: 15,
      color: BODY,
      valign: "middle"
    });
  });
  footer(s, 3);
  s.addNotes("痛点对齐现场：群里抢会议室、门口贴纸条。我们的解法是同一张占用图，PC 看板 + 移动点选，服务端强制不重叠。");
}

// 4 目标
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "目标");
  addTitle(s, "一次交付：能管、能订、能释放、企业隔离");
  const goals = [
    ["管理员", "会议室 CRUD、启停、建筑/设施字典（引用保护、改名回写）。"],
    ["员工 PC", "时间轴看板，30 分钟粒度拖选，看占用、订、提前释放。"],
    ["员工移动", "列表 + 迷你时间条，弹层完成筛选、预定、我的预定。"],
    ["服务端", "启用房间、开放时间、不可订过去、提前天数、占用事务不重叠。"]
  ];
  goals.forEach((g, i) => {
    const x = 0.5 + (i % 2) * 6.4;
    const y = 1.45 + Math.floor(i / 2) * 2.55;
    card(s, x, y, 6.15, 2.35);
    s.addText(String(i + 1).padStart(2, "0"), {
      x: x + 0.28,
      y: y + 0.28,
      w: 1.2,
      h: 0.4,
      fontFace: FONT,
      fontSize: 14,
      color: BLUE,
      bold: true
    });
    s.addText(g[0], {
      x: x + 0.28,
      y: y + 0.7,
      w: 5.5,
      h: 0.45,
      fontFace: FONT,
      fontSize: 20,
      color: INK,
      bold: true
    });
    s.addText(g[1], {
      x: x + 0.28,
      y: y + 1.2,
      w: 5.55,
      h: 0.85,
      fontFace: FONT,
      fontSize: 14,
      color: BODY
    });
  });
  footer(s, 4);
}

// 5 架构
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "架构");
  addTitle(s, "三入口前端 + 一套 /meetingApi");
  const boxes = [
    { t: "main", d: "独立浏览器\n/meeting/", sub: "看板 + 管理" },
    { t: "zx", d: "PC WebView\n/meeting/zx/", sub: "看板 + 管理" },
    { t: "m", d: "iOS / 安卓\n/meeting/m/", sub: "仅预定弹层" }
  ];
  boxes.forEach((b, i) => {
    const x = 0.5 + i * 4.2;
    card(s, x, 1.4, 3.95, 2.15);
    s.addText(b.t, {
      x,
      y: 1.52,
      w: 3.95,
      h: 0.45,
      fontFace: FONT,
      fontSize: 18,
      color: BLUE,
      bold: true,
      align: "center"
    });
    s.addText(b.d, {
      x: x + 0.15,
      y: 1.95,
      w: 3.65,
      h: 0.85,
      fontFace: FONT,
      fontSize: 13,
      color: BODY,
      align: "center"
    });
    s.addText(b.sub, {
      x,
      y: 2.85,
      w: 3.95,
      h: 0.45,
      fontFace: FONT,
      fontSize: 13,
      color: INK,
      bold: true,
      align: "center"
    });
  });
  card(s, 0.5, 3.8, 12.3, 3.05);
  s.addText("请求链路", {
    x: 0.75,
    y: 3.95,
    w: 4,
    h: 0.35,
    fontFace: FONT,
    fontSize: 14,
    color: MUTE,
    bold: true
  });
  s.addText(
    "pages 薄封装  →  features/admin | booking | demo  →  server/module/*.js  →  axios /meetingApi\nHono：/health 无头；读看板要 zxCorpId；写预定要企业+用户；写房间/字典要管理员白名单\n身份：URL query → bootstrapAuthFromUrl → sessionStorage → 请求头（后端本期不验 JWT）",
    {
      x: 0.75,
      y: 4.4,
      w: 11.8,
      h: 2.15,
      fontFace: FONT,
      fontSize: 14,
      color: INK
    }
  );
  footer(s, 5);
}

// 6 预定
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "预定端");
  addTitle(s, "同一套占用规则，两套交互");
  const cols = [
    ["PC 时间轴", ["00:00–24:00 全天轴", "拖选后确认再填主题", "筛选：地点 / 人数 / 设施", "管理员入口「会议室管理」"]],
    ["移动预定", ["迷你条 07:00–23:00", "底栏「预定」直达表单", "详情 / 占用 / 我的预定均为弹层", "m 入口无管理路由"]],
    ["共同能力", ["14 天日期轴（上海时区）", "30 分钟对齐，半开区间", "我的预定：进行中 / 待开始", "主持人可提前释放"]]
  ];
  cols.forEach((c, i) => {
    const x = 0.5 + i * 4.2;
    card(s, x, 1.4, 4.0, 5.4);
    s.addShape(pptx.ShapeType.rect, { x, y: 1.4, w: 4.0, h: 0.08, fill: { color: BLUE } });
    s.addText(c[0], {
      x: x + 0.22,
      y: 1.65,
      w: 3.56,
      h: 0.5,
      fontFace: FONT,
      fontSize: 18,
      color: INK,
      bold: true
    });
    c[1].forEach((line, j) => {
      s.addText("·  " + line, {
        x: x + 0.22,
        y: 2.35 + j * 0.85,
        w: 3.56,
        h: 0.75,
        fontFace: FONT,
        fontSize: 14,
        color: BODY
      });
    });
  });
  footer(s, 6);
}

// 7 管理
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "管理端");
  addTitle(s, "房间主数据 + 字典，白名单才能进");
  const rows = [
    ["会议室", "名称、建筑、楼层 1–20、容量、设施、开放时间、提前天数、启停"],
    ["字典", "建筑 / 设施；有引用不可删；改名回写房间；停用后表单不再出现"],
    ["权限", "MEETING_ADMIN_USER_IDS 精确匹配 userId；空名单 = 无人是管理员"],
    ["预定历史", "管理员可查本企业预定；员工仅释放自己的未结束占用"]
  ];
  rows.forEach((r, i) => {
    const y = 1.4 + i * 1.35;
    card(s, 0.5, y, 12.3, 1.22);
    s.addText(r[0], {
      x: 0.8,
      y: y + 0.2,
      w: 2.4,
      h: 0.82,
      fontFace: FONT,
      fontSize: 18,
      color: BLUE,
      bold: true,
      valign: "middle"
    });
    s.addText(r[1], {
      x: 3.4,
      y: y + 0.2,
      w: 9.0,
      h: 0.82,
      fontFace: FONT,
      fontSize: 15,
      color: BODY,
      valign: "middle"
    });
  });
  footer(s, 7);
}

// 8 规则
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "业务规则");
  addTitle(s, "冲突在库里挡，不靠前端运气");
  const rules = [
    { n: "30′", t: "粒度", d: "对齐 30 分钟，最短 30 分钟，区间 [start, end)" },
    { n: "Tx", t: "占用", d: "查重叠与插入同一事务，并发订同一空档后到者失败" },
    { n: "TZ", t: "时区", d: "一律 Asia/Shanghai 墙钟，不用 UTC 日期直接比" },
    { n: "Corp", t: "隔离", d: "corp_id 贯穿；跨企业 id 统一「不存在」" }
  ];
  rules.forEach((r, i) => {
    const x = 0.5 + i * 3.15;
    card(s, x, 1.4, 3.0, 3.35);
    s.addText(r.n, {
      x,
      y: 1.65,
      w: 3.0,
      h: 0.7,
      fontFace: FONT,
      fontSize: 22,
      color: BLUE,
      bold: true,
      align: "center"
    });
    s.addText(r.t, {
      x,
      y: 2.4,
      w: 3.0,
      h: 0.45,
      fontFace: FONT,
      fontSize: 16,
      color: INK,
      bold: true,
      align: "center"
    });
    s.addText(r.d, {
      x: x + 0.18,
      y: 2.95,
      w: 2.64,
      h: 1.5,
      fontFace: FONT,
      fontSize: 13,
      color: BODY,
      align: "center"
    });
  });
  card(s, 0.5, 4.95, 12.3, 1.85);
  s.addText(
    "服务端还会拒绝：已停用房间、不在开放时间、今天已过的格子、超出提前天数（7/30/90/180）。前端 Toast 对齐同一套中文文案。",
    {
      x: 0.75,
      y: 5.2,
      w: 11.8,
      h: 1.35,
      fontFace: FONT,
      fontSize: 15,
      color: INK,
      valign: "middle"
    }
  );
  footer(s, 8);
}

// 9 助手
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "对话助手");
  addTitle(s, "用自然语言找空档，确认后再落库");
  const steps = [
    ["建议", "GET /agent/suggestions\n根据占用生成可点快捷句"],
    ["对话", "POST /agent/turn SSE\n接 LLM，受频控与密钥配置"],
    ["确认", "选时段 / 填主题\n走与看板相同的预定校验"],
    ["落库", "同一套 booking 事务\n助手不能绕过占用规则"]
  ];
  steps.forEach((st, i) => {
    const x = 0.5 + i * 3.15;
    card(s, x, 1.45, 3.0, 3.5);
    s.addText(String(i + 1), {
      x,
      y: 1.65,
      w: 3.0,
      h: 0.4,
      fontFace: FONT,
      fontSize: 13,
      color: BLUE,
      bold: true,
      align: "center"
    });
    s.addText(st[0], {
      x,
      y: 2.1,
      w: 3.0,
      h: 0.5,
      fontFace: FONT,
      fontSize: 20,
      color: INK,
      bold: true,
      align: "center"
    });
    s.addText(st[1], {
      x: x + 0.2,
      y: 2.75,
      w: 2.6,
      h: 1.85,
      fontFace: FONT,
      fontSize: 13,
      color: BODY,
      align: "center"
    });
  });
  s.addText("未配置 MEETING_LLM_* 时助手不可用，预定主路径不受影响。", {
    x: 0.5,
    y: 5.15,
    w: 12.3,
    h: 0.4,
    fontFace: FONT,
    fontSize: 14,
    color: MUTE
  });
  footer(s, 9);
  s.addNotes("演示：可以说「明天下午四人小会议室」。强调助手只是入口，最终写入仍走预订领域校验。");
}

// 10 演示
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "演示与身份");
  addTitle(s, "本地选人门户；生产由智信带参进入");
  card(s, 0.5, 1.4, 6.15, 5.4);
  s.addText("演示企业", {
    x: 0.75,
    y: 1.6,
    w: 5.6,
    h: 0.4,
    fontFace: FONT,
    fontSize: 16,
    color: INK,
    bold: true
  });
  s.addText(
    "智信科技  zx-001\n李明（管理员）/ 张伟 / 王芳\n\n示例集团  acme-001\n赵强（管理员）/ 陈晨\n\n两家种子房间互不可见；启动时空库才写入。",
    {
      x: 0.75,
      y: 2.15,
      w: 5.6,
      h: 4.3,
      fontFace: FONT,
      fontSize: 14,
      color: BODY
    }
  );
  card(s, 6.85, 1.4, 6.0, 5.4);
  s.addText("身份流", {
    x: 7.1,
    y: 1.6,
    w: 5.5,
    h: 0.4,
    fontFace: FONT,
    fontSize: 16,
    color: INK,
    bold: true
  });
  s.addText(
    "无 corpId / userId → 演示首页\n点击用户 → 拼 query 进当前入口\nbootstrapAuthFromUrl 落盘并剥参\n「切换用户」清身份回门户\n智信带齐参数时不出现演示页",
    {
      x: 7.1,
      y: 2.15,
      w: 5.5,
      h: 4.3,
      fontFace: FONT,
      fontSize: 14,
      color: BODY
    }
  );
  footer(s, 10);
}

// 11 技术栈
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "工程");
  addTitle(s, "pnpm workspace，部署 base 固定 /meeting/");
  const stack = [
    ["前端", "Vue 3 + Vite 7 MPA · UnoCSS · Element Plus / Vant 按需"],
    ["后端", "Hono + TypeScript · better-sqlite3 WAL · 端口 3100"],
    ["身份", "query / 头：corpId、userId、userName、dept；不引入 Pinia"],
    ["质量", "server 单测 + web node:test · 构建含 tsc / vue-tsc · Prettier"]
  ];
  stack.forEach((row, i) => {
    const y = 1.4 + i * 1.3;
    card(s, 0.5, y, 12.3, 1.15);
    s.addText(row[0], {
      x: 0.8,
      y: y + 0.18,
      w: 1.8,
      h: 0.8,
      fontFace: FONT,
      fontSize: 16,
      color: BLUE,
      bold: true,
      valign: "middle"
    });
    s.addText(row[1], {
      x: 2.8,
      y: y + 0.18,
      w: 9.6,
      h: 0.8,
      fontFace: FONT,
      fontSize: 16,
      color: INK,
      valign: "middle"
    });
  });
  footer(s, 11);
}

// 12 进度
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "进度");
  addTitle(s, "本期已交付 vs 明确不做");
  card(s, 0.5, 1.4, 6.15, 5.4);
  s.addText("已交付", {
    x: 0.75,
    y: 1.6,
    w: 5.6,
    h: 0.4,
    fontFace: FONT,
    fontSize: 16,
    color: SUCCESS,
    bold: true
  });
  s.addText(
    "· 房间 / 字典管理与引用保护\n· PC 看板 + 移动预定 + 释放\n· 占用事务与全套校验文案\n· 管理员预定查询与审计\n· 对话助手（可配置关闭）\n· 多企业演示种子与选人首页\n· 三入口同步、/meeting/ 部署",
    {
      x: 0.75,
      y: 2.15,
      w: 5.6,
      h: 4.3,
      fontFace: FONT,
      fontSize: 14,
      color: INK
    }
  );
  card(s, 6.85, 1.4, 6.0, 5.4);
  s.addText("明确不做（本期）", {
    x: 7.1,
    y: 1.6,
    w: 5.5,
    h: 0.4,
    fontFace: FONT,
    fontSize: 16,
    color: WARN,
    bold: true
  });
  s.addText(
    "· JWT 验签 / JSBridge 完整接入\n· 审批流、周期会议、抢占\n· 参会人、日历邀请、提醒推送\n· 多实例共享同一 SQLite\n· 物理删除会议室\n· 钉钉硬件 / 真实投屏\n· 移动端管理界面",
    {
      x: 7.1,
      y: 2.15,
      w: 5.5,
      h: 4.3,
      fontFace: FONT,
      fontSize: 14,
      color: INK
    }
  );
  footer(s, 12);
}

// 13 下一步
{
  const s = pptx.addSlide();
  bg(s);
  addKicker(s, "下一步");
  addTitle(s, "建议按「身份 → 协同 → 规模」排期");
  const next = [
    ["P1 身份", "智信入口正式带参验收；管理白名单与组织对齐；助手密钥走配置中心。"],
    ["P2 协同", "审批开关真正跑起来；周期预定展开；开始前 15 分钟提醒落地。"],
    ["P3 规模", "若多实例：SQLite 迁出或只读副本；审计与用量可观测。"]
  ];
  next.forEach((n, i) => {
    const y = 1.4 + i * 1.75;
    card(s, 0.5, y, 12.3, 1.6);
    s.addText(n[0], {
      x: 0.8,
      y: y + 0.2,
      w: 2.4,
      h: 1.2,
      fontFace: FONT,
      fontSize: 18,
      color: BLUE,
      bold: true,
      valign: "middle"
    });
    s.addText(n[1], {
      x: 3.4,
      y: y + 0.2,
      w: 9.0,
      h: 1.2,
      fontFace: FONT,
      fontSize: 16,
      color: BODY,
      valign: "middle"
    });
  });
  footer(s, 13);
}

// 14 结束
{
  const s = pptx.addSlide();
  bg(s, CANVAS);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: H, fill: { color: BLUE } });
  s.addText("谢谢", {
    x: 0.7,
    y: 2.2,
    w: 12,
    h: 0.9,
    fontFace: FONT,
    fontSize: 44,
    color: INK,
    bold: true
  });
  s.addText("欢迎现场走查：演示首页选人 → PC 看板拖选 → 移动预定 → 管理端改字典", {
    x: 0.7,
    y: 3.2,
    w: 11.5,
    h: 0.7,
    fontFace: FONT,
    fontSize: 16,
    color: BODY
  });
  s.addText("本地：pnpm dev    ·    看板 /meeting/    ·    API /meetingApi", {
    x: 0.7,
    y: 4.15,
    w: 11.5,
    h: 0.4,
    fontFace: FONT,
    fontSize: 14,
    color: MUTE
  });
  s.addText("Q & A", {
    x: 0.7,
    y: 6.4,
    w: 6,
    h: 0.4,
    fontFace: FONT,
    fontSize: 18,
    color: BLUE,
    bold: true
  });
}

mkdirSync(__dirname, { recursive: true });
await pptx.writeFile({ fileName: outFile });
console.log("wrote", outFile);
