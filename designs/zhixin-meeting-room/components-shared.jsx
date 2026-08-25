// UI Shell & Shared Components

const AppShell = ({ activeNav = "rooms", onNavigate, children, userName = "管理员" }) => {
  const navItems = [
    { id: "rooms", label: "会议室", icon: <window.IconMeetingRoom /> },
    { id: "dicts", label: "字典表", icon: <window.IconDict /> }
  ];

  return (
    <div className="app-shell">
      <a className="sr-only" href="#main-content">跳到主内容</a>
      <aside className="app-sidenav">
        <div className="app-sidenav-logo" aria-hidden="true">
          <window.IconAppLogo />
        </div>

        <nav className="app-sidenav-nav" aria-label="主导航">
          {navItems.map(item => (
            <button
              type="button"
              key={item.id}
              className={`app-sidenav-item${activeNav === item.id ? " is-active" : ""}`}
              aria-current={activeNav === item.id ? "page" : undefined}
              onClick={() => onNavigate && onNavigate(item.id)}
            >
              {activeNav === item.id && <span className="app-sidenav-indicator" />}
              {item.icon}
              <span className="app-sidenav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <span className="type-title-sm">智信 · 智能会议室管理平台</span>
            <span className="app-env-tag">PC WebView (zx) / 浏览器 (main)</span>
          </div>
          <div className="app-topbar-right">
            <div className="app-corp">
              企业：<strong>创新科技集团 (corpId: zx-001)</strong>
            </div>
            <div className="app-avatar" title={userName}>管</div>
          </div>
        </header>

        <main id="main-content" className="app-content">
          <div className="app-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, title = "提示", message, onConfirm, onCancel, confirmText = "确定", cancelText = "取消", isDanger = false }) => {
  const titleId = "confirm-modal-title";
  const descId = "confirm-modal-desc";
  const confirmRef = React.useRef(null);

  React.useEffect(() => {
    if (!isOpen) return undefined;
    confirmRef.current?.focus();
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
        <div className="modal-head">
          <window.IconAlert />
          <span id={titleId} className="type-title-sm">{title}</span>
        </div>
        <div id={descId} className="modal-body">{message}</div>
        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn ${isDanger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  AppShell,
  ConfirmModal
});
