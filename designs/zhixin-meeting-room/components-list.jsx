// Room List Page Component

const RoomListPage = ({ rooms, onNavigateNew, onNavigateEdit, onToggleEnable }) => {
  const [keyword, setKeyword] = React.useState("");
  const [debouncedKeyword, setDebouncedKeyword] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [buildingFilter, setBuildingFilter] = React.useState("");
  const [floorFilter, setFloorFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [keyword]);

  const availableBuildings = React.useMemo(() => {
    const set = new Set();
    rooms.forEach(r => {
      if (r.buildingName) set.add(r.buildingName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [rooms]);

  const availableFloors = React.useMemo(() => {
    const set = new Set();
    rooms.forEach(r => {
      if (!buildingFilter || r.buildingName === buildingFilter) {
        if (r.floorName) set.add(r.floorName);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [rooms, buildingFilter]);

  React.useEffect(() => {
    if (floorFilter && !availableFloors.includes(floorFilter)) {
      setFloorFilter("");
    }
  }, [buildingFilter, availableFloors]);

  const handleReset = () => {
    setKeyword("");
    setDebouncedKeyword("");
    setStatusFilter("all");
    setBuildingFilter("");
    setFloorFilter("");
    setPage(1);
  };

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

  const total = filteredRooms.length;
  const paginatedRooms = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRooms.slice(start, start + pageSize);
  }, [filteredRooms, page, pageSize]);

  const hasFilter = Boolean(keyword || statusFilter !== "all" || buildingFilter || floorFilter);

  return (
    <div className="page-stack">
      <div className="page-head">
        <div className="page-head-copy">
          <h1 className="type-title-lg">会议室管理</h1>
          <p className="page-desc">维护企业会议室主数据、位置、设施与预定规则</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onNavigateNew}>
          <window.IconPlus /> 新建会议室
        </button>
      </div>

      <div className="card-content filter-bar">
        <div className="filter-bar-grid">
          <div className="filter-search">
            <label className="sr-only" htmlFor="room-search">搜索会议室</label>
            <input
              id="room-search"
              type="search"
              className="input"
              placeholder="搜索会议室"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              autoComplete="off"
            />
            <div className="filter-search-icon">
              <window.IconSearch />
            </div>
          </div>

          <label className="sr-only" htmlFor="room-status-filter">状态</label>
          <select
            id="room-status-filter"
            className="select"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">状态：全部</option>
            <option value="true">启用中</option>
            <option value="false">已停用</option>
          </select>

          <label className="sr-only" htmlFor="room-building-filter">建筑</label>
          <select
            id="room-building-filter"
            className="select"
            value={buildingFilter}
            onChange={e => { setBuildingFilter(e.target.value); setPage(1); }}
          >
            <option value="">建筑：全部</option>
            {availableBuildings.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <label className="sr-only" htmlFor="room-floor-filter">楼层</label>
          <select
            id="room-floor-filter"
            className="select"
            value={floorFilter}
            onChange={e => { setFloorFilter(e.target.value); setPage(1); }}
          >
            <option value="">楼层：全部</option>
            {availableFloors.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <div className="filter-bar-reset">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="card-content table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>建筑</th>
                <th>楼层</th>
                <th style={{ width: 90 }}>容纳人数</th>
                <th>设施</th>
                <th style={{ width: 140 }}>开放时间</th>
                <th style={{ width: 90 }}>状态</th>
                <th className="col-actions" style={{ width: 140 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRooms.length > 0 ? (
                paginatedRooms.map(room => (
                  <tr key={room.id}>
                    <td className="col-name">
                      <div>{room.name}</div>
                      {room.groupName && (
                        <div className="table-sub">分组：{room.groupName}</div>
                      )}
                    </td>
                    <td>{room.buildingName}</td>
                    <td>{room.floorName}</td>
                    <td className="col-num">{room.capacity}人</td>
                    <td className="col-sm">
                      {room.facilities && room.facilities.length > 0
                        ? window.FACILITY_OPTIONS.filter(f => room.facilities.includes(f)).join(" / ")
                        : "—"}
                    </td>
                    <td className="col-sm col-num">
                      {room.openStart} - {room.openEnd}
                    </td>
                    <td>
                      <span className={`status-tag ${room.enabled ? "status-tag-success" : "status-tag-disabled"}`}>
                        {room.enabled ? "启用中" : "已停用"}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button type="button" className="btn-text" onClick={() => onNavigateEdit(room.id)}>
                        编辑
                      </button>
                      {room.enabled ? (
                        <button type="button" className="btn-text-danger" onClick={() => onToggleEnable(room, false)}>
                          停用
                        </button>
                      ) : (
                        <button type="button" className="btn-text" onClick={() => onToggleEnable(room, true)}>
                          启用
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    <div className="empty-state">
                      <window.IconEmpty />
                      <span className="type-display-lg">
                        {hasFilter ? "没有符合条件的会议室" : "暂无会议室"}
                      </span>
                      <span className="type-body-md empty-state-caption">
                        {hasFilter ? "试试调整筛选条件" : "新建一间会议室后即可维护主数据"}
                      </span>
                      {hasFilter ? (
                        <button type="button" className="btn btn-secondary" onClick={handleReset}>
                          重置筛选
                        </button>
                      ) : (
                        <button type="button" className="btn btn-primary" onClick={onNavigateNew}>
                          <window.IconPlus /> 新建会议室
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="table-foot">
            <span>共 {total} 条记录</span>
            <div className="table-pager">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </button>
              <span className="table-page-num">
                {page} / {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
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
