// UI Shell & Shared Components

const AppShell = ({ activeNav = "rooms", children, userName = "管理员" }) => {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <a className="sr-only" href="#main-content">跳到主内容</a>
      {/* 60px Left Sidenav */}
      <aside style={{
        width: "var(--sidenav-width)",
        backgroundColor: "var(--color-canvas-soft)",
        borderRight: "1px solid var(--color-hairline)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px 0",
        flexShrink: 0
      }}>
        {/* App Icon */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: "var(--color-primary)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20
        }}>
          <window.IconAppLogo />
        </div>

        <nav aria-label="主导航" style={{ width: "100%" }}>
          <button
            type="button"
            aria-current={activeNav === "rooms" ? "page" : undefined}
            style={{
              width: "100%",
              height: 44,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              position: "relative",
              backgroundColor: activeNav === "rooms" ? "var(--color-primary-bg)" : "transparent",
              color: activeNav === "rooms" ? "var(--color-primary)" : "var(--color-body)",
              cursor: "pointer",
              border: "none",
              padding: 0
            }}
          >
          {activeNav === "rooms" && (
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "var(--menu-active-bar)",
              backgroundColor: "var(--color-primary)"
            }} />
          )}
          <window.IconMeetingRoom />
          <span style={{ fontSize: 10, lineHeight: "16px" }}>会议室</span>
          </button>
        </nav>
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
            <span style={{ fontWeight: 600, fontSize: 16, lineHeight: "24px", color: "var(--color-ink)" }}>智信 · 智能会议室管理平台</span>
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
        <main id="main-content" style={{
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
  const titleId = "confirm-modal-title";
  const descId = "confirm-modal-desc";

  React.useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-divider)", display: "flex", alignItems: "center", gap: 8 }}>
          <window.IconAlert />
          <span id={titleId} style={{ fontWeight: 600, fontSize: 16, lineHeight: "24px" }}>{title}</span>
        </div>
        <div id={descId} style={{ padding: "20px", fontSize: 14, color: "var(--color-body)", lineHeight: "20px" }}>
          {message}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-divider)", display: "flex", justifyContent: "flex-end", gap: 8, backgroundColor: "var(--color-canvas-soft)" }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>
          <button type="button" className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  AppShell,
  ConfirmModal
});
