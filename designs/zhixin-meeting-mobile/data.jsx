// 会议室主数据 + 时间轴共享计算（PC 看板与移动端看板共用）

window.toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

window.fromMinutes = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const DAY_MIN = 1440;
const SNAP_MIN = 30;
const LIST_START = 7 * 60;
const LIST_END = 23 * 60;
const LIST_SPAN = LIST_END - LIST_START;

window.TL = {
  DAY_MIN,
  SNAP: SNAP_MIN,
  HOURS: Array.from({ length: 24 }, (_, i) => i),
  LIST_START,
  LIST_END,
  LIST_HOURS: Array.from({ length: 17 }, (_, i) => i + 7),

  clamp: (m) => Math.max(0, Math.min(DAY_MIN, m)),
  snap: (m) => window.TL.clamp(Math.round(m / SNAP_MIN) * SNAP_MIN),
  pct: (m) => `${(m / DAY_MIN) * 100}%`,

  // 移动端首页卡片：7:00–23:00 迷你条
  listPct: (m) => `${((Math.max(LIST_START, Math.min(LIST_END, m)) - LIST_START) / LIST_SPAN) * 100}%`,
  listWidth: (start, end) => {
    const s = Math.max(LIST_START, start);
    const e = Math.min(LIST_END, end);
    if (e <= s) return "0%";
    return `${((e - s) / LIST_SPAN) * 100}%`;
  },
  minuteAtList: (rect, clientX) => {
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return window.TL.snap(LIST_START + ratio * LIST_SPAN);
  },

  // 由指针位置换算成当天的分钟数
  minuteAt: (rect, clientX) => window.TL.snap(((clientX - rect.left) / rect.width) * DAY_MIN),

  duration: (start, end) => {
    const total = end - start;
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h && m) return `${h}小时 ${m} 分钟`;
    if (h) return `${h}小时`;
    return `${m} 分钟`;
  },

  eventAt: (room, minute) =>
    (room.busyEvents || []).find(
      ev => minute >= window.toMinutes(ev.start) && minute < window.toMinutes(ev.end)
    ) || null,

  isBusyAt: (room, minute) => Boolean(window.TL.eventAt(room, minute)),

  // 以 anchor 为中心找到最近的占用边界，选择区间不能跨过已占用时段
  freeBounds: (room, anchor) => {
    let low = 0;
    let high = DAY_MIN;
    (room.busyEvents || []).forEach(ev => {
      const s = window.toMinutes(ev.start);
      const e = window.toMinutes(ev.end);
      if (e <= anchor) low = Math.max(low, e);
      else if (s >= anchor) high = Math.min(high, s);
    });
    return [low, high];
  }
};

// 移动端 28 格（08:00-22:00）辅助，供旧数据结构兼容
window.HALF_HOUR_COUNT = 28;

const slotsBetween = (start, end) => {
  const from = Math.max(0, Math.floor((window.toMinutes(start) - 8 * 60) / 30));
  const to = Math.min(window.HALF_HOUR_COUNT, Math.ceil((window.toMinutes(end) - 8 * 60) / 30));
  const out = [];
  for (let i = from; i < to; i += 1) out.push(i);
  return out;
};

window.makeEvent = ({ start, end, title, host, dept, mine = false }) => ({
  start,
  end,
  title,
  host,
  dept,
  mine,
  slots: slotsBetween(start, end)
});

window.MOBILE_ROOMS = [
  {
    id: "m-room-1",
    name: "1号会议室",
    building: "奥城大厦",
    floor: "7层",
    capacity: 10,
    favorite: true,
    facilities: ["电视", "投影仪", "白板"],
    locationNote: "7层电梯口右转第一间",
    openTime: "07:00 - 23:00",
    needApproval: false,
    allowRecurring: true,
    busyEvents: [
      window.makeEvent({ start: "10:00", end: "12:00", title: "移动端体验对齐", host: "李厚霖", dept: "产品设计部" }),
      window.makeEvent({ start: "14:00", end: "17:30", title: "前端核心架构评审", host: "李厚霖", dept: "技术研发中心" })
    ]
  },
  {
    id: "m-room-2",
    name: "2号会议室",
    building: "奥城大厦",
    floor: "7层",
    capacity: 6,
    favorite: false,
    facilities: ["电视", "电话"],
    locationNote: "7层走廊尽头",
    openTime: "08:30 - 21:00",
    needApproval: false,
    allowRecurring: true,
    busyEvents: [
      window.makeEvent({ start: "08:30", end: "10:00", title: "敏捷晨会", host: "王芳", dept: "业务一部" }),
      window.makeEvent({ start: "14:00", end: "15:00", title: "候选人面试", host: "陈主管", dept: "HR部" }),
      window.makeEvent({ start: "19:00", end: "20:30", title: "版本发布值守", host: "李明", dept: "产品部", mine: true })
    ]
  },
  {
    id: "m-room-3",
    name: "3号多功能路演厅",
    building: "奥城大厦",
    floor: "8层",
    capacity: 50,
    favorite: false,
    facilities: ["电视", "投影仪", "白板", "视频会议"],
    locationNote: "8层东区大厅，配双屏",
    openTime: "09:00 - 22:00",
    needApproval: true,
    allowRecurring: false,
    busyEvents: [
      window.makeEvent({ start: "09:30", end: "12:30", title: "Q3全员战略宣讲会", host: "刘总", dept: "管理层" }),
      window.makeEvent({ start: "14:00", end: "18:00", title: "华北区业务研讨大会", host: "赵总监", dept: "政企事业群" })
    ]
  },
  {
    id: "m-room-5",
    name: "5号VIP接待室",
    building: "科技园区B座",
    floor: "5层",
    capacity: 12,
    favorite: true,
    facilities: ["电视", "电话", "视频会议"],
    locationNote: "B座501",
    openTime: "09:00 - 18:00",
    needApproval: true,
    allowRecurring: false,
    busyEvents: [
      window.makeEvent({ start: "09:00", end: "11:00", title: "重要商务客户接待", host: "王总", dept: "战略合作部" })
    ]
  }
];

window.FACILITY_OPTIONS = ["电视", "投影仪", "白板", "电话", "视频会议"];

window.CAPACITY_OPTIONS = [
  { id: "all", label: "不限" },
  { id: "1-6", label: "1-6人", min: 1, max: 6 },
  { id: "7-12", label: "7-12人", min: 7, max: 12 },
  { id: "13+", label: "13人以上", min: 13, max: 9999 }
];

window.INITIAL_MY_BOOKINGS = [
  {
    id: "booking-101",
    roomName: "1号会议室",
    roomId: "m-room-1",
    building: "奥城大厦",
    floor: "7层",
    title: "智能会议室移动端原型对齐会",
    date: "今天 08月25日",
    timeRange: "10:00 - 12:00",
    status: "ongoing",
    creator: "李明 (我)",
    members: ["李明", "张伟", "王芳", "陈工"],
    statusText: "进行中"
  },
  {
    id: "booking-102",
    roomName: "2号会议室",
    roomId: "m-room-2",
    building: "奥城大厦",
    floor: "7层",
    title: "版本发布值守",
    date: "今天 08月25日",
    timeRange: "19:00 - 20:30",
    status: "upcoming",
    creator: "李明 (我)",
    members: ["李明", "全员产研"],
    statusText: "待开始"
  }
];
