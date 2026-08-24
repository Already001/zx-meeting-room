// Initial Mock Data for Mobile Reservation Flow

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
    // Busy slot indices (0 = 08:00-09:00, 1 = 09:00-10:00, ... 14 = 22:00-23:00)
    busySlots: [2, 3, 7, 8] // 10:00-12:00, 15:00-17:00
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
    busySlots: [0, 1, 5]
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
    busySlots: [4, 5, 6, 7]
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
    busySlots: [1, 2]
  }
];

window.TIME_SLOT_LABELS = [
  "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00"
];

window.INITIAL_MY_BOOKINGS = [
  {
    id: "booking-101",
    roomName: "1号会议室",
    roomId: "m-room-1",
    building: "奥城大厦",
    floor: "7层",
    title: "智能会议室移动端原型对齐会",
    date: "今天 08月24日",
    timeRange: "10:00 - 11:30",
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
    timeRange: "14:00 - 16:00",
    status: "upcoming",
    creator: "李明 (我)",
    members: ["李明", "全员产研"],
    statusText: "待开始"
  }
];
