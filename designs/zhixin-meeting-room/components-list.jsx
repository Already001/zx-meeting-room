// Room List Page Component

const RoomListPage = ({ rooms, dicts, onNavigateNew, onNavigateEdit, onToggleEnable }) => {
  const [keyword, setKeyword] = React.useState("");
  const [debouncedKeyword, setDebouncedKeyword] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all"); // all | true | false
  const [buildingFilter, setBuildingFilter] = React.useState("");
  const [floorFilter, setFloorFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  // Debounce search input by 300ms
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [keyword]);

  // Derive unique buildings from current room data
  const availableBuildings = React.useMemo(() => {
    const set = new Set(window.dictNames(dicts, "building"));
    rooms.forEach(r => {
      if (r.buildingName) set.add(r.buildingName);
    });
    return Array.from(set);
  }, [rooms, dicts]);

  // Derive available floors based on building filter
  const availableFloors = React.useMemo(() => {
    const set = new Set();
    rooms.forEach(r => {
      if (!buildingFilter || r.buildingName === buildingFilter) {
        if (r.floorName) set.add(r.floorName);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [rooms, buildingFilter]);

  // When building changes, reset floor if it's no longer present
  React.useEffect(() => {
    if (floorFilter && !availableFloors.includes(floorFilter)) {
      setFloorFilter("");
    }
  }, [buildingFilter, availableFloors]);

  // Reset all filters
  const handleReset = () => {
    setKeyword("");
    setDebouncedKeyword("");
    setStatusFilter("all");
    setBuildingFilter("");
    setFloorFilter("");
    setPage(1);
  };

  // Filtered rooms
  const filteredRooms = React.useMemo(() => {
    return rooms.filter(room => {
      if (debouncedKeyword && !room.name.includes(debouncedKeyword)) {
        return false;
      }
      if (statusFilter === "true" && !room.enabled) return false;
      if (statusFilter === "false" && room.enabled) return false;
      if (buildingFilter && room.buildingName !== buildingFilter) return false;
      if (floorFilter && room.floorName !== floorFilter) return false;
      return true;
    });
  }, [rooms, debouncedKeyword, statusFilter, buildingFilter, floorFilter]);

  // Pagination calculation
  const total = filteredRooms.length;
  const paginatedRooms = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRooms.slice(start, start + pageSize);
  }, [filteredRooms, page, pageSize]);

  const hasFilter = Boolean(keyword || statusFilter !== "all" || buildingFilter || floorFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top Action Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--color-ink)" }}>会议室管理</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-mute)" }}>
            维护企业会议室主数据、位置、设施与预定规则
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNavigateNew}>
          <window.IconPlus /> 新建会议室
        </button>
      </div>

      {/* Filter Card */}
      <div className="card-content" style={{ padding: "16px 20px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "260px 160px 160px 160px auto",
          gap: 12,
          alignItems: "center"
        }}>
          {/* Keyword Search */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              className="input"
              placeholder="搜索会议室"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              style={{ paddingLeft: 30 }}
            />
            <div style={{ position: "absolute", left: 10, top: 9, color: "var(--color-mute)", pointerEvents: "none" }}>
              <window.IconSearch />
            </div>
          </div>

          {/* Status Filter */}
          <select
            className="select"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">状态：全部</option>
            <option value="true">启用中</option>
            <option value="false">已停用</option>
          </select>

          {/* Building Filter */}
          <select
            className="select"
            value={buildingFilter}
            onChange={e => { setBuildingFilter(e.target.value); setPage(1); }}
          >
            <option value="">建筑：全部</option>
            {availableBuildings.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Floor Filter */}
          <select
            className="select"
            value={floorFilter}
            onChange={e => { setFloorFilter(e.target.value); setPage(1); }}
          >
            <option value="">楼层：全部</option>
            {availableFloors.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          {/* Reset button */}
          <div style={{ justifySelf: "end" }}>
            <button className="btn btn-secondary" onClick={handleReset}>
              重置
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card-content" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-canvas-soft)", borderBottom: "1px solid var(--color-hairline)", color: "var(--color-body)", fontSize: 13 }}>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>名称</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>建筑</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>楼层</th>
              <th style={{ padding: "12px 16px", fontWeight: 500, width: 90 }}>容纳人数</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>设施</th>
              <th style={{ padding: "12px 16px", fontWeight: 500, width: 140 }}>开放时间</th>
              <th style={{ padding: "12px 16px", fontWeight: 500, width: 90 }}>状态</th>
              <th style={{ padding: "12px 16px", fontWeight: 500, width: 140, textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRooms.length > 0 ? (
              paginatedRooms.map(room => (
                <tr key={room.id} style={{ borderBottom: "1px solid var(--color-divider)", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--color-canvas-soft)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontWeight: 500, color: "var(--color-ink)" }}>
                    <div>{room.name}</div>
                    {room.groupName && (
                      <div style={{ fontSize: 12, color: "var(--color-mute)", marginTop: 2 }}>
                        分组：{room.groupName}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--color-body)" }}>{room.buildingName}</td>
                  <td style={{ padding: "14px 16px", color: "var(--color-body)" }}>{room.floorName}</td>
                  <td style={{ padding: "14px 16px", color: "var(--color-body)" }}>{room.capacity}人</td>
                  <td style={{ padding: "14px 16px", color: "var(--color-body)", fontSize: 13 }}>
                    {window.formatFacilities(room.facilities, dicts)}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--color-body)", fontSize: 13 }}>
                    {room.openStart} - {room.openEnd}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className={`status-tag ${room.enabled ? 'status-tag-success' : 'status-tag-disabled'}`}>
                      {room.enabled ? "启用中" : "已停用"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      className="btn-text"
                      style={{ marginRight: 12 }}
                      onClick={() => onNavigateEdit(room.id)}
                    >
                      编辑
                    </button>
                    {room.enabled ? (
                      <button
                        className="btn-text-danger"
                        onClick={() => onToggleEnable(room, false)}
                      >
                        停用
                      </button>
                    ) : (
                      <button
                        className="btn-text"
                        onClick={() => onToggleEnable(room, true)}
                      >
                        启用
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: "60px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <window.IconEmpty />
                    <span style={{ fontSize: 14, color: "var(--color-mute)" }}>
                      {hasFilter ? "没有符合条件的会议室" : "暂无会议室"}
                    </span>
                    {!hasFilter && (
                      <button className="btn btn-primary" onClick={onNavigateNew} style={{ marginTop: 4 }}>
                        <window.IconPlus /> 新建会议室
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination bar */}
        {total > 0 && (
          <div style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--color-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
            color: "var(--color-body)"
          }}>
            <span>共 {total} 条记录</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                className="btn btn-secondary"
                style={{ height: 26, padding: "0 8px", fontSize: 12 }}
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </button>
              <span style={{ padding: "0 8px" }}>
                {page} / {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <button
                className="btn btn-secondary"
                style={{ height: 26, padding: "0 8px", fontSize: 12 }}
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, {
  RoomListPage
});
