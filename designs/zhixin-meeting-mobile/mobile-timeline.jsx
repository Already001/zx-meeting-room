// 移动端会议室预定首页（对齐钉钉列表稿）
// 交互：搜索 + 日期/楼层/设施筛选 + 卡片 7–23 点迷你条点选时段

const M_DEFAULT_DURATION = 60;

const nextOpenMinute = (nowMin) => {
  const snapped = Math.ceil(nowMin / window.TL.SNAP) * window.TL.SNAP;
  return Math.max(window.TL.LIST_START, snapped);
};

const MobileHomeSearch = ({ value, onChange }) => (
  <label className="m-search">
    <window.IconSearch />
    <input
      type="search"
      value={value}
      placeholder="搜索会议室"
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

const MobileHomeFilterBar = ({ dateText, filters, onOpen, onReset }) => (
  <div className="m-home-filters">
    <div className="m-home-filters-scroll">
      <button type="button" className="m-filter-chip date" onClick={() => onOpen("date")}>
        <span>{dateText}</span>
        <window.IconCaretDown />
      </button>
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
        className={`m-filter-chip ${filters.facilities.length > 0 ? "active" : ""}`}
        onClick={() => onOpen("facilities")}
      >
        <span>{filters.facilities.length > 0 ? `设施 ${filters.facilities.length}` : "设施"}</span>
        <window.IconCaretDown />
      </button>
    </div>
    <button type="button" className="m-filter-reset" onClick={onReset}>重置</button>
  </div>
);

const MobileDateSheet = ({ days, selectedDate, onSelect, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
      <div className="sheet-drag-handle" />
      <div className="sheet-header">
        <button type="button" className="navbar-action" onClick={onClose}>关闭</button>
        <span className="sheet-title">选择日期</span>
        <span style={{ width: 40 }} />
      </div>
      <div className="sheet-body">
        <div className="m-option-list">
          {days.map(d => (
            <button
              type="button"
              key={d.value}
              className={`m-option-row ${selectedDate === d.value ? "active" : ""}`}
              onClick={() => onSelect(d.value)}
            >
              <span>{d.chip}{d.week === "今天" ? "（今天）" : d.week === "明天" ? "（明天）" : ""}</span>
              {selectedDate === d.value && <window.IconCheck />}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const MobileFilterSheet = ({ type, filters, places, onApply, onClose }) => {
  const [draft, setDraft] = React.useState(filters);
  const title = type === "place" ? "建筑 · 楼层" : "设备设施";

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
            onClick={() => setDraft({ ...draft, place: "all", facilities: [] })}
          >
            重置
          </button>
          <button type="button" className="btn-m-primary" onClick={() => onApply(draft)}>确定</button>
        </div>
      </div>
    </div>
  );
};

const MobileMoreSheet = ({ onOpenMine, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="m-action-sheet" onClick={e => e.stopPropagation()}>
      <button type="button" className="m-action-btn" onClick={onOpenMine}>我的预定</button>
      <button type="button" className="m-action-btn" onClick={onClose} style={{ marginTop: 8, borderRadius: 12 }}>
        取消
      </button>
    </div>
  </div>
);

const MobileMiniBar = ({ room, selection, nowMin, isToday, onTapTrack, onTapEvent }) => {
  const isPicking = selection && selection.roomId === room.id;
  const pastEnd = isToday ? Math.min(nowMin, window.TL.LIST_END) : window.TL.LIST_START;

  return (
    <div className="m-mini">
      <div className="m-mini-bar" onClick={(e) => onTapTrack(room, e)}>
        <div className="m-mini-track">
          {pastEnd > window.TL.LIST_START && (
            <span
              className="m-mini-past"
              style={{ left: window.TL.listPct(window.TL.LIST_START), width: window.TL.listWidth(window.TL.LIST_START, pastEnd) }}
            />
          )}
          {(room.busyEvents || []).map(ev => {
            const start = window.toMinutes(ev.start);
            const end = window.toMinutes(ev.end);
            if (end <= window.TL.LIST_START || start >= window.TL.LIST_END) return null;
            return (
              <span
                key={`${room.id}-${ev.start}-${ev.title}`}
                className={`m-mini-busy ${ev.mine ? "mine" : ""}`}
                style={{ left: window.TL.listPct(start), width: window.TL.listWidth(start, end) }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTapEvent(room, ev);
                }}
              />
            );
          })}
        </div>
        {isPicking && (
          <span
            className="m-mini-pick"
            style={{ left: window.TL.listPct(selection.start), width: window.TL.listWidth(selection.start, selection.end) }}
          />
        )}
      </div>
      <div className="m-mini-hours">
        {window.TL.LIST_HOURS.map(h => (
          <span key={h}>{h}</span>
        ))}
      </div>
    </div>
  );
};

const MobileRoomCard = ({ room, selection, nowMin, isToday, onTapTrack, onTapEvent, onOpenRoom, onNotice }) => (
  <article className="m-room-card">
    <div className="m-room-head">
      <button type="button" className="m-room-main" onClick={() => onOpenRoom(room)}>
        <span className="m-room-icon">
          <window.IconRoomTile />
        </span>
        <span className="m-room-copy">
          <span className="m-room-title-row">
            <span className="m-room-name">{room.name}</span>
            {room.favorite && <span className="m-room-badge">常用</span>}
          </span>
          <span className="m-room-meta">
            {room.capacity}人&nbsp;&nbsp;{room.facilities.join(" / ")}
          </span>
        </span>
      </button>
      <div className="m-room-hw">
        <button type="button" className="m-room-hw-btn" aria-label="电话" onClick={() => onNotice("硬件电话暂未接入")}>
          <window.IconPhone />
        </button>
        <button type="button" className="m-room-hw-btn" aria-label="投屏" onClick={() => onNotice("投屏暂未接入")}>
          <window.IconCast />
        </button>
      </div>
    </div>
    <MobileMiniBar
      room={room}
      selection={selection}
      nowMin={nowMin}
      isToday={isToday}
      onTapTrack={onTapTrack}
      onTapEvent={onTapEvent}
    />
  </article>
);

const MobileRoomList = ({ rooms, selection, setSelection, isToday, onTapEvent, onOpenRoom, onNotice }) => {
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

  const handleTapTrack = (room, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const minute = window.TL.minuteAtList(rect, e.clientX);
    const event = window.TL.eventAt(room, minute);
    if (event) {
      onTapEvent(room, event);
      return;
    }
    if (isToday && minute < nowMin) {
      onNotice("该时段已过期");
      return;
    }

    let [low, high] = window.TL.freeBounds(room, minute);
    low = Math.max(low, window.TL.LIST_START, isToday ? nextOpenMinute(nowMin) : window.TL.LIST_START);
    high = Math.min(high, window.TL.LIST_END);
    const start = Math.max(low, minute);
    const end = Math.min(high, start + M_DEFAULT_DURATION);
    if (end - start < window.TL.SNAP) {
      onNotice("剩余空闲不足 30 分钟");
      return;
    }
    setSelection({ roomId: room.id, start, end });
  };

  return (
    <div className="m-room-list">
      {rooms.length === 0 ? (
        <div className="m-empty">没有符合筛选条件的会议室</div>
      ) : (
        rooms.map(room => (
          <MobileRoomCard
            key={room.id}
            room={room}
            selection={selection}
            nowMin={nowMin}
            isToday={isToday}
            onTapTrack={handleTapTrack}
            onTapEvent={onTapEvent}
            onOpenRoom={onOpenRoom}
            onNotice={onNotice}
          />
        ))
      )}
    </div>
  );
};

const MobileSelectionBar = ({ room, selection, dateText, onCancel, onBook, onQuickDuration }) => {
  if (!room || !selection) return null;

  const [, high] = window.TL.freeBounds(room, Math.floor((selection.start + selection.end) / 2));
  const cappedHigh = Math.min(high, window.TL.LIST_END);
  const quickOptions = [30, 60, 120].filter(min => selection.start + min <= cappedHigh);

  return (
    <div className="m-select-bar">
      <div className="m-select-room">{room.name}</div>
      <div className="m-select-time">
        {dateText} {window.fromMinutes(selection.start)}-{window.fromMinutes(selection.end)}
        <span className="m-select-dur">共 {window.TL.duration(selection.start, selection.end)}</span>
      </div>

      {quickOptions.length > 0 && (
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
        </div>
      )}

      <div className="m-select-actions">
        <button type="button" className="btn-m-default" onClick={onCancel}>取消</button>
        <button type="button" className="btn-m-primary" onClick={onBook}>预定</button>
      </div>
    </div>
  );
};

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
  MobileHomeSearch,
  MobileHomeFilterBar,
  MobileDateSheet,
  MobileFilterSheet,
  MobileMoreSheet,
  MobileRoomList,
  MobileSelectionBar,
  MobileOccupancySheet,
  MobileConfirmSheet
});
