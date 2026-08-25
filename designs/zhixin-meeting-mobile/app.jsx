// 智信 · 智能会议室预定原型（移动端对齐钉钉交互 + PC 时间轴看板）

const WEEK_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const BASE_DATE = new Date(2026, 7, 25);

const toIso = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDateLabel = (date) => `${toIso(date)} (${WEEK_LABELS[date.getDay()]})`;

const buildDays = (base, count) =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return {
      value: toIso(d),
      week: i === 0 ? "今天" : i === 1 ? "明天" : WEEK_LABELS[d.getDay()],
      day: `${d.getMonth() + 1}/${d.getDate()}`,
      short: `${d.getMonth() + 1}月${d.getDate()}日`
    };
  });

const useIsPc = () => {
  const query = "(min-width: 1024px)";
  const [isPc, setIsPc] = React.useState(() => window.matchMedia(query).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setIsPc(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isPc;
};

const App = () => {
  const isPc = useIsPc();

  const [activeTab, setActiveTab] = React.useState("reserve");
  const [boardDate, setBoardDate] = React.useState(() => new Date(BASE_DATE));
  const [rooms, setRooms] = React.useState(() => window.MOBILE_ROOMS);
  const [myBookings, setMyBookings] = React.useState(() => window.INITIAL_MY_BOOKINGS);
  const [toastMsg, setToastMsg] = React.useState(null);

  const [filters, setFilters] = React.useState({ place: "all", capacity: "all", facilities: [] });
  const [filterSheet, setFilterSheet] = React.useState(null);

  // 移动端与 PC 共用一份时间轴选择：{ roomId, start, end }
  const [selection, setSelection] = React.useState(null);
  const [showHost, setShowHost] = React.useState(false);
  const [showLegend, setShowLegend] = React.useState(false);

  const [detailRoom, setDetailRoom] = React.useState(null);
  const [occupancy, setOccupancy] = React.useState(null);
  const [confirmPayload, setConfirmPayload] = React.useState(null);
  const [bookingTargetRoom, setBookingTargetRoom] = React.useState(null);
  const [bookingRangeText, setBookingRangeText] = React.useState(null);

  const days = React.useMemo(() => buildDays(BASE_DATE, 14), []);
  const selectedDate = toIso(boardDate);
  const selectedDay = days.find(d => d.value === selectedDate);
  const dateShort = selectedDay ? selectedDay.short : toIso(boardDate);
  const dateLabel = formatDateLabel(boardDate);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const places = React.useMemo(() => {
    const set = new Set(rooms.map(r => `${r.building} ${r.floor}`));
    return Array.from(set);
  }, [rooms]);

  const visibleRooms = React.useMemo(() => rooms.filter(room => {
    if (filters.place !== "all" && `${room.building} ${room.floor}` !== filters.place) return false;
    if (filters.capacity !== "all") {
      const option = window.CAPACITY_OPTIONS.find(c => c.id === filters.capacity);
      if (option && option.min !== undefined) {
        if (room.capacity < option.min || room.capacity > option.max) return false;
      }
    }
    if (filters.facilities.length > 0 && !filters.facilities.every(f => room.facilities.includes(f))) return false;
    return true;
  }), [rooms, filters]);

  const selectedRoom = selection ? rooms.find(r => r.id === selection.roomId) : null;

  const shiftDay = (delta) => {
    setBoardDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      return next;
    });
    setSelection(null);
  };

  const openBooking = (room, range) => {
    setBookingRangeText(range);
    setBookingTargetRoom(room);
  };

  const handleCommitRange = (room, picked) => {
    openBooking(room, `${window.fromMinutes(picked.start)} - ${window.fromMinutes(picked.end)}`);
  };

  const handleQuickDuration = (minutes) => {
    setSelection(prev => {
      if (!prev || !selectedRoom) return prev;
      const [, high] = window.TL.freeBounds(selectedRoom, Math.floor((prev.start + prev.end) / 2));
      return { ...prev, end: Math.min(high, prev.start + minutes) };
    });
  };

  const handleBookingSuccess = (newBooking) => {
    setMyBookings(prev => [newBooking, ...prev]);

    const targetRoomId = bookingTargetRoom ? bookingTargetRoom.id : null;
    const [startText, endText] = newBooking.timeRange.split(" - ");

    setRooms(prev => prev.map(r => {
      if (r.id !== targetRoomId) return r;
      return {
        ...r,
        busyEvents: [...(r.busyEvents || []), window.makeEvent({
          start: startText,
          end: endText,
          title: newBooking.title,
          host: "李明",
          dept: "产品部",
          mine: true
        })]
      };
    }));

    setBookingTargetRoom(null);
    setBookingRangeText(null);
    setDetailRoom(null);
    setSelection(null);
    showToast("预定成功，已加入「我的预定」");
    setActiveTab("my");
  };

  const releaseBooking = (booking) => {
    setMyBookings(prev => prev.filter(b => b.id !== booking.id));
    setRooms(prev => prev.map(r => {
      if (r.id !== booking.roomId) return r;
      return {
        ...r,
        busyEvents: (r.busyEvents || []).filter(ev => !(ev.mine && `${ev.start} - ${ev.end}` === booking.timeRange))
      };
    }));
    setConfirmPayload(null);
    showToast("会议室已提前释放");
  };

  const askRelease = (booking) => {
    setConfirmPayload({
      title: "释放会议室",
      message: `${booking.roomName} ${booking.timeRange}，释放后其他人可预定该时段。`,
      confirmText: "确认释放",
      onConfirm: () => releaseBooking(booking)
    });
  };

  const handleOpenRoomDetail = (room) => setDetailRoom(room);

  const handleBookFromDetail = (room) => {
    setDetailRoom(null);
    if (selection && selection.roomId === room.id) {
      openBooking(room, `${window.fromMinutes(selection.start)} - ${window.fromMinutes(selection.end)}`);
      return;
    }
    showToast("请先在时间轴上轻点选择空闲时段");
  };

  // 弹层都按需挂载，保证每次打开都是干净的表单状态
  const sharedModals = (
    <React.Fragment>
      {detailRoom && (
        <window.MobileRoomDetailModal
          room={detailRoom}
          onClose={() => setDetailRoom(null)}
          onBookNow={handleBookFromDetail}
        />
      )}
      {bookingTargetRoom && (
        <window.MobileCreateScheduleModal
          room={bookingTargetRoom}
          rangeText={bookingRangeText}
          dateLabel={dateShort}
          fullScreen={!isPc}
          onClose={() => {
            setBookingTargetRoom(null);
            setBookingRangeText(null);
          }}
          onSubmitSuccess={handleBookingSuccess}
        />
      )}
      {confirmPayload && (
        <window.MobileConfirmSheet
          payload={confirmPayload}
          onCancel={() => setConfirmPayload(null)}
        />
      )}
    </React.Fragment>
  );

  const toast = toastMsg ? (
    <div className="mobile-toast">
      <window.IconCheck />
      <span>{toastMsg}</span>
    </div>
  ) : null;

  if (isPc) {
    return (
      <div className="pc-app">
        <window.PcToolbar
          dateLabel={dateLabel}
          onPrevDay={() => shiftDay(-1)}
          onNextDay={() => shiftDay(1)}
          onToday={() => {
            setBoardDate(new Date(BASE_DATE));
            setSelection(null);
          }}
          showHost={showHost}
          onToggleHost={() => setShowHost(v => !v)}
          showLegend={showLegend}
          onToggleLegend={() => setShowLegend(v => !v)}
          onOpenMine={() => setActiveTab(activeTab === "my" ? "reserve" : "my")}
          onNotice={showToast}
        />

        {toast}

        {activeTab === "reserve" ? (
          <window.PcTimelineBoard
            rooms={visibleRooms}
            selection={selection}
            setSelection={setSelection}
            showHost={showHost}
            onCommit={handleCommitRange}
            onNotice={showToast}
          />
        ) : (
          <div className="pc-bookings-page">
            <div className="pc-page-head">
              <h2>我的预定</h2>
              <button type="button" className="pc-text-btn" onClick={() => setActiveTab("reserve")}>
                返回预定看板
              </button>
            </div>
            <window.MobileMyBookingsView bookings={myBookings} onReleaseBooking={askRelease} />
          </div>
        )}

        {sharedModals}
      </div>
    );
  }

  return (
    <div className="m-app">
      <div className="m-navbar">
        {activeTab === "my" ? (
          <button type="button" className="m-nav-back" onClick={() => setActiveTab("reserve")}>
            <window.IconChevronLeft />
          </button>
        ) : (
          <span className="m-nav-side" />
        )}

        <span className="m-nav-title">{activeTab === "reserve" ? "预定会议室" : "我的预定"}</span>

        {activeTab === "reserve" ? (
          <button type="button" className="m-nav-link" onClick={() => setActiveTab("my")}>我的预定</button>
        ) : (
          <span className="m-nav-side" />
        )}
      </div>

      {toast}

      {activeTab === "reserve" ? (
        <div className="m-page">
          <window.MobileDateBar
            days={days}
            selectedDate={selectedDate}
            onSelectDate={(value) => {
              const next = days.find(d => d.value === value);
              if (!next) return;
              setBoardDate(new Date(`${value}T00:00:00`));
              setSelection(null);
            }}
            onOpenCalendar={() => showToast("打开日历选择更多日期")}
          />

          <window.MobileFilterBar filters={filters} onOpen={setFilterSheet} />

          <window.MobileTimelineBoard
            rooms={visibleRooms}
            selection={selection}
            setSelection={setSelection}
            onTapEvent={(room, event) => setOccupancy({ room, event })}
            onOpenRoom={handleOpenRoomDetail}
            onNotice={showToast}
          />

          <window.MobileSelectionBar
            room={selectedRoom}
            selection={selection}
            dateText={dateShort}
            onCancel={() => setSelection(null)}
            onQuickDuration={handleQuickDuration}
            onBook={() => {
              if (!selectedRoom || !selection) return;
              openBooking(selectedRoom, `${window.fromMinutes(selection.start)} - ${window.fromMinutes(selection.end)}`);
            }}
          />
        </div>
      ) : (
        <div className="m-page m-page-scroll">
          <window.MobileMyBookingsView bookings={myBookings} onReleaseBooking={askRelease} />
        </div>
      )}

      {filterSheet && (
        <window.MobileFilterSheet
          type={filterSheet}
          filters={filters}
          places={places}
          onApply={(next) => {
            setFilters(next);
            setFilterSheet(null);
            setSelection(null);
          }}
          onClose={() => setFilterSheet(null)}
        />
      )}

      {occupancy && (
        <window.MobileOccupancySheet payload={occupancy} onClose={() => setOccupancy(null)} />
      )}

      {sharedModals}
    </div>
  );
};

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
