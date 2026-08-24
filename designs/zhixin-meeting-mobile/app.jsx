// Main Reservation Prototype App (mobile + PC)

const App = () => {
  const [activeTab, setActiveTab] = React.useState("reserve");
  const [selectedDate, setSelectedDate] = React.useState("2026-08-24");
  const [filters, setFilters] = React.useState({
    building: "all",
    capacity: "all",
    facilities: []
  });
  const [rooms, setRooms] = React.useState(() => window.MOBILE_ROOMS);
  const [myBookings, setMyBookings] = React.useState(() => window.INITIAL_MY_BOOKINGS);
  const [selectedSlots, setSelectedSlots] = React.useState({
    roomId: "m-room-1",
    slots: [8, 9, 10]
  });
  const [detailRoom, setDetailRoom] = React.useState(null);
  const [bookingTargetRoom, setBookingTargetRoom] = React.useState(null);
  const [toastMsg, setToastMsg] = React.useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleSelectSlot = (room, slotIdx) => {
    if (slotIdx === null || slotIdx === undefined) return;
    setSelectedSlots(prev => {
      if (prev && prev.roomId === room.id) {
        if (prev.slots.includes(slotIdx)) {
          const nextSlots = prev.slots.filter(s => s !== slotIdx);
          return nextSlots.length > 0 ? { roomId: room.id, slots: nextSlots } : null;
        }
        return { roomId: room.id, slots: [...prev.slots, slotIdx].sort((a, b) => a - b) };
      }
      return { roomId: room.id, slots: [slotIdx] };
    });
  };

  const handleStartBooking = (room) => {
    setBookingTargetRoom(room || (selectedSlots ? rooms.find(r => r.id === selectedSlots.roomId) : rooms[0]));
  };

  const handleBookingSuccess = (newBooking) => {
    setMyBookings(prev => [newBooking, ...prev]);
    if (selectedSlots && selectedSlots.roomId) {
      setRooms(prev => prev.map(r => {
        if (r.id !== selectedSlots.roomId) return r;
        return {
          ...r,
          busyEvents: [...(r.busyEvents || []), {
            start: newBooking.timeRange.split(" - ")[0],
            end: newBooking.timeRange.split(" - ")[1],
            slots: [...selectedSlots.slots],
            title: newBooking.title,
            host: "李明 (我)",
            dept: "产品部"
          }]
        };
      }));
    }
    setBookingTargetRoom(null);
    setDetailRoom(null);
    showToast("预定成功！已加入「我的预定」");
    setActiveTab("my");
  };

  const handleReleaseBooking = (booking) => {
    setMyBookings(prev => prev.filter(b => b.id !== booking.id));
    showToast("会议室已提前释放");
  };

  const pageTitle = activeTab === "reserve" ? "预定会议室" : "我的预定";

  return (
    <div className="device-wrapper">
      <aside className="pc-sidenav">
        <div className="pc-sidenav-logo" aria-hidden="true">
          <window.IconCalendar />
        </div>
        <button
          type="button"
          className={`pc-nav-item ${activeTab === "reserve" ? "active" : ""}`}
          onClick={() => setActiveTab("reserve")}
        >
          <window.IconCalendar />
          <span>预定</span>
        </button>
        <button
          type="button"
          className={`pc-nav-item ${activeTab === "my" ? "active" : ""}`}
          onClick={() => setActiveTab("my")}
        >
          <window.IconUser />
          <span>我的</span>
        </button>
      </aside>

      <div className="app-column">
        <header className="pc-topbar">
          <div className="pc-topbar-brand">
            <strong>智信 · 智能会议室</strong>
            <span className="pc-topbar-chip">PC WebView (zx) / 浏览器 (main)</span>
          </div>
          <div className="pc-topbar-user">
            <span>企业：<b style={{ color: "#1F2329", fontWeight: 500 }}>创新科技集团 (corpId: zx-001)</b></span>
            <div className="pc-avatar">李</div>
          </div>
        </header>

        <div className="phone-top-bar">
          <span className="top-time">9:41</span>
          <div className="top-icons">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
              <rect x="0" y="7.5" width="3" height="4.5" rx="1" />
              <rect x="4.5" y="5" width="3" height="7" rx="1" />
              <rect x="9" y="2.5" width="3" height="9.5" rx="1" />
              <rect x="13.5" y="0" width="3" height="12" rx="1" />
            </svg>
            <svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor">
              <rect x="1" y="1" width="20" height="10" rx="3" strokeWidth="1" />
              <rect x="3" y="3" width="14" height="6" rx="1.5" fill="currentColor" />
            </svg>
          </div>
        </div>

        <div className="mobile-navbar">
          <span className="navbar-title">{pageTitle}</span>
          {activeTab === "reserve" && selectedSlots && selectedSlots.slots.length > 0 ? (
            <button
              type="button"
              className="navbar-action navbar-book-btn"
              onClick={() => handleStartBooking()}
            >
              去预定
            </button>
          ) : (
            <div style={{ width: 40 }} />
          )}
        </div>

        {toastMsg && (
          <div className="mobile-toast">
            <window.IconCheck />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="screen-scroll-container">
          {activeTab === "reserve" ? (
            <div>
              <div className="pc-sticky-toolbar">
                <window.MobileDateStrip
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
                <window.MobileFilterStrip
                  filters={filters}
                  onOpenFilterModal={(type) => {
                    showToast(`切换「${type === "building" ? "建筑楼层" : type === "capacity" ? "容纳人数" : "设备设施"}」筛选`);
                  }}
                />
              </div>

              <div className="pc-content-wrap">
                {rooms.map(room => (
                  <window.MobileRoomCard
                    key={room.id}
                    room={room}
                    selectedSlots={selectedSlots}
                    onSelectSlot={handleSelectSlot}
                    onStartBooking={handleStartBooking}
                    onOpenDetail={(r) => setDetailRoom(r)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <window.MobileMyBookingsView
              bookings={myBookings}
              onReleaseBooking={handleReleaseBooking}
            />
          )}
        </div>

        <div className="mobile-tabbar">
          <div
            className={`tab-item ${activeTab === "reserve" ? "active" : ""}`}
            onClick={() => setActiveTab("reserve")}
          >
            <window.IconCalendar />
            <span>预定会议室</span>
          </div>
          <div
            className={`tab-item ${activeTab === "my" ? "active" : ""}`}
            onClick={() => setActiveTab("my")}
          >
            <window.IconUser />
            <span>我的预定</span>
          </div>
        </div>

        <window.MobileRoomDetailModal
          room={detailRoom}
          isOpen={Boolean(detailRoom)}
          onClose={() => setDetailRoom(null)}
          onBookNow={(r) => {
            setDetailRoom(null);
            handleStartBooking(r);
          }}
        />

        <window.MobileCreateScheduleModal
          room={bookingTargetRoom}
          selectedSlots={selectedSlots}
          isOpen={Boolean(bookingTargetRoom)}
          onClose={() => setBookingTargetRoom(null)}
          onSubmitSuccess={handleBookingSuccess}
        />
      </div>
    </div>
  );
};

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
