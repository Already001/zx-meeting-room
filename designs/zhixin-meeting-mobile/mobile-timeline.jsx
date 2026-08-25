// 移动端会议室预定（对齐钉钉交互）
// 交互要点：横滑时间轴 + 轻点空闲时段选中 + 两端手柄拖拽调整 + 底部操作条确认

const M_DEFAULT_DURATION = 60;

// 日期条（钉钉 03 选择日期）
const MobileDateBar = ({ days, selectedDate, onSelectDate, onOpenCalendar }) => (
  <div className="m-datebar">
    <div className="m-datebar-scroll">
      {days.map(d => (
        <button
          type="button"
          key={d.value}
          className={`m-date-pill ${selectedDate === d.value ? "active" : ""}`}
          onClick={() => onSelectDate(d.value)}
        >
          <span className="m-date-week">{d.week}</span>
          <span className="m-date-day">{d.day}</span>
        </button>
      ))}
    </div>
    <button type="button" className="m-date-more" onClick={onOpenCalendar}>
      <window.IconCalendarSmall />
    </button>
  </div>
);

// 筛选条（钉钉 04 / 05 / 06）
const MobileFilterBar = ({ filters, onOpen }) => {
  const capacityLabel = window.CAPACITY_OPTIONS.find(c => c.id === filters.capacity);
  return (
    <div className="m-filterbar">
      <button
        type="button"
        className={`m-filter-chip ${filters.place !== "all" ? "active" : ""}`}
        onClick={() => onOpen("place")}
      >
        <span>{filters.place === "all" ? "建筑·楼层" : filters.place}</span>
        <window.IconCaretDown />
      </button>
      <button
        type="button"
        className={`m-filter-chip ${filters.capacity !== "all" ? "active" : ""}`}
        onClick={() => onOpen("capacity")}
      >
        <span>{filters.capacity === "all" ? "人数" : capacityLabel ? capacityLabel.label : "人数"}</span>
        <window.IconCaretDown />
      </button>
      <button
        type="button"
        className={`m-filter-chip ${filters.facilities.length > 0 ? "active" : ""}`}
        onClick={() => onOpen("facilities")}
      >
        <span>{filters.facilities.length > 0 ? `设施 ${filters.facilities.length}` : "设施"}</span>
        <window.IconCaretDown />
      </button>
    </div>
  );
};

// 筛选底部弹层
const MobileFilterSheet = ({ type, filters, places, onApply, onClose }) => {
  const [draft, setDraft] = React.useState(filters);

  const title = type === "place" ? "建筑 · 楼层" : type === "capacity" ? "容纳人数" : "设备设施";

  const toggleFacility = (name) => {
    setDraft(prev => ({
      ...prev,
      facilities: prev.facilities.includes(name)
        ? prev.facilities.filter(f => f !== name)
        : [...prev.facilities, name]
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-drag-handle" />
        <div className="sheet-header">
          <button type="button" className="navbar-action" onClick={onClose}>关闭</button>
          <span className="sheet-title">{title}</span>
          <span style={{ width: 40 }} />
        </div>

        <div className="sheet-body">
          {type === "place" && (
            <div className="m-option-list">
              {["all", ...places].map(p => (
                <button
                  type="button"
                  key={p}
                  className={`m-option-row ${draft.place === p ? "active" : ""}`}
                  onClick={() => setDraft(prev => ({ ...prev, place: p }))}
                >
                  <span>{p === "all" ? "全部建筑楼层" : p}</span>
                  {draft.place === p && <window.IconCheck />}
                </button>
              ))}
            </div>
          )}

          {type === "capacity" && (
            <div className="m-option-list">
              {window.CAPACITY_OPTIONS.map(c => (
                <button
                  type="button"
                  key={c.id}
                  className={`m-option-row ${draft.capacity === c.id ? "active" : ""}`}
                  onClick={() => setDraft(prev => ({ ...prev, capacity: c.id }))}
                >
                  <span>{c.label}</span>
                  {draft.capacity === c.id && <window.IconCheck />}
                </button>
              ))}
            </div>
          )}

          {type === "facilities" && (
            <div className="m-chip-grid">
              {window.FACILITY_OPTIONS.map(f => (
                <button
                  type="button"
                  key={f}
                  className={`m-chip ${draft.facilities.includes(f) ? "active" : ""}`}
                  onClick={() => toggleFacility(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sheet-footer">
          <button
            type="button"
            className="btn-m-default"
            onClick={() => setDraft({ place: "all", capacity: "all", facilities: [] })}
          >
            重置
          </button>
          <button type="button" className="btn-m-primary" onClick={() => onApply(draft)}>确定</button>
        </div>
      </div>
    </div>
  );
};

// 会议室行
const MobileRoomLane = ({ room, selection, nowMin, onTapTrack, onTapEvent, onOpenRoom, onHandleDown }) => {
  const isPicking = selection && selection.roomId === room.id;

  return (
    <div className="m-lane">
      <button type="button" className="m-lane-room" onClick={() => onOpenRoom(room)}>
        <span className="m-lane-name">
          <span className="m-lane-name-text">{room.name}</span>
          {room.favorite && <span className="m-lane-badge">常用</span>}
        </span>
        <span className="m-lane-meta">{room.capacity}人 · {room.facilities.join("/")}</span>
      </button>

      <div className="m-track" onClick={(e) => onTapTrack(room, e)}>
        {(room.busyEvents || []).map(ev => {
          const start = window.toMinutes(ev.start);
          const end = window.toMinutes(ev.end);
          return (
            <div
              key={`${room.id}-${ev.start}-${ev.title}`}
              className={`m-event ${ev.mine ? "mine" : ""}`}
              style={{ left: window.TL.pct(start), width: window.TL.pct(end - start) }}
              onClick={(e) => {
                e.stopPropagation();
                onTapEvent(room, ev);
              }}
            >
              <span className="m-event-title">{ev.mine ? "我的预定" : ev.host}</span>
            </div>
          );
        })}

        <span className="m-now-line" style={{ left: window.TL.pct(nowMin) }} />

        {isPicking && (
          <div
            className="m-picking"
            style={{ left: window.TL.pct(selection.start), width: window.TL.pct(selection.end - selection.start) }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="m-picking-label">
              {window.fromMinutes(selection.start)}-{window.fromMinutes(selection.end)}
            </span>
            <span
              className="m-handle m-handle-start"
              onPointerDown={(e) => onHandleDown(room, "start", e)}
            />
            <span
              className="m-handle m-handle-end"
              onPointerDown={(e) => onHandleDown(room, "end", e)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// 时间轴看板（钉钉 02 / 07）
const MobileTimelineBoard = ({ rooms, selection, setSelection, onTapEvent, onOpenRoom, onNotice }) => {
  const boardRef = React.useRef(null);
  const dragRef = React.useRef(null);

  const [nowMin, setNowMin] = React.useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 挂载时把视野落在当前时间附近，避免一进来只看到凌晨
  React.useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const track = board.querySelector(".m-track");
    if (!track) return;
    const focusMin = Math.max(0, nowMin - 60);
    board.scrollLeft = (focusMin / window.TL.DAY_MIN) * track.scrollWidth;
  }, []);

  const handleTapTrack = (room, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const minute = window.TL.minuteAt(rect, e.clientX);
    if (window.TL.isBusyAt(room, minute)) {
      onNotice("该时段已被预定");
      return;
    }
    const [low, high] = window.TL.freeBounds(room, minute);
    const start = Math.max(low, minute);
    const end = Math.min(high, start + M_DEFAULT_DURATION);
    if (end - start < window.TL.SNAP) {
      onNotice("剩余空闲不足 30 分钟");
      return;
    }
    setSelection({ roomId: room.id, start, end });
  };

  const handleHandleDown = (room, side, e) => {
    e.stopPropagation();
    const track = e.currentTarget.closest(".m-track");
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const anchor = Math.floor((selection.start + selection.end) / 2);
    const [low, high] = window.TL.freeBounds(room, anchor);
    dragRef.current = { room, side, rect, low, high };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const minute = window.TL.minuteAt(drag.rect, e.clientX);
    setSelection(prev => {
      if (!prev) return prev;
      if (drag.side === "start") {
        const start = Math.min(Math.max(drag.low, minute), prev.end - window.TL.SNAP);
        return { ...prev, start };
      }
      const end = Math.max(Math.min(drag.high, minute), prev.start + window.TL.SNAP);
      return { ...prev, end };
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      className="m-board"
      ref={boardRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="m-board-inner">
        <div className="m-lane m-axis-lane">
          <div className="m-lane-room m-axis-room">会议室</div>
          <div className="m-track m-axis">
            {window.TL.HOURS.map(h => (
              <span
                key={h}
                className={`m-axis-label ${h === 0 ? "first" : ""}`}
                style={{ left: window.TL.pct(h * 60) }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
            <span className="m-axis-now" style={{ left: window.TL.pct(nowMin) }}>
              {window.fromMinutes(nowMin)}
            </span>
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="m-empty">没有符合筛选条件的会议室</div>
        ) : (
          rooms.map(room => (
            <MobileRoomLane
              key={room.id}
              room={room}
              selection={selection}
              nowMin={nowMin}
              onTapTrack={handleTapTrack}
              onTapEvent={onTapEvent}
              onOpenRoom={onOpenRoom}
              onHandleDown={handleHandleDown}
            />
          ))
        )}
      </div>
    </div>
  );
};

// 选中时段后的底部操作条
const MobileSelectionBar = ({ room, selection, dateText, onCancel, onBook, onQuickDuration }) => {
  if (!room || !selection) return null;

  const [, high] = window.TL.freeBounds(room, Math.floor((selection.start + selection.end) / 2));
  const quickOptions = [30, 60, 120].filter(min => selection.start + min <= high);

  return (
    <div className="m-select-bar">
      <div className="m-select-room">{room.name}</div>
      <div className="m-select-time">
        {dateText} {window.fromMinutes(selection.start)}-{window.fromMinutes(selection.end)}
        <span className="m-select-dur">共 {window.TL.duration(selection.start, selection.end)}</span>
      </div>

      <div className="m-select-quick">
        {quickOptions.map(min => (
          <button
            type="button"
            key={min}
            className={`m-chip ${selection.end - selection.start === min ? "active" : ""}`}
            onClick={() => onQuickDuration(min)}
          >
            {min >= 60 ? `${min / 60}小时` : `${min}分钟`}
          </button>
        ))}
        <span className="m-select-hint">拖动两端可微调</span>
      </div>

      <div className="m-select-actions">
        <button type="button" className="btn-m-default" onClick={onCancel}>取消</button>
        <button type="button" className="btn-m-primary" onClick={onBook}>预定</button>
      </div>
    </div>
  );
};

// 已占用时段详情
const MobileOccupancySheet = ({ payload, onClose }) => {
  const { room, event } = payload;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-drag-handle" />
        <div className="sheet-header">
          <span className="sheet-title">该时段已被预定</span>
          <button type="button" className="navbar-action" onClick={onClose}>关闭</button>
        </div>
        <div className="sheet-body">
          <div className="form-group-card">
            <div className="form-cell">
              <span className="form-cell-label">会议主题</span>
              <span className="form-cell-value" style={{ fontWeight: 600 }}>{event.title}</span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">时间</span>
              <span className="form-cell-value">{event.start} - {event.end}</span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">会议室</span>
              <span className="form-cell-value">{room.name}（{room.building} {room.floor}）</span>
            </div>
            <div className="form-cell">
              <span className="form-cell-label">预定人</span>
              <span className="form-cell-value">{event.mine ? "我" : `${event.host} · ${event.dept}`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 通用二次确认（钉钉 14 释放会议室）
const MobileConfirmSheet = ({ payload, onCancel }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="m-action-sheet" onClick={e => e.stopPropagation()}>
        <div className="m-action-desc">
          <strong>{payload.title}</strong>
          <span>{payload.message}</span>
        </div>
        <button type="button" className="m-action-btn danger" onClick={payload.onConfirm}>
          {payload.confirmText}
        </button>
        <button type="button" className="m-action-btn" onClick={onCancel}>取消</button>
      </div>
    </div>
  );
};

Object.assign(window, {
  MobileDateBar,
  MobileFilterBar,
  MobileFilterSheet,
  MobileTimelineBoard,
  MobileSelectionBar,
  MobileOccupancySheet,
  MobileConfirmSheet
});
