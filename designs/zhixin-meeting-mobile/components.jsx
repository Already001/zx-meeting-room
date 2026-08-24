// Mobile Prototype Views & Modals

// 1. Date Strip Component
const MobileDateStrip = ({ selectedDate, onSelectDate }) => {
  const days = [
    { day: "周一", date: "24", full: "2026-08-24", label: "今天" },
    { day: "周二", date: "25", full: "2026-08-25", label: "明天" },
    { day: "周三", date: "26", full: "2026-08-26", label: "后天" },
    { day: "周四", date: "27", full: "2026-08-27" },
    { day: "周五", date: "28", full: "2026-08-28" },
    { day: "周六", date: "29", full: "2026-08-29" },
    { day: "周日", date: "30", full: "2026-08-30" }
  ];

  return (
    <div className="date-strip">
      {days.map(d => {
        const isSelected = selectedDate === d.full;
        return (
          <div
            key={d.full}
            className={`date-pill ${isSelected ? "active" : ""}`}
            onClick={() => onSelectDate(d.full)}
          >
            <span className="date-day">{d.label || d.day}</span>
            <span className="date-num">{d.date}</span>
          </div>
        );
      })}
    </div>
  );
};

// 2. Filter Strip Component
const MobileFilterStrip = ({ filters, onOpenFilterModal }) => {
  return (
    <div className="filter-strip">
      <div 
        className={`filter-chip ${filters.building !== "all" ? "active" : ""}`}
        onClick={() => onOpenFilterModal("building")}
      >
        <span>{filters.building === "all" ? "建筑·楼层" : filters.building}</span>
        <window.IconFilter />
      </div>

      <div 
        className={`filter-chip ${filters.capacity !== "all" ? "active" : ""}`}
        onClick={() => onOpenFilterModal("capacity")}
      >
        <span>{filters.capacity === "all" ? "容纳人数" : filters.capacity}</span>
        <window.IconFilter />
      </div>

      <div 
        className={`filter-chip ${filters.facilities.length > 0 ? "active" : ""}`}
        onClick={() => onOpenFilterModal("facilities")}
      >
        <span>{filters.facilities.length > 0 ? `设施(${filters.facilities.length})` : "设备设施"}</span>
        <window.IconFilter />
      </div>
    </div>
  );
};

// 3. Room List with Timeline Card
const MobileRoomCard = ({ room, onSelectSlot, onOpenDetail, selectedSlots }) => {
  const isSelectedRoom = selectedSlots && selectedSlots.roomId === room.id;

  return (
    <div className="room-timeline-card">
      <div className="room-card-header">
        <div>
          <div className="room-name-title">
            <span>{room.name}</span>
            {room.needApproval && <span className="room-tag" style={{ background: '#FFF7E6', color: '#FA8C16' }}>需审批</span>}
          </div>
          <div className="room-card-sub">
            {room.building} {room.floor} · {room.capacity}人 · {room.facilities.join("/")}
          </div>
        </div>
        <button 
          className="navbar-action" 
          style={{ fontSize: 13 }}
          onClick={() => onOpenDetail(room)}
        >
          详情
          <window.IconChevronRight />
        </button>
      </div>

      {/* Visual Timeline Selection Grid */}
      <div className="timeline-scale-wrap">
        <div className="timeline-hours-axis">
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>23:00</span>
        </div>

        <div className="timeline-grid-slots">
          {Array.from({ length: 15 }).map((_, idx) => {
            const isBusy = room.busySlots.includes(idx);
            const isSelected = isSelectedRoom && selectedSlots.slots.includes(idx);

            return (
              <div
                key={idx}
                className={`timeline-slot ${isBusy ? "busy" : isSelected ? "selected" : "free"}`}
                onClick={() => {
                  if (!isBusy) {
                    onSelectSlot(room, idx);
                  }
                }}
                title={isBusy ? "已占用" : `可预定 (${8 + idx}:00 - ${9 + idx}:00)`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 4. Room Detail Sheet Modal (釘釘 08 / 09 对标)
const MobileRoomDetailModal = ({ room, isOpen, onClose, onBookNow }) => {
  if (!isOpen || !room) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-header">
          <span className="sheet-title">会议室详情</span>
          <button className="navbar-action" onClick={onClose}>关闭</button>
        </div>

        <div className="sheet-body">
          <div className="form-group-card">
            <div className="form-cell">
              <span className="form-cell-label">会议室名称</span>
              <span className="form-cell-value" style={{ fontWeight: 600 }}>{room.name}</span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">所在位置</span>
              <span className="form-cell-value">{room.building} {room.floor}</span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">容纳人数</span>
              <span className="form-cell-value">{room.capacity} 人</span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">门牌/备注</span>
              <span className="form-cell-value">{room.locationNote || "无"}</span>
            </div>
          </div>

          <div style={{ fontSize: 13, color: "var(--color-mute)", margin: "12px 4px 6px" }}>设备设施</div>
          <div className="form-group-card">
            <div className="form-cell">
              <span className="form-cell-label">支持设备</span>
              <span className="form-cell-value">{room.facilities.join("、")}</span>
            </div>
          </div>

          <div style={{ fontSize: 13, color: "var(--color-mute)", margin: "12px 4px 6px" }}>预定规则 (对标钉钉)</div>
          <div className="form-group-card">
            <div className="form-cell">
              <span className="form-cell-label">开放时间</span>
              <span className="form-cell-value">{room.openTime}</span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">最长提前</span>
              <span className="form-cell-value">90天内</span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">审批规则</span>
              <span className="form-cell-value">{room.needApproval ? "需管理员审批" : "免审批直接预定"}</span>
            </div>
          </div>
        </div>

        <div className="sheet-footer">
          <button className="btn-m-primary" onClick={() => onBookNow(room)}>
            立即预定此时段
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. Create Schedule / Booking Sheet (釘釘 10 / 11 新建日程)
const MobileCreateScheduleModal = ({ room, selectedSlots, isOpen, onClose, onSubmitSuccess }) => {
  if (!isOpen || !room) return null;

  const [title, setTitle] = React.useState("项目周会对齐");
  const [remarks, setRemarks] = React.useState("");

  const startHour = selectedSlots && selectedSlots.slots.length > 0 ? 8 + Math.min(...selectedSlots.slots) : 10;
  const endHour = selectedSlots && selectedSlots.slots.length > 0 ? 8 + Math.max(...selectedSlots.slots) + 1 : 11;
  const timeStr = `${String(startHour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`;

  const handleSubmit = () => {
    onSubmitSuccess({
      id: "booking-" + Date.now(),
      roomName: room.name,
      roomId: room.id,
      building: room.building,
      floor: room.floor,
      title: title || "无主题会议",
      date: "今天 08月24日",
      timeRange: timeStr,
      status: "upcoming",
      creator: "李明 (我)",
      members: ["李明 (我)", "张伟", "王芳"],
      statusText: "预定成功"
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()} style={{ height: "90%" }}>
        <div className="sheet-header">
          <button className="navbar-action" onClick={onClose} style={{ color: "var(--color-sub)" }}>取消</button>
          <span className="sheet-title">新建日程预定</span>
          <button className="navbar-action" onClick={handleSubmit} style={{ fontWeight: 600 }}>完成</button>
        </div>

        <div className="sheet-body">
          <div className="form-group-card">
            <div className="form-cell">
              <input
                type="text"
                className="form-input-text"
                placeholder="填写会议主题..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ fontSize: 16, fontWeight: 500 }}
              />
            </div>
          </div>

          <div className="form-group-card">
            <div className="form-cell">
              <span className="form-cell-label">会议室</span>
              <span className="form-cell-value" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                {room.name} ({room.building} {room.floor})
              </span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">预定时段</span>
              <span className="form-cell-value" style={{ fontWeight: 500 }}>
                今天 08-24 · {timeStr}
              </span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">参会人</span>
              <span className="form-cell-value">李明(发起人)、张伟、王芳 +</span>
            </div>
          </div>

          <div className="form-group-card">
            <div className="form-cell">
              <span className="form-cell-label">会议提醒</span>
              <span className="form-cell-value">开始前 15 分钟</span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">会议说明</span>
              <input
                type="text"
                className="form-input-text"
                placeholder="添加会议议程或备注"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                style={{ textAlign: "right" }}
              />
            </div>
          </div>
        </div>

        <div className="sheet-footer">
          <button className="btn-m-primary" onClick={handleSubmit}>
            确认并提交预定
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. My Bookings Tab & Release Flow (釘釘 13 / 14 我的预定 + 释放)
const MobileMyBookingsView = ({ bookings, onReleaseBooking }) => {
  return (
    <div style={{ padding: 12 }}>
      {bookings.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-mute)" }}>
          <window.IconCalendar />
          <div style={{ marginTop: 8, fontSize: 14 }}>暂无预定日程</div>
        </div>
      ) : (
        bookings.map(b => (
          <div key={b.id} className="form-group-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)" }}>
                {b.title}
              </div>
              <span 
                className="room-tag" 
                style={{ 
                  background: b.status === "ongoing" ? "#EAFAF3" : "#EBF2FF",
                  color: b.status === "ongoing" ? "#36D18E" : "#3E7EFF"
                }}
              >
                {b.status === "ongoing" ? "进行中" : "待开始"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "12px 0", fontSize: 13, color: "var(--color-sub)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <window.IconClock />
                <span>{b.date} {b.timeRange}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <window.IconLocation />
                <span>{b.roomName} ({b.building} {b.floor})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <window.IconUser />
                <span>参会人员：{b.members.join("、")}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--color-hairline)", paddingTop: 12, display: "flex", gap: 10 }}>
              <button 
                className="btn-m-danger" 
                style={{ height: 36, fontSize: 13 }}
                onClick={() => onReleaseBooking(b)}
              >
                提前释放
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

Object.assign(window, {
  MobileDateStrip,
  MobileFilterStrip,
  MobileRoomCard,
  MobileRoomDetailModal,
  MobileCreateScheduleModal,
  MobileMyBookingsView
});
