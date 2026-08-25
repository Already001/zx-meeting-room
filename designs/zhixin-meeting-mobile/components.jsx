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
    <div>
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

      {/* Visual Color Status Legend */}
      <div className="timeline-legend-bar">
        <span>时段状态 (08:00 - 22:00)</span>
        <div className="legend-items-group">
          <div className="legend-item">
            <span className="legend-indicator free" />
            <span>空闲</span>
          </div>
          <div className="legend-item">
            <span className="legend-indicator busy" />
            <span>已占用</span>
          </div>
          <div className="legend-item">
            <span className="legend-indicator selected" />
            <span>已选</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Room List with Timeline Card
const MobileRoomCard = ({ room, onSelectSlot, onOpenDetail, onStartBooking, selectedSlots }) => {
  const isSelectedRoom = selectedSlots && selectedSlots.roomId === room.id;
  const [activeBusyEvent, setActiveBusyEvent] = React.useState(null);

  // Derive total busy slots
  const allBusySlots = React.useMemo(() => {
    const slots = [];
    (room.busyEvents || []).forEach(evt => {
      slots.push(...evt.slots);
    });
    return slots;
  }, [room.busyEvents]);

  // Check occupancy summary
  const totalSlotsCount = window.HALF_HOUR_COUNT || 28;
  const busyCount = allBusySlots.length;
  const isFullyBooked = busyCount >= 20;
  const isFreeNow = !allBusySlots.includes(4); // e.g. 10:00 slot

  // Format current selection range text
  const selectionTimeText = React.useMemo(() => {
    if (!isSelectedRoom || !selectedSlots.slots || selectedSlots.slots.length === 0) return null;
    const sorted = [...selectedSlots.slots].sort((a,b) => a-b);
    const first = window.getSlotTimeRange(sorted[0]);
    const last = window.getSlotTimeRange(sorted[sorted.length - 1]);
    const hours = (sorted.length * 0.5).toFixed(1).replace(".0", "");
    return `${first.start} - ${last.end} (共 ${hours} 小时)`;
  }, [isSelectedRoom, selectedSlots]);

  return (
    <div className="room-timeline-card">
      {/* Header Info */}
      <div className="room-card-header">
        <div>
          <div className="room-name-title">
            <span>{room.name}</span>
            {room.needApproval && (
              <span className="room-tag" style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
                需审批
              </span>
            )}
            <span className={`room-status-badge ${isFullyBooked ? 'busy' : isFreeNow ? 'free' : 'approving'}`}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
              {isFullyBooked ? "今日爆满" : isFreeNow ? "当前空闲" : "使用中"}
            </span>
          </div>

          <div className="room-card-sub">
            <window.IconLocation />
            <span>{room.building} {room.floor} · 容纳 {room.capacity} 人</span>
          </div>

          <div className="room-facilities-pills">
            {room.facilities.map(f => (
              <span key={f} className="facility-pill">{f}</span>
            ))}
          </div>
        </div>

        <button 
          className="navbar-action" 
          style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 500 }}
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
          <span>11:30</span>
          <span>15:00</span>
          <span>18:30</span>
          <span>22:00</span>
        </div>

        <div className="timeline-track-rail">
          {Array.from({ length: totalSlotsCount }).map((_, idx) => {
            const busyEvent = (room.busyEvents || []).find(e => e.slots.includes(idx));
            const isBusy = Boolean(busyEvent);
            const isSelected = isSelectedRoom && selectedSlots.slots.includes(idx);
            const timeInfo = window.getSlotTimeRange(idx);

            return (
              <div
                key={idx}
                className={`timeline-cell ${isBusy ? "busy" : isSelected ? "selected" : "free"}`}
                onClick={() => {
                  if (isBusy) {
                    // Show who is occupying this slot
                    setActiveBusyEvent(prev => prev && prev.title === busyEvent.title ? null : busyEvent);
                  } else {
                    setActiveBusyEvent(null);
                    onSelectSlot(room, idx);
                  }
                }}
                title={isBusy ? `占用：${busyEvent.title} (${busyEvent.start}-${busyEvent.end})` : `可预定：${timeInfo.start}-${timeInfo.end}`}
              />
            );
          })}
        </div>

        {/* Dynamic Occupancy Inspector Tooltip */}
        {activeBusyEvent && (
          <div className="occupancy-preview-bubble">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <window.IconClock />
              <span><strong>{activeBusyEvent.start}-{activeBusyEvent.end}</strong> 已被「{activeBusyEvent.title}」占用</span>
            </div>
            <span style={{ opacity: 0.85, fontSize: 11 }}>发起人: {activeBusyEvent.host}</span>
          </div>
        )}

        {/* Current Active Selection Summary */}
        {isSelectedRoom && selectionTimeText && (
          <div className="selection-quick-summary" style={{ flexWrap: 'wrap', gap: '4px' }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB", flexShrink: 0 }} />
              <span>已选时段：<strong>{selectionTimeText}</strong></span>
            </div>
            <span style={{ fontWeight: 600, color: "#2563EB", cursor: "pointer", marginLeft: "auto" }} onClick={(e) => {
            e.stopPropagation();
            if (onStartBooking) onStartBooking(room);
          }}>
            去预定 →
          </span>
          </div>
        )}
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
        <div className="sheet-drag-handle" />
        <div className="sheet-header">
          <span className="sheet-title">会议室详情</span>
          <button className="navbar-action" onClick={onClose}>关闭</button>
        </div>

        <div className="sheet-body">
          <div className="form-group-card">
            <div className="form-cell">
              <span className="form-cell-label">会议室名称</span>
              <span className="form-cell-value" style={{ fontWeight: 700 }}>{room.name}</span>
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
              <span className="form-cell-label">门牌/位置指引</span>
              <span className="form-cell-value">{room.locationNote || "无"}</span>
            </div>
          </div>

          <div style={{ fontSize: 13, color: "#64748B", margin: "14px 4px 6px", fontWeight: 600 }}>设备设施</div>
          <div className="form-group-card">
            <div className="form-cell">
              <span className="form-cell-label">支持设备</span>
              <span className="form-cell-value">{room.facilities.join("、")}</span>
            </div>
          </div>

          <div style={{ fontSize: 13, color: "#64748B", margin: "14px 4px 6px", fontWeight: 600 }}>预定与占用规则</div>
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

  const timeStr = React.useMemo(() => {
    if (!selectedSlots || !selectedSlots.slots || selectedSlots.slots.length === 0) return "10:00 - 11:30";
    const sorted = [...selectedSlots.slots].sort((a,b) => a-b);
    const first = window.getSlotTimeRange(sorted[0]);
    const last = window.getSlotTimeRange(sorted[sorted.length - 1]);
    return `${first.start} - ${last.end}`;
  }, [selectedSlots]);

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
        <div className="sheet-drag-handle" />
        <div className="sheet-header">
          <button className="navbar-action" onClick={onClose} style={{ color: "#64748B" }}>取消</button>
          <span className="sheet-title">新建日程预定</span>
          <button className="navbar-action" onClick={handleSubmit} style={{ fontWeight: 700 }}>完成</button>
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
                style={{ fontSize: 16, fontWeight: 600 }}
              />
            </div>
          </div>

          <div className="form-group-card">
            <div className="form-cell">
              <span className="form-cell-label">会议室</span>
              <span className="form-cell-value" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                {room.name} ({room.building} {room.floor})
              </span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">预定时段</span>
              <span className="form-cell-value" style={{ fontWeight: 600, color: "#1E40AF" }}>
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
    <div className="bookings-grid">
      {bookings.length === 0 ? (
        <div style={{ padding: "80px 0", textAlign: "center", color: "#94A3B8" }}>
          <window.IconCalendar />
          <div style={{ marginTop: 10, fontSize: 14 }}>暂无预定日程</div>
        </div>
      ) : (
        bookings.map(b => (
          <div key={b.id} className="room-timeline-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                {b.title}
              </div>
              <span 
                className="room-status-badge" 
                style={{ 
                  background: b.status === "ongoing" ? "#ECFDF5" : "#EFF6FF",
                  color: b.status === "ongoing" ? "#059669" : "#2563EB",
                  border: b.status === "ongoing" ? "1px solid #A7F3D0" : "1px solid #BFDBFE"
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                {b.status === "ongoing" ? "进行中" : "待开始"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "14px 0", fontSize: 13, color: "#475569" }}>
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

            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12, display: "flex", gap: 10 }}>
              <button 
                className="btn-m-danger" 
                onClick={() => onReleaseBooking(b)}
              >
                提前释放会议室
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
