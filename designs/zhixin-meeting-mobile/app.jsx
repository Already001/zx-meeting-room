// Main Mobile Prototype App

const App = () => {
  // Navigation: 'reserve' (预定会议室) | 'my' (我的预定)
  const [activeTab, setActiveTab] = React.useState("reserve");

  // Selected date state
  const [selectedDate, setSelectedDate] = React.useState("2026-08-24");

  // Filter state
  const [filters, setFilters] = React.useState({
    building: "all",
    capacity: "all",
    facilities: []
  });

  // Rooms Data State
  const [rooms, setRooms] = React.useState(() => {
    const saved = localStorage.getItem("zx_mobile_rooms_proto");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return window.MOBILE_ROOMS;
  });

  // My Bookings Data State
  const [myBookings, setMyBookings] = React.useState(() => {
    const saved = localStorage.getItem("zx_mobile_bookings_proto");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return window.INITIAL_MY_BOOKINGS;
  });

  // Slot Selection: { roomId: '...', slots: [1, 2] }
  const [selectedSlots, setSelectedSlots] = React.useState({
    roomId: "m-room-1",
    slots: [4, 5] // default 12:00-14:00
  });

  // Modal States
  const [detailRoom, setDetailRoom] = React.useState(null);
  const [bookingTargetRoom, setBookingTargetRoom] = React.useState(null);
  const [toastMsg, setToastMsg] = React.useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  // Sync state to local storage
  React.useEffect(() => {
    localStorage.setItem("zx_mobile_rooms_proto", JSON.stringify(rooms));
  }, [rooms]);

  React.useEffect(() => {
    localStorage.setItem("zx_mobile_bookings_proto", JSON.stringify(myBookings));
  }, [myBookings]);

  // Handle slot clicking
  const handleSelectSlot = (room, slotIdx) => {
    setSelectedSlots(prev => {
      if (prev && prev.roomId === room.id) {
        // Toggle or expand
        if (prev.slots.includes(slotIdx)) {
          const nextSlots = prev.slots.filter(s => s !== slotIdx);
          return nextSlots.length > 0 ? { roomId: room.id, slots: nextSlots } : null;
        } else {
          return { roomId: room.id, slots: [...prev.slots, slotIdx].sort((a,b) => a-b) };
        }
      }
      return { roomId: room.id, slots: [slotIdx] };
    });
  };

  // Handle open New Schedule modal
  const handleStartBooking = (room) => {
    setBookingTargetRoom(room || (selectedSlots ? rooms.find(r => r.id === selectedSlots.roomId) : rooms[0]));
  };

  // Handle Booking submission
  const handleBookingSuccess = (newBooking) => {
    setMyBookings(prev => [newBooking, ...prev]);
    // Mark room slots as busy
    if (selectedSlots && selectedSlots.roomId) {
      setRooms(prev => prev.map(r => {
        if (r.id === selectedSlots.roomId) {
          return {
            ...r,
            busySlots: [...new Set([...r.busySlots, ...selectedSlots.slots])]
          };
        }
        return r;
      }));
    }
    setBookingTargetRoom(null);
    setDetailRoom(null);
    showToast("预定成功！已加入「我的预定」");
    setActiveTab("my");
  };

  // Handle release room
  const handleReleaseBooking = (booking) => {
    setMyBookings(prev => prev.filter(b => b.id !== booking.id));
    showToast("会议室已提前释放");
  };

  return (
    <div className="device-wrapper">
      {/* iOS Top Bar */}
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

      {/* Header Navigation */}
      <div className="mobile-navbar">
        <div style={{ width: 40 }} />
        <span className="navbar-title">
          {activeTab === "reserve" ? "智能会议室" : "我的预定"}
        </span>
        {activeTab === "reserve" && selectedSlots && (
          <button 
            className="navbar-action" 
            style={{ fontWeight: 600 }}
            onClick={() => handleStartBooking()}
          >
            去预定
          </button>
        )}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="mobile-toast">
          <window.IconCheck />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="screen-scroll-container">
        {activeTab === "reserve" ? (
          <div>
            {/* 1. Date Selector (对标钉钉 03 选择日期) */}
            <window.MobileDateStrip 
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* 2. Filter Bar (对标钉钉 04/05/06 筛选) */}
            <window.MobileFilterStrip 
              filters={filters}
              onOpenFilterModal={(type) => {
                showToast(`点击了${type === "building" ? "建筑楼层" : type === "capacity" ? "容纳人数" : "设备设施"}筛选`);
              }}
            />

            {/* 3. Rooms Time Slot Grid (对标钉钉 02 / 07 时段选择) */}
            <div style={{ paddingBottom: 16 }}>
              {rooms.map(room => (
                <window.MobileRoomCard
                  key={room.id}
                  room={room}
                  selectedSlots={selectedSlots}
                  onSelectSlot={handleSelectSlot}
                  onOpenDetail={(r) => setDetailRoom(r)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* 4. My Bookings Tab (对标钉钉 13 / 14 我的预定 + 释放) */
          <window.MobileMyBookingsView 
            bookings={myBookings}
            onReleaseBooking={handleReleaseBooking}
          />
        )}
      </div>

      {/* Bottom Tabbar (预定会议室 / 我的预定) */}
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

      {/* Detail Modal (对标钉钉 08/09 详情) */}
      <window.MobileRoomDetailModal
        room={detailRoom}
        isOpen={Boolean(detailRoom)}
        onClose={() => setDetailRoom(null)}
        onBookNow={(r) => {
          setDetailRoom(null);
          handleStartBooking(r);
        }}
      />

      {/* Create Schedule Modal (对标钉钉 10/11 新建日程) */}
      <window.MobileCreateScheduleModal
        room={bookingTargetRoom}
        selectedSlots={selectedSlots}
        isOpen={Boolean(bookingTargetRoom)}
        onClose={() => setBookingTargetRoom(null)}
        onSubmitSuccess={handleBookingSuccess}
      />
    </div>
  );
};

// Mount App
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
