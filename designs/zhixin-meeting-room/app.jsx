// Main Application Orchestrator

const ROOMS_KEY = "zx_meeting_rooms_proto_v2";
const DICTS_KEY = "zx_meeting_dicts_proto";

const loadJson = (key, fallback) => {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return fallback;
  }
};

const App = () => {
  const [rooms, setRooms] = React.useState(() => loadJson(ROOMS_KEY, window.INITIAL_ROOMS));
  const [dicts, setDicts] = React.useState(() => loadJson(DICTS_KEY, window.INITIAL_DICTS));

  React.useEffect(() => {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  }, [rooms]);

  React.useEffect(() => {
    localStorage.setItem(DICTS_KEY, JSON.stringify(dicts));
  }, [dicts]);

  // Routing: list | new | edit | dicts
  const [currentView, setCurrentView] = React.useState("list");
  const [editingRoomId, setEditingRoomId] = React.useState(null);

  const [toasts, setToasts] = React.useState([]);
  const showToast = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

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

  const handleNavigate = (nav) => {
    if (nav === "dicts") {
      setCurrentView("dicts");
      return;
    }
    setCurrentView("list");
  };

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
      const duplicate = rooms.find(r => r.id !== room.id && r.enabled && r.name === room.name);
      if (duplicate) {
        showToast("已有同名启用中的会议室，请修改名称", "error");
        return;
      }
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, enabled: true, updatedAt: new Date().toISOString() } : r));
      showToast("已启用", "success");
    } else {
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

  const handleSaveDict = (payload) => {
    const old = payload.id ? dicts.find(d => d.id === payload.id) : null;
    setDicts(prev => {
      if (payload.id) {
        return prev.map(d => d.id === payload.id ? { ...d, ...payload } : d);
      }
      return [...prev, { ...payload, id: "dict-" + Date.now(), enabled: true }];
    });
    if (old && old.name !== payload.name) {
      setRooms(roomsPrev => roomsPrev.map(r => {
        if (payload.type === "building" && r.buildingName === old.name) {
          return { ...r, buildingName: payload.name };
        }
        if (payload.type === "facility") {
          return {
            ...r,
            facilities: (r.facilities || []).map(f => f === old.name ? payload.name : f)
          };
        }
        return r;
      }));
    }
  };

  const handleToggleDict = (item) => {
    setDicts(prev => prev.map(d => d.id === item.id ? { ...d, enabled: !d.enabled } : d));
    showToast(item.enabled ? "已停用，表单中不再展示" : "已启用", "success");
  };

  const handleDeleteDict = (item, used) => {
    if (used > 0) {
      showToast(`有 ${used} 间会议室正在使用「${item.name}」，无法删除`, "error");
      return;
    }
    setModalConfig({
      isOpen: true,
      title: "提示",
      message: `确定删除字典项「${item.name}」？`,
      confirmText: "确定删除",
      cancelText: "取消",
      isDanger: true,
      onConfirm: () => {
        closeModal();
        setDicts(prev => prev.filter(d => d.id !== item.id));
        showToast("已删除", "success");
      }
    });
  };

  const editingRoom = React.useMemo(() => {
    if (!editingRoomId) return null;
    return rooms.find(r => r.id === editingRoomId);
  }, [rooms, editingRoomId]);

  const activeNav = currentView === "dicts" ? "dicts" : "rooms";

  return (
    <window.AppShell activeNav={activeNav} onNavigate={handleNavigate}>
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" ? <window.IconCheck /> : <window.IconAlert />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

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

      {currentView === "list" && (
        <window.RoomListPage
          rooms={rooms}
          dicts={dicts}
          onNavigateNew={handleNavigateNew}
          onNavigateEdit={handleNavigateEdit}
          onToggleEnable={handleToggleEnable}
        />
      )}

      {(currentView === "new" || currentView === "edit") && (
        <window.RoomFormPage
          initialRoom={editingRoom}
          existingRooms={rooms}
          dicts={dicts}
          onSave={handleSaveRoom}
          onCancel={handleCancelForm}
          showToast={showToast}
        />
      )}

      {currentView === "dicts" && (
        <window.DictPage
          dicts={dicts}
          rooms={rooms}
          onSave={handleSaveDict}
          onDelete={handleDeleteDict}
          onToggle={handleToggleDict}
          showToast={showToast}
        />
      )}
    </window.AppShell>
  );
};

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
