// Mock Data
window.INITIAL_ROOMS = [
  {
    id: "room-1",
    name: "1号会议室",
    groupName: "高管会议区",
    buildingName: "奥城",
    floorName: "7层",
    capacity: 10,
    facilities: ["电视", "投影", "白板"],
    locationNote: "7层电梯口右转第一间",
    openStart: "07:00",
    openEnd: "23:00",
    bookAheadDays: 90,
    needApproval: false,
    allowRecurring: false,
    allowPreempt: false,
    enabled: true,
    createdAt: "2026-08-20T08:00:00.000Z",
    updatedAt: "2026-08-20T08:00:00.000Z"
  },
  {
    id: "room-2",
    name: "2号会议室",
    groupName: null,
    buildingName: "奥城",
    floorName: "7层",
    capacity: 6,
    facilities: ["电视"],
    locationNote: null,
    openStart: "08:30",
    openEnd: "21:00",
    bookAheadDays: 30,
    needApproval: false,
    allowRecurring: true,
    allowPreempt: false,
    enabled: true,
    createdAt: "2026-08-21T09:30:00.000Z",
    updatedAt: "2026-08-21T09:30:00.000Z"
  },
  {
    id: "room-3",
    name: "3号多功能路演厅",
    groupName: "公共空间",
    buildingName: "奥城",
    floorName: "8层",
    capacity: 50,
    facilities: ["电视", "投影", "白板"],
    locationNote: "配备双屏专业音响",
    openStart: "09:00",
    openEnd: "22:00",
    bookAheadDays: 180,
    needApproval: true,
    allowRecurring: false,
    allowPreempt: true,
    enabled: true,
    createdAt: "2026-08-22T10:15:00.000Z",
    updatedAt: "2026-08-22T10:15:00.000Z"
  },
  {
    id: "room-4",
    name: "4号头脑风暴室",
    groupName: "研发区",
    buildingName: "生态城",
    floorName: "3层",
    capacity: 8,
    facilities: ["白板"],
    locationNote: "墙面全白板",
    openStart: "07:00",
    openEnd: "23:00",
    bookAheadDays: 7,
    needApproval: false,
    allowRecurring: false,
    allowPreempt: false,
    enabled: false,
    createdAt: "2026-08-23T14:00:00.000Z",
    updatedAt: "2026-08-24T06:00:00.000Z"
  },
  {
    id: "room-5",
    name: "5号VIP接待室",
    groupName: "商务接待",
    buildingName: "生态城",
    floorName: "5层",
    capacity: 12,
    facilities: ["电视"],
    locationNote: "VIP专属，需提前申请门禁",
    openStart: "09:00",
    openEnd: "18:00",
    bookAheadDays: 90,
    needApproval: true,
    allowRecurring: false,
    allowPreempt: false,
    enabled: true,
    createdAt: "2026-08-23T16:20:00.000Z",
    updatedAt: "2026-08-23T16:20:00.000Z"
  }
];

window.DICT_TYPES = [
  { id: "building", label: "建筑" },
  { id: "facility", label: "设施" }
];

window.INITIAL_DICTS = [
  { id: "dict-b-1", type: "building", name: "奥城", sort: 1, enabled: true },
  { id: "dict-b-2", type: "building", name: "生态城", sort: 2, enabled: true },
  { id: "dict-f-1", type: "facility", name: "电视", sort: 1, enabled: true },
  { id: "dict-f-2", type: "facility", name: "白板", sort: 2, enabled: true },
  { id: "dict-f-3", type: "facility", name: "投影", sort: 3, enabled: true }
];

window.dictItems = (dicts, type, enabledOnly = true) =>
  (dicts || [])
    .filter(d => d.type === type && (!enabledOnly || d.enabled))
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN"));

window.dictNames = (dicts, type, enabledOnly = true) =>
  window.dictItems(dicts, type, enabledOnly).map(d => d.name);

window.formatFacilities = (facilities, dicts) => {
  const list = facilities || [];
  if (!list.length) return "—";
  const order = window.dictNames(dicts, "facility", false);
  const named = order.filter(f => list.includes(f));
  const extra = list.filter(f => !order.includes(f));
  return [...named, ...extra].join(" / ");
};

window.BOOK_AHEAD_OPTIONS = [
  { value: 7, label: "7 天" },
  { value: 30, label: "30 天" },
  { value: 90, label: "90 天（3个月内）" },
  { value: 180, label: "180 天（半年内）" }
];

window.FLOOR_OPTIONS = Array.from({ length: 20 }, (_, i) => `${i + 1}层`);
