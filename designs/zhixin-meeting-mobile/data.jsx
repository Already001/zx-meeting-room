// High Fidelity Mock Data for Mobile Reservation Flow

window.MOBILE_ROOMS = [
  {
    id: "m-room-1",
    name: "1号会议室",
    building: "奥城大厦",
    floor: "7层",
    capacity: 10,
    facilities: ["电视", "投影仪", "白板"],
    locationNote: "7层电梯口右转第一间",
    openTime: "07:00 - 23:00",
    needApproval: false,
    allowRecurring: true,
    // Busy meetings with detailed time and organizers (08:00 - 22:00 timeline)
    busyEvents: [
      { start: "10:00", end: "12:00", slots: [4, 5, 6, 7], title: "移动端体验对齐", host: "李明", dept: "产品设计部" },
      { start: "15:30", end: "17:30", slots: [15, 16, 17, 18], title: "前端核心架构评审", host: "张伟", dept: "技术研发中心" }
    ]
  },
  {
    id: "m-room-2",
    name: "2号会议室",
    building: "奥城大厦",
    floor: "7层",
    capacity: 6,
    facilities: ["电视", "电话"],
    locationNote: "7层走廊尽头",
    openTime: "08:30 - 21:00",
    needApproval: false,
    allowRecurring: true,
    busyEvents: [
      { start: "08:30", end: "10:00", slots: [1, 2, 3], title: "敏捷晨会", host: "王芳", dept: "业务一部" },
      { start: "14:00", end: "15:00", slots: [12, 13], title: "候选人面试", host: "陈主管", dept: "HR部" }
    ]
  },
  {
    id: "m-room-3",
    name: "3号多功能路演厅",
    building: "奥城大厦",
    floor: "8层",
    capacity: 50,
    facilities: ["电视", "投影仪", "白板", "视频会议"],
    locationNote: "8层东区大厅，配双屏",
    openTime: "09:00 - 22:00",
    needApproval: true,
    allowRecurring: false,
    busyEvents: [
      { start: "09:30", end: "12:30", slots: [3, 4, 5, 6, 7, 8], title: "Q3全员战略宣讲会", host: "刘总", dept: "管理层" },
      { start: "14:00", end: "18:00", slots: [12, 13, 14, 15, 16, 17, 18, 19], title: "华北区业务研讨大会", host: "赵总监", dept: "政企事业群" }
    ]
  },
  {
    id: "m-room-5",
    name: "5号VIP接待室",
    building: "科技园区B座",
    floor: "5层",
    capacity: 12,
    facilities: ["电视", "电话", "视频会议"],
    locationNote: "B座501",
    openTime: "09:00 - 18:00",
    needApproval: true,
    allowRecurring: false,
    busyEvents: [
      { start: "09:00", end: "11:00", slots: [2, 3, 4, 5], title: "重要商务客户接待", host: "王总", dept: "战略合作部" }
    ]
  }
];

// 28 half-hour slots: 08:00 - 22:00 (slot 0: 08:00-08:30, slot 1: 08:30-09:00, ... slot 27: 21:30-22:00)
window.HALF_HOUR_COUNT = 28;

window.getSlotTimeRange = (slotIdx) => {
  const startTotalMin = 8 * 60 + slotIdx * 30;
  const endTotalMin = startTotalMin + 30;
  const startH = String(Math.floor(startTotalMin / 60)).padStart(2, '0');
  const startM = String(startTotalMin % 60).padStart(2, '0');
  const endH = String(Math.floor(endTotalMin / 60)).padStart(2, '0');
  const endM = String(endTotalMin % 60).padStart(2, '0');
  return {
    start: `${startH}:${startM}`,
    end: `${endH}:${endM}`,
    label: `${startH}:${startM}`
  };
};

window.INITIAL_MY_BOOKINGS = [
  {
    id: "booking-101",
    roomName: "1号会议室",
    roomId: "m-room-1",
    building: "奥城大厦",
    floor: "7层",
    title: "智能会议室移动端原型对齐会",
    date: "今天 08月24日",
    timeRange: "10:00 - 12:00",
    status: "ongoing", // upcoming | ongoing | ended
    creator: "李明 (我)",
    members: ["李明", "张伟", "王芳", "陈工"],
    statusText: "进行中"
  },
  {
    id: "booking-102",
    roomName: "3号多功能路演厅",
    roomId: "m-room-3",
    building: "奥城大厦",
    floor: "8层",
    title: "Q3 业务架构技术评审",
    date: "明天 08月25日",
    timeRange: "14:00 - 18:00",
    status: "upcoming",
    creator: "李明 (我)",
    members: ["李明", "全员产研"],
    statusText: "待开始"
  }
];
