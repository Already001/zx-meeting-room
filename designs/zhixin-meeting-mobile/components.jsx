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
              <span className="form-cell-value" style={{ fontWeight: 500 }}>{room.name}</span>
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
          <button type="button" className="navbar-action" onClick={onClose} style={{ color: "var(--color-body)" }}>取消</button>
          <span className="sheet-title">新建日程</span>
          <button type="button" className="navbar-action" onClick={handleSubmit} style={{ fontWeight: 500 }}>完成</button>
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
                {room.name}（{room.building} {room.floor}）
              </span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">预定时段</span>
              <span className="form-cell-value" style={{ fontWeight: 500, color: "var(--color-primary)" }}>
                {dateText} · {timeStr}
              </span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">预定人</span>
              <span className="form-cell-value">李明</span>
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
          <button type="button" className="btn-m-primary" onClick={handleSubmit}>
            提交预定
          </button>
        </div>
      </div>
    </div>
  );
};

// 我的预定：弹窗列表 + 释放入口
const MobileMyBookingsModal = ({ bookings, onReleaseBooking, onClose }) => {
  React.useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bottom-sheet bookings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookings-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-drag-handle" />
        <div className="sheet-header">
          <span id="bookings-dialog-title" className="sheet-title">我的预定</span>
          <button type="button" className="navbar-action" onClick={onClose}>关闭</button>
        </div>
        <div className="sheet-body bookings-dialog-body">
          {bookings.length === 0 ? (
            <div className="bookings-empty">
              <span className="bookings-empty-title">暂无预定</span>
              <span className="bookings-empty-caption">在时间轴上拖选空闲时段即可预定</span>
            </div>
          ) : (
            <ul className="booking-list">
              {bookings.map((b) => (
                <li key={b.id} className="booking-row">
                  <div className="booking-row-main">
                    <div className="booking-row-head">
                      <span className="booking-row-title">{b.title}</span>
                      <span className={`room-status-badge ${b.status === "ongoing" ? "ongoing" : "upcoming"}`}>
                        {b.status === "ongoing" ? "进行中" : "待开始"}
                      </span>
                    </div>
                    <div className="booking-row-meta">{b.date} {b.timeRange}</div>
                    <div className="booking-row-meta">{b.roomName}（{b.building} {b.floor}）</div>
                  </div>
                  <button
                    type="button"
                    className="booking-release"
                    onClick={() => onReleaseBooking(b)}
                  >
                    释放
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  MobileRoomDetailModal,
  MobileCreateScheduleModal,
  MobileMyBookingsModal
});
