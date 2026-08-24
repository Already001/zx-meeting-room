// Main Application Orchestrator

const App = () => {
  // State: rooms data
  const [rooms, setRooms] = React.useState(() => {
    const saved = localStorage.getItem("zx_meeting_rooms_proto");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return window.INITIAL_ROOMS;
  });

  // Persist rooms changes to localStorage
  React.useEffect(() => {
    localStorage.setItem("zx_meeting_rooms_proto", JSON.stringify(rooms));
  }, [rooms]);

  // Routing State: view = 'list' | 'new' | 'edit'
  const [currentView, setCurrentView] = React.useState("list");
  const [editingRoomId, setEditingRoomId] = React.useState(null);

  // Toast Notification State
  const [toasts, setToasts] = React.useState([]);
  const showToast = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  // Confirmation Modal State
  const [modalConfig, setModalConfig] = React.useState({
    isOpen: false,
    title: "提示",
    message: "",
    confirmText: "确定",
    cancelText: "取消",
    isDanger: false,
    onConfirm: () => {}
  });

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Actions
  const handleNavigateNew = () => {
    setEditingRoomId(null);
    setCurrentView("new");
  };

  const handleNavigateEdit = (id) => {
    setEditingRoomId(id);
    setCurrentView("edit");
  };

  const handleCancelForm = (isDirty) => {
    if (isDirty) {
      setModalConfig({
        isOpen: true,
        title: "提示",
        message: "放弃未保存的修改？",
        confirmText: "确定放弃",
        cancelText: "继续编辑",
        isDanger: true,
        onConfirm: () => {
          closeModal();
          setCurrentView("list");
        }
      });
    } else {
      setCurrentView("list");
    }
  };

  const handleSaveRoom = (payload, id) => {
    if (id) {
      // Edit mode
      setRooms(prev => prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            ...payload,
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      }));
      showToast("保存成功", "success");
    } else {
      // New mode
      const newRoom = {
        ...payload,
        id: "room-" + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setRooms(prev => [newRoom, ...prev]);
      showToast("保存成功", "success");
    }
    setCurrentView("list");
  };

  const handleToggleEnable = (room, targetEnable) => {
    if (targetEnable) {
      // Direct enable with uniqueness check
      const duplicate = rooms.find(r => r.id !== room.id && r.enabled && r.name === room.name);
      if (duplicate) {
        showToast("已有同名启用中的会议室，请修改名称", "error");
        return;
      }
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, enabled: true, updatedAt: new Date().toISOString() } : r));
      showToast("已启用", "success");
    } else {
      // Secondary confirmation for disable
      setModalConfig({
        isOpen: true,
        title: "提示",
        message: "停用后该会议室将不可被预定，确定停用？",
        confirmText: "确定停用",
        cancelText: "取消",
        isDanger: true,
        onConfirm: () => {
          closeModal();
          setRooms(prev => prev.map(r => r.id === room.id ? { ...r, enabled: false, updatedAt: new Date().toISOString() } : r));
          showToast("已停用", "success");
        }
      });
    }
  };

  const editingRoom = React.useMemo(() => {
    if (!editingRoomId) return null;
    return rooms.find(r => r.id === editingRoomId);
  }, [rooms, editingRoomId]);

  return (
    <window.AppShell activeNav="rooms">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" ? <window.IconCheck /> : <window.IconAlert />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <window.ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        isDanger={modalConfig.isDanger}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />

      {/* Routed Content */}
      {currentView === "list" && (
        <window.RoomListPage
          rooms={rooms}
          onNavigateNew={handleNavigateNew}
          onNavigateEdit={handleNavigateEdit}
          onToggleEnable={handleToggleEnable}
        />
      )}

      {(currentView === "new" || currentView === "edit") && (
        <window.RoomFormPage
          initialRoom={editingRoom}
          existingRooms={rooms}
          onSave={handleSaveRoom}
          onCancel={handleCancelForm}
          showToast={showToast}
        />
      )}
    </window.AppShell>
  );
};

// Mount App
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
