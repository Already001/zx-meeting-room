// PC 端 24 小时横向时间轴看板

// 当前时间指示线
const useNowMinutes = () => {
  const [now, setNow] = React.useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  React.useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
};

// 顶部双层工具栏
const PcToolbar = ({
  dateLabel,
  days,
  selectedDate,
  onSelectDate,
  onPrevDay,
  onNextDay,
  onToday,
  keyword,
  onKeyword,
  filters,
  places,
  onFilters,
  onReset,
  showHost,
  onToggleHost,
  showLegend,
  onToggleLegend,
  onOpenMine,
  onNotice
}) => {
  const [openMenu, setOpenMenu] = React.useState(null);

  React.useEffect(() => {
    if (!openMenu) return undefined;
    const onDown = () => setOpenMenu(null);
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [openMenu]);

  const toggleMenu = (name) => setOpenMenu(prev => (prev === name ? null : name));

  const placeLabel = filters.place === "all" ? "建筑 · 楼层" : filters.place;
  const facilityLabel = filters.facilities.length > 0 ? `设施 ${filters.facilities.length}` : "设施";

  const toggleFacility = (name) => {
    const next = filters.facilities.includes(name)
      ? filters.facilities.filter(f => f !== name)
      : [...filters.facilities, name];
    onFilters({ ...filters, facilities: next });
  };

  return (
  <div className="pc-toolbar">
    <div className="pc-toolbar-row">
      <button type="button" className="pc-select" onClick={() => onNotice("切换企业 / 组织")}>
        <span>Nic测试</span>
        <window.IconCaretDown />
      </button>

      <div className="pc-dropdown" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`pc-select pc-select-wide ${filters.place !== "all" ? "active" : ""}`}
          onClick={() => toggleMenu("place")}
        >
          <span className={filters.place === "all" ? "pc-select-placeholder" : ""}>{placeLabel}</span>
          <window.IconCaretDown />
        </button>
        {openMenu === "place" && (
          <div className="pc-menu">
            <button
              type="button"
              className={`pc-menu-item ${filters.place === "all" ? "active" : ""}`}
              onClick={() => {
                onFilters({ ...filters, place: "all" });
                setOpenMenu(null);
              }}
            >
              全部建筑楼层
            </button>
            {places.map(p => (
              <button
                type="button"
                key={p}
                className={`pc-menu-item ${filters.place === p ? "active" : ""}`}
                onClick={() => {
                  onFilters({ ...filters, place: p });
                  setOpenMenu(null);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pc-search">
        <window.IconSearch />
        <input
          type="text"
          placeholder="搜索会议室"
          value={keyword}
          onChange={(e) => onKeyword(e.target.value)}
        />
      </div>

      <div className="pc-dropdown" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`pc-select ${filters.facilities.length > 0 ? "active" : ""}`}
          onClick={() => toggleMenu("facilities")}
        >
          <span className={filters.facilities.length === 0 ? "pc-select-placeholder" : ""}>{facilityLabel}</span>
          <window.IconCaretDown />
        </button>
        {openMenu === "facilities" && (
          <div className="pc-menu pc-menu-wide">
            {window.FACILITY_OPTIONS.map(f => (
              <button
                type="button"
                key={f}
                className={`pc-menu-item ${filters.facilities.includes(f) ? "active" : ""}`}
                onClick={() => toggleFacility(f)}
              >
                <span>{f}</span>
                {filters.facilities.includes(f) && <window.IconCheck />}
              </button>
            ))}
          </div>
        )}
      </div>

      <button type="button" className="pc-text-btn" onClick={onReset}>重置</button>
      <button type="button" className="pc-icon-btn" title="刷新" onClick={() => onNotice("已刷新会议室占用")}>
        <window.IconRefresh />
      </button>
      <button type="button" className="pc-text-btn pc-toolbar-end" onClick={onOpenMine}>我的预定</button>
    </div>

    <div className="pc-toolbar-row pc-toolbar-row-sub">
      <div className="pc-dropdown" onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" className="pc-select pc-date-select" onClick={() => toggleMenu("date")}>
          <span>{dateLabel}</span>
          <window.IconCalendarSmall />
        </button>
        {openMenu === "date" && (
          <div className="pc-menu pc-menu-date">
            {days.map(d => (
              <button
                type="button"
                key={d.value}
                className={`pc-menu-item ${selectedDate === d.value ? "active" : ""}`}
                onClick={() => {
                  onSelectDate(d.value);
                  setOpenMenu(null);
                }}
              >
                {d.chip}{d.week === "今天" ? "（今天）" : d.week === "明天" ? "（明天）" : ""}
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button" className="pc-icon-btn" title="前一天" onClick={onPrevDay}>
        <window.IconArrowLeft />
      </button>
      <button type="button" className="pc-text-btn pc-today-btn" onClick={onToday}>回到今天</button>
      <button type="button" className="pc-icon-btn" title="后一天" onClick={onNextDay}>
        <window.IconArrowRight />
      </button>
      <button type="button" className="pc-select pc-select-narrow" disabled>
        <span>日</span>
      </button>

      <div className="pc-toolbar-end pc-toolbar-tools">
        <button type="button" className={`pc-tool-link ${showLegend ? "active" : ""}`} onClick={onToggleLegend}>
          <window.IconInfo />
          <span>颜色示意</span>
        </button>
        <button type="button" className={`pc-tool-link ${showHost ? "active" : ""}`} onClick={onToggleHost}>
          <window.IconEye />
          <span>显示预定人</span>
        </button>
        <button type="button" className="pc-tool-link" onClick={() => onNotice("跳转会议室管理端")}>
          <window.IconSettings />
          <span>会议室管理</span>
        </button>
      </div>
    </div>

    {showLegend && (
      <div className="pc-legend-row">
        <span className="pc-legend-item"><i className="pc-legend-dot free" />空闲可预定</span>
        <span className="pc-legend-item"><i className="pc-legend-dot busy" />他人已预定</span>
        <span className="pc-legend-item"><i className="pc-legend-dot mine" />我的预定</span>
        <span className="pc-legend-item"><i className="pc-legend-dot picking" />当前选择</span>
        <span className="pc-legend-hint">空闲区域拖选时段；红色为当前时间，此刻之前不可预定</span>
      </div>
    )}
  </div>
  );
};

// 单个会议室行
const PcRoomRow = ({ room, selection, showHost, isToday, nowMin, onPointerDown, onShowTip, onHideTip, onConfirm, onCancel }) => {
  const isPicking = selection && selection.roomId === room.id;

  return (
    <div className="tl-row">
      <div className="tl-room-cell">
        <div className="tl-room-name">
          <span>{room.name}</span>
          {room.favorite && <span className="tl-room-badge">常用</span>}
        </div>
        <div className="tl-room-meta">
          {room.capacity}人 · {room.facilities.join("/")}
        </div>
      </div>

      <div className="tl-track" onPointerDown={(e) => onPointerDown(room, e)}>
        {isToday && nowMin > 0 && (
          <span className="tl-past" style={{ width: window.TL.pct(nowMin) }} />
        )}
        {(room.busyEvents || []).map(ev => {
          const start = window.toMinutes(ev.start);
          const end = window.toMinutes(ev.end);
          return (
            <div
              key={`${room.id}-${ev.start}-${ev.title}`}
              className={`tl-event ${ev.mine ? "mine" : ""}`}
              style={{ left: window.TL.pct(start), width: window.TL.pct(end - start) }}
              onMouseEnter={(e) => onShowTip(ev, e.currentTarget)}
              onMouseLeave={onHideTip}
            >
              {showHost && (
                <React.Fragment>
                  <span className="tl-event-time">{ev.start}-{ev.end}</span>
                  <span className="tl-event-title">{ev.mine ? `${ev.title} · 我` : `${ev.title} · ${ev.host}`}</span>
                </React.Fragment>
              )}
            </div>
          );
        })}

        {isPicking && (
          <div
            className="tl-picking"
            style={{ left: window.TL.pct(selection.start), width: window.TL.pct(selection.end - selection.start) }}
          >
            <span className="tl-picking-label">
              {window.fromMinutes(selection.start)}-{window.fromMinutes(selection.end)}
            </span>
          </div>
        )}

        {isPicking && selection.confirmed && (
          <div
            className="tl-confirm-pop"
            style={{ left: window.TL.pct((selection.start + selection.end) / 2) }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="tl-confirm-time">
              {window.fromMinutes(selection.start)}-{window.fromMinutes(selection.end)} {window.TL.duration(selection.start, selection.end)}
            </div>
            <div className="tl-confirm-actions">
              <button type="button" className="tl-btn-ghost" onClick={onCancel}>取消</button>
              <button type="button" className="tl-btn-primary" onClick={() => onConfirm(room, selection)}>确定</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 看板主体
const PcTimelineBoard = ({ rooms, selection, setSelection, showHost, isToday, onCommit, onNotice }) => {
  const nowMin = useNowMinutes();
  const dragRef = React.useRef(null);
  const [tip, setTip] = React.useState(null);

  const handlePointerDown = (room, e) => {
    if (e.button !== 0) return;
    if (e.target.closest(".tl-event") || e.target.closest(".tl-confirm-pop")) return;

    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const anchor = window.TL.minuteAt(rect, e.clientX);
    if (isToday && anchor < nowMin) {
      onNotice("该时段已过期");
      return;
    }
    if (window.TL.isBusyAt(room, anchor)) {
      onNotice("该时段已被占用，请选择空闲区域");
      return;
    }

    let [low, high] = window.TL.freeBounds(room, anchor);
    if (isToday) low = Math.max(low, window.TL.nextOpen(nowMin));
    if (high - low < window.TL.SNAP) {
      onNotice("剩余空闲不足 30 分钟");
      return;
    }

    const start = Math.max(low, anchor);
    dragRef.current = { room, rect, anchor: start, low, high };
    setSelection({
      roomId: room.id,
      start,
      end: Math.min(high, start + window.TL.SNAP),
      confirmed: false
    });
    try {
      track.setPointerCapture(e.pointerId);
    } catch (err) {
      // 无真实 pointer 时（自动化或部分浏览器）仍保留选中态
    }
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const minute = window.TL.minuteAt(drag.rect, e.clientX);
    let start = Math.min(drag.anchor, minute);
    let end = Math.max(drag.anchor, minute);
    if (end === start) end = start + window.TL.SNAP;
    start = Math.max(drag.low, start);
    end = Math.min(drag.high, end);
    if (end - start < window.TL.SNAP) return;
    setSelection({ roomId: drag.room.id, start, end, confirmed: false });
  };

  const handlePointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setSelection(prev => (prev ? { ...prev, confirmed: true } : prev));
  };

  const showTip = (ev, el) => {
    const rect = el.getBoundingClientRect();
    setTip({ event: ev, left: rect.left + rect.width / 2, top: rect.top });
  };

  return (
    <div className="tl-board" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <div className="tl-board-inner">
        <div className="tl-row tl-head-row">
          <div className="tl-room-cell tl-head-cell">会议室</div>
          <div className="tl-track tl-axis">
            {window.TL.HOURS.map(h => (
              <span
                key={h}
                className={`tl-axis-label ${h === 0 ? "tl-axis-label-first" : ""}`}
                style={{ left: window.TL.pct(h * 60) }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
            {isToday && (
              <span className="tl-axis-now" style={{ left: window.TL.pct(nowMin) }}>
                {window.fromMinutes(nowMin)}
              </span>
            )}
            {selection && (
              <React.Fragment>
                <span className="tl-axis-pick" style={{ left: window.TL.pct(selection.start) }}>
                  {window.fromMinutes(selection.start)}
                </span>
                <span className="tl-axis-pick" style={{ left: window.TL.pct(selection.end) }}>
                  {window.fromMinutes(selection.end)}
                </span>
              </React.Fragment>
            )}
          </div>
        </div>

        <div className="tl-body">
          <div className="tl-guides">
            <div className="tl-room-cell tl-guides-spacer" />
            <div className="tl-track">
              {isToday && <span className="tl-line-now" style={{ left: window.TL.pct(nowMin) }} />}
              {selection && (
                <React.Fragment>
                  <span className="tl-line-pick" style={{ left: window.TL.pct(selection.start) }} />
                  <span className="tl-line-pick" style={{ left: window.TL.pct(selection.end) }} />
                </React.Fragment>
              )}
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="pc-empty">没有符合筛选条件的会议室</div>
          ) : (
            rooms.map(room => (
              <PcRoomRow
                key={room.id}
                room={room}
                selection={selection}
                showHost={showHost}
                isToday={isToday}
                nowMin={nowMin}
                onPointerDown={handlePointerDown}
                onShowTip={showTip}
                onHideTip={() => setTip(null)}
                onConfirm={onCommit}
                onCancel={() => setSelection(null)}
              />
            ))
          )}
        </div>
      </div>

      {tip && (
        <div className="tl-tooltip" style={{ left: tip.left, top: tip.top }}>
          {tip.event.start}-{tip.event.end}
          {tip.event.mine ? (
            <React.Fragment> 我的预定 · <b>{tip.event.title}</b></React.Fragment>
          ) : (
            <React.Fragment> 已被 <b>{tip.event.host}</b> 预定</React.Fragment>
          )}
        </div>
      )}
    </div>
  );
};

Object.assign(window, {
  PcToolbar,
  PcTimelineBoard
});
