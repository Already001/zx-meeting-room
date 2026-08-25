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
const PcToolbar = ({ dateLabel, onPrevDay, onNextDay, onToday, showHost, onToggleHost, showLegend, onToggleLegend, onOpenMine, onNotice }) => (
  <div className="pc-toolbar">
    <div className="pc-toolbar-row">
      <button type="button" className="pc-select" onClick={() => onNotice("切换企业 / 组织")}>
        <span>Nic测试</span>
        <window.IconCaretDown />
      </button>
      <button type="button" className="pc-select pc-select-wide" onClick={() => onNotice("按建筑 · 楼层筛选")}>
        <span className="pc-select-placeholder">建筑 · 楼层</span>
        <window.IconCaretDown />
      </button>
      <div className="pc-search">
        <window.IconSearch />
        <input type="text" placeholder="搜索会议室" onChange={() => onNotice("按名称搜索会议室")} />
      </div>
      <button type="button" className="pc-icon-btn" title="刷新" onClick={() => onNotice("已刷新会议室占用")}>
        <window.IconRefresh />
      </button>
      <button type="button" className="pc-text-btn" onClick={() => onNotice("展开高级筛选：人数 / 设施 / 审批")}>
        <span>高级筛选</span>
        <window.IconCaretDown />
      </button>
      <button type="button" className="pc-text-btn pc-toolbar-end" onClick={onOpenMine}>我的预定</button>
    </div>

    <div className="pc-toolbar-row pc-toolbar-row-sub">
      <button type="button" className="pc-select pc-date-select" onClick={() => onNotice("选择日期")}>
        <span>{dateLabel}</span>
        <window.IconCalendarSmall />
      </button>
      <button type="button" className="pc-icon-btn" title="前一天" onClick={onPrevDay}>
        <window.IconArrowLeft />
      </button>
      <button type="button" className="pc-text-btn pc-today-btn" onClick={onToday}>回到今天</button>
      <button type="button" className="pc-icon-btn" title="后一天" onClick={onNextDay}>
        <window.IconArrowRight />
      </button>
      <button type="button" className="pc-select pc-select-narrow" onClick={() => onNotice("切换 日 / 周 视图")}>
        <span>日</span>
        <window.IconCaretDown />
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
        <span className="pc-legend-hint">在空闲区域按住并横向拖动即可选择时段</span>
      </div>
    )}
  </div>
);

// 单个会议室行
const PcRoomRow = ({ room, selection, showHost, onPointerDown, onShowTip, onHideTip, onConfirm, onCancel }) => {
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
const PcTimelineBoard = ({ rooms, selection, setSelection, showHost, onCommit, onNotice }) => {
  const nowMin = useNowMinutes();
  const dragRef = React.useRef(null);
  const [tip, setTip] = React.useState(null);

  const handlePointerDown = (room, e) => {
    if (e.button !== 0) return;
    if (e.target.closest(".tl-event") || e.target.closest(".tl-confirm-pop")) return;

    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const anchor = window.TL.minuteAt(rect, e.clientX);
    if (window.TL.isBusyAt(room, anchor)) {
      onNotice("该时段已被占用，请选择空闲区域");
      return;
    }

    const [low, high] = window.TL.freeBounds(room, anchor);
    dragRef.current = { room, rect, anchor, low, high };
    track.setPointerCapture(e.pointerId);
    setSelection({
      roomId: room.id,
      start: anchor,
      end: Math.min(high, anchor + window.TL.SNAP),
      confirmed: false
    });
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
            <span className="tl-axis-now" style={{ left: window.TL.pct(nowMin) }}>
              {window.fromMinutes(nowMin)}
            </span>
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
              <span className="tl-line-now" style={{ left: window.TL.pct(nowMin) }} />
              {selection && (
                <React.Fragment>
                  <span className="tl-line-pick" style={{ left: window.TL.pct(selection.start) }} />
                  <span className="tl-line-pick" style={{ left: window.TL.pct(selection.end) }} />
                </React.Fragment>
              )}
            </div>
          </div>

          {rooms.map(room => (
            <PcRoomRow
              key={room.id}
              room={room}
              selection={selection}
              showHost={showHost}
              onPointerDown={handlePointerDown}
              onShowTip={showTip}
              onHideTip={() => setTip(null)}
              onConfirm={onCommit}
              onCancel={() => setSelection(null)}
            />
          ))}
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
