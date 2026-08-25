// 会议室详情 / 新建日程 / 我的预定（移动端与 PC 共用）

// 会议室详情（钉钉 08 基本信息 + 09 预定规则）
const MobileRoomDetailModal = ({ room, onClose, onBookNow }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-drag-handle" />
        <div className="sheet-header">
          <span className="sheet-title">会议室详情</span>
          <button type="button" className="navbar-action" onClick={onClose}>关闭</button>
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

          <div className="sheet-group-title">设备设施</div>
          <div className="form-group-card">
            <div className="form-cell">
              <span className="form-cell-label">支持设备</span>
              <span className="form-cell-value">{room.facilities.join("、")}</span>
            </div>
          </div>

          <div className="sheet-group-title">预定规则</div>
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
            <div className="form-cell">
              <span className="form-cell-label">周期预定</span>
              <span className="form-cell-value">{room.allowRecurring ? "支持" : "不支持"}</span>
            </div>
          </div>
        </div>

        {onBookNow && (
          <div className="sheet-footer">
            <button type="button" className="btn-m-primary" onClick={() => onBookNow(room)}>
              预定该会议室
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 新建日程（钉钉 10）
const MobileCreateScheduleModal = ({ room, rangeText, dateLabel, fullScreen, onClose, onSubmitSuccess }) => {
  const [title, setTitle] = React.useState("项目周会对齐");
  const [remarks, setRemarks] = React.useState("");

  const timeStr = rangeText || "10:00 - 11:30";
  const dateText = dateLabel || "今天 08-25";

  const handleSubmit = () => {
    onSubmitSuccess({
      id: "booking-" + Date.now(),
      roomName: room.name,
      roomId: room.id,
      building: room.building,
      floor: room.floor,
      title: title || "无主题会议",
      date: dateText,
      timeRange: timeStr,
      status: "upcoming",
      creator: "李明 (我)",
      members: ["李明 (我)", "张伟", "王芳"],
      statusText: "待开始"
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`bottom-sheet ${fullScreen ? "sheet-fullscreen" : ""}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="sheet-drag-handle" />
        <div className="sheet-header">
          <button type="button" className="navbar-action" onClick={onClose} style={{ color: "#64748B" }}>取消</button>
          <span className="sheet-title">新建日程</span>
          <button type="button" className="navbar-action" onClick={handleSubmit} style={{ fontWeight: 700 }}>完成</button>
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
                {room.name}（{room.building} {room.floor}）
              </span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">预定时段</span>
              <span className="form-cell-value" style={{ fontWeight: 600, color: "#1E40AF" }}>
                {dateText} · {timeStr}
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

          {room.needApproval && (
            <div className="sheet-note">该会议室需管理员审批，提交后等待审批通过。</div>
          )}
        </div>

        <div className="sheet-footer">
          <button type="button" className="btn-m-primary" onClick={handleSubmit}>
            提交预定
          </button>
        </div>
      </div>
    </div>
  );
};

// 我的预定（钉钉 13）+ 释放入口（钉钉 14）
const MobileMyBookingsView = ({ bookings, onReleaseBooking }) => (
  <div className="bookings-grid">
    {bookings.length === 0 ? (
      <div className="m-empty">暂无预定日程</div>
    ) : (
      bookings.map(b => (
        <div key={b.id} className="room-timeline-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{b.title}</div>
            <span
              className="room-status-badge"
              style={{
                background: b.status === "ongoing" ? "#ECFDF5" : "#EFF6FF",
                color: b.status === "ongoing" ? "#059669" : "#2563EB",
                border: b.status === "ongoing" ? "1px solid #A7F3D0" : "1px solid #BFDBFE"
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
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
              <span>{b.roomName}（{b.building} {b.floor}）</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <window.IconUser />
              <span>参会人员：{b.members.join("、")}</span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12, display: "flex", gap: 10 }}>
            <button type="button" className="btn-m-danger" onClick={() => onReleaseBooking(b)}>
              提前释放会议室
            </button>
          </div>
        </div>
      ))
    )}
  </div>
);

Object.assign(window, {
  MobileRoomDetailModal,
  MobileCreateScheduleModal,
  MobileMyBookingsView
});
