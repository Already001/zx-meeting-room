// UI Shell & Shared Components

const AppShell = ({ activeNav = "rooms", onNavigate, children, userName = "管理员" }) => {
  const navItems = [
    { id: "rooms", label: "会议室", icon: <window.IconMeetingRoom /> },
    { id: "dicts", label: "字典表", icon: <window.IconDict /> }
  ];

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <aside className="admin-sidenav">
        <div className="admin-sidenav-logo">
          <window.IconAppLogo />
        </div>
        {navItems.map(item => (
          <button
            type="button"
            key={item.id}
            className={`admin-nav-item ${activeNav === item.id ? "active" : ""}`}
            onClick={() => onNavigate && onNavigate(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </aside>

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* 48px Topbar */}
        <header style={{
          height: "var(--topbar-height)",
          backgroundColor: "var(--color-canvas)",
          borderBottom: "1px solid var(--color-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 var(--spacing-2xl)",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: "var(--color-ink)" }}>智信 · 智能会议室管理平台</span>
            <span style={{ fontSize: 12, color: "var(--color-mute)", backgroundColor: "var(--color-canvas-soft)", padding: "2px 6px", borderRadius: 4 }}>
              PC WebView (zx) / 浏览器 (main)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--color-body)" }}>
              企业：<span style={{ color: "var(--color-ink)", fontWeight: 500 }}>创新科技集团 (corpId: zx-001)</span>
            </div>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: "var(--color-primary-bg)",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600
            }}>
              管
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "var(--color-canvas-soft)",
          padding: "var(--spacing-2xl)"
        }}>
          <div style={{ maxWidth: "var(--container-max)", margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Modal Confirmation Dialog
const ConfirmModal = ({ isOpen, title = "提示", message, onConfirm, onCancel, confirmText = "确定", cancelText = "取消", isDanger = false }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-divider)", display: "flex", alignItems: "center", gap: 8 }}>
          <window.IconAlert />
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
        </div>
        <div style={{ padding: "20px", fontSize: 14, color: "var(--color-body)", lineHeight: "22px" }}>
          {message}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-divider)", display: "flex", justifyContent: "flex-end", gap: 10, backgroundColor: "var(--color-canvas-soft)" }}>
          <button className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>
          <button className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  AppShell,
  ConfirmModal
});
