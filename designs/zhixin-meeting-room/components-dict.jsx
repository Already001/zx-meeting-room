// 字典表：建筑 / 设施

const DictPage = ({ dicts, rooms, onSave, onDelete, onToggle, showToast }) => {
  const [activeType, setActiveType] = React.useState("building");
  const [editing, setEditing] = React.useState(null);
  const [draftName, setDraftName] = React.useState("");
  const [draftSort, setDraftSort] = React.useState(1);
  const [error, setError] = React.useState("");

  const typeMeta = window.DICT_TYPES.find(t => t.id === activeType);
  const rows = window.dictItems(dicts, activeType, false);

  const usageCount = (name) => {
    if (activeType === "building") {
      return rooms.filter(r => r.buildingName === name).length;
    }
    return rooms.filter(r => (r.facilities || []).includes(name)).length;
  };

  const openCreate = () => {
    const nextSort = rows.length ? Math.max(...rows.map(r => r.sort)) + 1 : 1;
    setEditing({ id: null });
    setDraftName("");
    setDraftSort(nextSort);
    setError("");
  };

  const openEdit = (item) => {
    setEditing(item);
    setDraftName(item.name);
    setDraftSort(item.sort);
    setError("");
  };

  const closeEditor = () => {
    setEditing(null);
    setError("");
  };

  const handleSubmit = () => {
    const name = draftName.trim();
    if (!name) {
      setError("请输入名称");
      return;
    }
    if (name.length > 20) {
      setError("名称不超过 20 个字");
      return;
    }
    const dup = dicts.find(d =>
      d.type === activeType &&
      d.name === name &&
      (!editing.id || d.id !== editing.id)
    );
    if (dup) {
      setError("同类型下已有相同名称");
      return;
    }
    const sort = Number(draftSort);
    onSave({
      id: editing.id,
      type: activeType,
      name,
      sort: Number.isFinite(sort) && sort > 0 ? Math.floor(sort) : 1,
      enabled: editing.id ? editing.enabled : true
    });
    closeEditor();
    showToast(editing.id ? "已保存" : "已新增", "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--color-ink)" }}>字典表</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-mute)" }}>
            维护会议室表单使用的建筑、设施选项。默认已内置奥城 / 生态城，以及电视 / 白板 / 投影。
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <window.IconPlus /> 新增{typeMeta.label}
        </button>
      </div>

      <div className="dict-tabs">
        {window.DICT_TYPES.map(t => (
          <button
            type="button"
            key={t.id}
            className={`dict-tab ${activeType === t.id ? "active" : ""}`}
            onClick={() => setActiveType(t.id)}
          >
            {t.label}
            <span className="dict-tab-count">{window.dictItems(dicts, t.id, false).length}</span>
          </button>
        ))}
      </div>

      <div className="card-content" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-canvas-soft)", borderBottom: "1px solid var(--color-hairline)", color: "var(--color-body)", fontSize: 13 }}>
              <th style={{ padding: "12px 16px", fontWeight: 500, width: 80 }}>排序</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>名称</th>
              <th style={{ padding: "12px 16px", fontWeight: 500, width: 100 }}>引用</th>
              <th style={{ padding: "12px 16px", fontWeight: 500, width: 90 }}>状态</th>
              <th style={{ padding: "12px 16px", fontWeight: 500, width: 160, textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "60px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <window.IconEmpty />
                    <span style={{ fontSize: 14, color: "var(--color-mute)" }}>暂无{typeMeta.label}字典</span>
                    <button type="button" className="btn btn-primary" onClick={openCreate}>
                      <window.IconPlus /> 新增{typeMeta.label}
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map(item => {
                const used = usageCount(item.name);
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "14px 16px", color: "var(--color-body)" }}>{item.sort}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 500, color: "var(--color-ink)" }}>{item.name}</td>
                    <td style={{ padding: "14px 16px", color: "var(--color-body)" }}>
                      {used > 0 ? `${used} 间会议室` : "未使用"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className={`status-tag ${item.enabled ? "status-tag-success" : "status-tag-disabled"}`}>
                        {item.enabled ? "启用中" : "已停用"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button type="button" className="btn-text" style={{ marginRight: 12 }} onClick={() => openEdit(item)}>
                        编辑
                      </button>
                      <button
                        type="button"
                        className="btn-text"
                        style={{ marginRight: 12 }}
                        onClick={() => onToggle(item)}
                      >
                        {item.enabled ? "停用" : "启用"}
                      </button>
                      <button
                        type="button"
                        className="btn-text-danger"
                        onClick={() => onDelete(item, used)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={closeEditor}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-divider)", fontWeight: 600, fontSize: 15 }}>
              {editing.id ? `编辑${typeMeta.label}` : `新增${typeMeta.label}`}
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "var(--color-body)", marginBottom: 6 }}>名称</label>
                <input
                  type="text"
                  className="input"
                  maxLength={20}
                  placeholder={`例如：${activeType === "building" ? "奥城" : "电视"}`}
                  value={draftName}
                  onChange={e => { setDraftName(e.target.value); setError(""); }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "var(--color-body)", marginBottom: 6 }}>排序</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  style={{ width: 140 }}
                  value={draftSort}
                  onChange={e => setDraftSort(e.target.value)}
                />
              </div>
              {error && <div style={{ color: "var(--color-danger)", fontSize: 12 }}>{error}</div>}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-divider)", display: "flex", justifyContent: "flex-end", gap: 10, backgroundColor: "var(--color-canvas-soft)" }}>
              <button type="button" className="btn btn-secondary" onClick={closeEditor}>取消</button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { DictPage });
