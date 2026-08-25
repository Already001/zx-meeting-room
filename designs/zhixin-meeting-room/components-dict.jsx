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
    <div className="page-stack">
      <div className="page-head">
        <div className="page-head-copy">
          <h1 className="type-title-lg">字典表</h1>
          <p className="page-desc">
            维护会议室表单使用的建筑、设施选项。默认已内置奥城 / 生态城，以及电视 / 白板 / 投影。
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <window.IconPlus /> 新增{typeMeta.label}
        </button>
      </div>

      <div className="dict-tabs" role="tablist" aria-label="字典类型">
        {window.DICT_TYPES.map(t => (
          <button
            type="button"
            key={t.id}
            role="tab"
            aria-selected={activeType === t.id}
            className={`dict-tab${activeType === t.id ? " is-active" : ""}`}
            onClick={() => setActiveType(t.id)}
          >
            {t.label}
            <span className="dict-tab-count">{window.dictItems(dicts, t.id, false).length}</span>
          </button>
        ))}
      </div>

      <div className="card-content table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>排序</th>
                <th>名称</th>
                <th style={{ width: 120 }}>引用</th>
                <th style={{ width: 90 }}>状态</th>
                <th className="col-actions" style={{ width: 180 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    <div className="empty-state">
                      <window.IconEmpty />
                      <span className="empty-state-caption">暂无{typeMeta.label}字典</span>
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
                    <tr key={item.id}>
                      <td className="col-num">{item.sort}</td>
                      <td className="col-name">{item.name}</td>
                      <td>{used > 0 ? `${used} 间会议室` : "未使用"}</td>
                      <td>
                        <span className={`status-tag ${item.enabled ? "status-tag-success" : "status-tag-disabled"}`}>
                          {item.enabled ? "启用中" : "已停用"}
                        </span>
                      </td>
                      <td className="col-actions">
                        <button type="button" className="btn-text" onClick={() => openEdit(item)}>
                          编辑
                        </button>
                        <button type="button" className="btn-text" onClick={() => onToggle(item)}>
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
      </div>

      {editing && (
        <div className="modal-overlay" onClick={closeEditor}>
          <div className="modal-card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-head">
              <span className="type-title-sm">
                {editing.id ? `编辑${typeMeta.label}` : `新增${typeMeta.label}`}
              </span>
            </div>
            <div className="modal-body dict-editor-fields">
              <div>
                <label className="form-label" htmlFor="dict-name">名称</label>
                <input
                  id="dict-name"
                  type="text"
                  className="input"
                  maxLength={20}
                  placeholder={`例如：${activeType === "building" ? "奥城" : "电视"}`}
                  value={draftName}
                  onChange={e => { setDraftName(e.target.value); setError(""); }}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="dict-sort">排序</label>
                <input
                  id="dict-sort"
                  type="number"
                  min={1}
                  className="input w-140"
                  value={draftSort}
                  onChange={e => setDraftSort(e.target.value)}
                />
              </div>
              {error && <div className="form-error" role="alert">{error}</div>}
            </div>
            <div className="modal-foot">
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
