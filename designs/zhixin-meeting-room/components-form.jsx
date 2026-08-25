// Room Form Page Component (New / Edit)

const RoomFormPage = ({ initialRoom, existingRooms, dicts, onSave, onCancel, showToast }) => {
  const isEdit = Boolean(initialRoom && initialRoom.id);

  // Form State
  const [formData, setFormData] = React.useState(() => {
    if (isEdit) {
      return {
        name: initialRoom.name || "",
        groupName: initialRoom.groupName || "",
        buildingName: initialRoom.buildingName || "",
        floorName: initialRoom.floorName || "",
        capacity: initialRoom.capacity || "",
        facilities: initialRoom.facilities ? [...initialRoom.facilities] : [],
        locationNote: initialRoom.locationNote || "",
        openStart: initialRoom.openStart || "07:00",
        openEnd: initialRoom.openEnd || "23:00",
        bookAheadDays: initialRoom.bookAheadDays || 90,
        needApproval: Boolean(initialRoom.needApproval),
        allowRecurring: Boolean(initialRoom.allowRecurring),
        allowPreempt: Boolean(initialRoom.allowPreempt),
        enabled: initialRoom.enabled !== undefined ? initialRoom.enabled : true
      };
    }
    return {
      name: "",
      groupName: "",
      buildingName: "",
      floorName: "",
      capacity: "",
      facilities: [],
      locationNote: "",
      openStart: "07:00",
      openEnd: "23:00",
      bookAheadDays: 90,
      needApproval: false,
      allowRecurring: false,
      allowPreempt: false,
      enabled: true
    };
  });

  // Snapshot for dirty check
  const [initialSnapshot] = React.useState(() => JSON.stringify(formData));
  const isDirty = React.useMemo(() => {
    return JSON.stringify(formData) !== initialSnapshot;
  }, [formData, initialSnapshot]);

  // Errors state
  const [errors, setErrors] = React.useState({});
  const [isSaving, setIsSaving] = React.useState(false);

  // Derive existing buildings from rooms for dropdown suggestions
  const dictBuildings = React.useMemo(() => {
    const names = window.dictNames(dicts, "building");
    if (formData.buildingName && !names.includes(formData.buildingName)) {
      return [formData.buildingName, ...names];
    }
    return names;
  }, [dicts, formData.buildingName]);

  const facilityOptions = React.useMemo(() => {
    const names = window.dictNames(dicts, "facility");
    const extra = (formData.facilities || []).filter(f => !names.includes(f));
    return [...names, ...extra];
  }, [dicts, formData.facilities]);

  // Derive existing floors for current building
  const existingFloors = React.useMemo(() => {
    const set = new Set();
    existingRooms.forEach(r => {
      if (r.buildingName === formData.buildingName && r.floorName) {
        set.add(r.floorName);
      }
    });
    return Array.from(set);
  }, [existingRooms, formData.buildingName]);

  // Field change helpers
  const handleFieldChange = (key, value) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      if (key === "buildingName" && value !== prev.buildingName) {
        // Reset floor when building changes per spec F-2.2 / 7.3
        next.floorName = "";
      }
      return next;
    });

    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateField = (key, data = formData) => {
    const errs = {};
    const trimmedName = (data.name || "").trim();
    if (key === "name") {
      if (!trimmedName) {
        errs.name = "请输入名称";
      } else if (trimmedName.length > 30) {
        errs.name = "名称不超过 30 个字";
      } else if (data.enabled) {
        const duplicate = existingRooms.find(r => {
          if (isEdit && r.id === initialRoom.id) return false;
          return r.enabled && r.name === trimmedName;
        });
        if (duplicate) {
          errs.name = isEdit ? "已有同名启用中的会议室，请修改名称" : "该名称已被使用";
        }
      }
    }
    if (key === "buildingName" && (!data.buildingName || !data.buildingName.trim())) {
      errs.buildingName = "请选择或输入建筑";
    }
    if (key === "floorName" && (!data.floorName || !data.floorName.trim())) {
      errs.floorName = "请选择或输入楼层";
    }
    if (key === "capacity") {
      const cap = Number(data.capacity);
      if (!data.capacity || isNaN(cap) || cap < 1 || cap > 999 || !Number.isInteger(cap)) {
        errs.capacity = "请输入容纳人数（1-999整数）";
      }
    }
    if (key === "openHours") {
      if (!data.openStart || !data.openEnd) {
        errs.openHours = "请选择开放时间";
      } else if (data.openEnd <= data.openStart) {
        errs.openHours = "结束时间必须晚于开始时间";
      }
    }
    setErrors(prev => {
      const next = { ...prev };
      ["name", "buildingName", "floorName", "capacity", "openHours"].forEach((field) => {
        if (field === key) {
          if (errs[field]) next[field] = errs[field];
          else delete next[field];
        }
      });
      return next;
    });
  };

  const handleFieldBlur = (key) => {
    validateField(key);
  };

  const handleFacilityToggle = (item) => {
    setFormData(prev => {
      const exists = prev.facilities.includes(item);
      const nextFacilities = exists
        ? prev.facilities.filter(f => f !== item)
        : [...prev.facilities, item];
      // 按字典表顺序排列
      const sorted = facilityOptions.filter(f => nextFacilities.includes(f));
      return { ...prev, facilities: sorted };
    });
  };

  // Validation
  const validate = () => {
    const errs = {};
    const trimmedName = (formData.name || "").trim();
    if (!trimmedName) {
      errs.name = "请输入名称";
    } else if (trimmedName.length > 30) {
      errs.name = "名称不超过 30 个字";
    } else {
      // Check duplicate name for enabled rooms
      const isTargetEnabled = formData.enabled;
      if (isTargetEnabled) {
        const duplicate = existingRooms.find(r => {
          if (isEdit && r.id === initialRoom.id) return false;
          return r.enabled && r.name === trimmedName;
        });
        if (duplicate) {
          errs.name = isEdit ? "已有同名启用中的会议室，请修改名称" : "该名称已被使用";
        }
      }
    }

    if (!formData.buildingName || !formData.buildingName.trim()) {
      errs.buildingName = "请选择或输入建筑";
    }
    if (!formData.floorName || !formData.floorName.trim()) {
      errs.floorName = "请选择或输入楼层";
    }
    const cap = Number(formData.capacity);
    if (!formData.capacity || isNaN(cap) || cap < 1 || cap > 999 || !Number.isInteger(cap)) {
      errs.capacity = "请输入容纳人数（1-999整数）";
    }

    if (!formData.openStart || !formData.openEnd) {
      errs.openHours = "请选择开放时间";
    } else if (formData.openEnd <= formData.openStart) {
      errs.openHours = "结束时间必须晚于开始时间";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaving) return;

    if (!validate()) {
      showToast("请检查表单必填项", "error");
      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector("form .input.error, form select.error");
        if (firstInvalid) firstInvalid.focus();
      });
      return;
    }

    setIsSaving(true);
    // Prepare payload
    const payload = {
      name: formData.name.trim(),
      groupName: formData.groupName.trim() || null,
      buildingName: formData.buildingName.trim(),
      floorName: formData.floorName.trim(),
      capacity: Number(formData.capacity),
      facilities: formData.facilities,
      locationNote: formData.locationNote.trim() || null,
      openStart: formData.openStart,
      openEnd: formData.openEnd,
      bookAheadDays: Number(formData.bookAheadDays),
      needApproval: Boolean(formData.needApproval),
      allowRecurring: Boolean(formData.allowRecurring),
      allowPreempt: Boolean(formData.allowPreempt),
      enabled: Boolean(formData.enabled)
    };

    setTimeout(() => {
      setIsSaving(false);
      onSave(payload, isEdit ? initialRoom.id : null);
    }, 200);
  };

  return (
    <div className="form-page">
      <div className="form-page-head">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onCancel(isDirty)}
        >
          <window.IconBack /> 返回
        </button>
        <h1 className="type-title-lg">
          {isEdit ? "编辑会议室" : "新建会议室"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="form-stack">
        <div className="card-content">
          <h2 className="form-section-title">基本信息</h2>

          <div className="form-stack">
            <div className="form-row">
              <label htmlFor="room-name" className="form-label-strong">
                <span className="form-req" aria-hidden="true">*</span>会议室名称
              </label>
              <div>
                <input
                  id="room-name"
                  type="text"
                  maxLength={30}
                  className={`input ${errors.name ? 'error' : ''}`}
                  placeholder="例如：1号会议室（1-30字）"
                  value={formData.name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "room-name-error" : undefined}
                  onChange={e => handleFieldChange("name", e.target.value)}
                  onBlur={() => handleFieldBlur("name")}
                />
                {errors.name && (
                  <div id="room-name-error" className="form-error" role="alert">{errors.name}</div>
                )}
              </div>
            </div>

            {/* 所属分组 */}
            <div className="form-row">
              <label htmlFor="room-group" className="form-label">
                所属分组
              </label>
              <div>
                <input
                  id="room-group"
                  type="text"
                  maxLength={20}
                  className="input"
                  placeholder="选填，例如：研发区 / 高管区（上限20字）"
                  value={formData.groupName}
                  onChange={e => handleFieldChange("groupName", e.target.value)}
                />
              </div>
            </div>

            {/* 建筑与楼层 */}
            <div className="form-row">
              <label className="form-label-strong">
                <span className="form-req">*</span>所在位置
              </label>
              <div className="form-split">
                <div>
                  <label className="sr-only" htmlFor="room-building">建筑</label>
                  <input
                    id="room-building"
                    type="text"
                    list="building-list"
                    className={`input ${errors.buildingName ? 'error' : ''}`}
                    placeholder="选择或输入建筑（选项来自字典表）"
                    value={formData.buildingName}
                    aria-invalid={Boolean(errors.buildingName)}
                    aria-describedby={errors.buildingName ? "room-building-error" : undefined}
                    onChange={e => handleFieldChange("buildingName", e.target.value)}
                    onBlur={() => handleFieldBlur("buildingName")}
                  />
                  <datalist id="building-list">
                    {dictBuildings.map(b => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                  {errors.buildingName && (
                    <div id="room-building-error" className="form-error" role="alert">{errors.buildingName}</div>
                  )}
                </div>

                <div>
                  <label className="sr-only" htmlFor="room-floor">楼层</label>
                  <input
                    id="room-floor"
                    type="text"
                    list="floor-list"
                    disabled={!formData.buildingName}
                    className={`input ${errors.floorName ? 'error' : ''}`}
                    placeholder={formData.buildingName ? "选择或输入楼层" : "请先选择/输入建筑"}
                    value={formData.floorName}
                    aria-invalid={Boolean(errors.floorName)}
                    aria-describedby={errors.floorName ? "room-floor-error" : undefined}
                    onChange={e => handleFieldChange("floorName", e.target.value)}
                    onBlur={() => handleFieldBlur("floorName")}
                  />
                  <datalist id="floor-list">
                    {existingFloors.map(f => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                  {errors.floorName && (
                    <div id="room-floor-error" className="form-error" role="alert">{errors.floorName}</div>
                  )}
                </div>
              </div>
            </div>

            {/* 容纳人数 */}
            <div className="form-row">
              <label htmlFor="room-capacity" className="form-label-strong">
                <span className="form-req" aria-hidden="true">*</span>容纳人数
              </label>
              <div className="form-inline">
                <input
                  id="room-capacity"
                  type="number"
                  min={1}
                  max={999}
                  className={`input w-140 ${errors.capacity ? 'error' : ''}`}
                  placeholder="1-999"
                  value={formData.capacity}
                  aria-invalid={Boolean(errors.capacity)}
                  aria-describedby={errors.capacity ? "room-capacity-error" : undefined}
                  onChange={e => handleFieldChange("capacity", e.target.value)}
                  onBlur={() => handleFieldBlur("capacity")}
                />
                <span>人</span>
                {errors.capacity && (
                  <span id="room-capacity-error" className="form-error" role="alert">{errors.capacity}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: 会议室设施 */}
        <div className="card-content">
          <h2 className="form-section-title">会议室设施</h2>

          <div className="form-facilities">
            {facilityOptions.length === 0 ? (
              <span className="form-hint">请先在「字典表」维护设施选项</span>
            ) : (
              facilityOptions.map(item => (
                <label key={item} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(item)}
                    onChange={() => handleFacilityToggle(item)}
                  />
                  {item}
                </label>
              ))
            )}
          </div>
        </div>

        {/* Section 3: 预定规则 */}
        <div className="card-content">
          <h2 className="form-section-title">预定规则</h2>

          <div className="form-stack">
            <div className="form-row">
              <label htmlFor="room-open-start" className="form-label-strong">
                <span className="form-req" aria-hidden="true">*</span>开放时间
              </label>
              <div>
                <div className="form-inline">
                  <input
                    id="room-open-start"
                    type="time"
                    className={`input w-140 ${errors.openHours ? 'error' : ''}`}
                    value={formData.openStart}
                    aria-invalid={Boolean(errors.openHours)}
                    onChange={e => handleFieldChange("openStart", e.target.value)}
                    onBlur={() => handleFieldBlur("openHours")}
                  />
                  <span className="text-mute">至</span>
                  <input
                    id="room-open-end"
                    type="time"
                    className={`input w-140 ${errors.openHours ? 'error' : ''}`}
                    value={formData.openEnd}
                    aria-invalid={Boolean(errors.openHours)}
                    aria-describedby={errors.openHours ? "room-open-error" : undefined}
                    onChange={e => handleFieldChange("openEnd", e.target.value)}
                    onBlur={() => handleFieldBlur("openHours")}
                  />
                </div>
                {errors.openHours && (
                  <div id="room-open-error" className="form-error" role="alert">{errors.openHours}</div>
                )}
              </div>
            </div>

            {/* 可提前预定范围 */}
            <div className="form-row">
              <label htmlFor="room-book-ahead" className="form-label-strong">
                <span className="form-req" aria-hidden="true">*</span>提前预定
              </label>
              <div>
                <select
                  id="room-book-ahead"
                  className="select w-220"
                  value={formData.bookAheadDays}
                  onChange={e => handleFieldChange("bookAheadDays", Number(e.target.value))}
                >
                  {window.BOOK_AHEAD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 开关选项 */}
            <div className="form-row form-row-center">
              <label className="form-label">预定需审批</label>
              <div className="form-inline">
                <label className="switch">
                  <span className="sr-only">预定需审批</span>
                  <input
                    type="checkbox"
                    checked={formData.needApproval}
                    onChange={e => handleFieldChange("needApproval", e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
                <span className="form-hint">
                  {formData.needApproval ? "开启" : "关闭"}（仅数据落库）
                </span>
              </div>
            </div>

            <div className="form-row form-row-center">
              <label className="form-label">允许周期预定</label>
              <div className="form-inline">
                <label className="switch">
                  <span className="sr-only">允许周期预定</span>
                  <input
                    type="checkbox"
                    checked={formData.allowRecurring}
                    onChange={e => handleFieldChange("allowRecurring", e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
                <span className="form-hint">
                  {formData.allowRecurring ? "开启" : "关闭"}（仅数据落库）
                </span>
              </div>
            </div>

            <div className="form-row form-row-center">
              <label className="form-label">支持会议室抢占</label>
              <div className="form-inline">
                <label className="switch">
                  <span className="sr-only">支持会议室抢占</span>
                  <input
                    type="checkbox"
                    checked={formData.allowPreempt}
                    onChange={e => handleFieldChange("allowPreempt", e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
                <span className="form-hint">
                  {formData.allowPreempt ? "开启" : "关闭"}（仅数据落库）
                </span>
              </div>
            </div>

            {/* 初始状态 */}
            <div className="form-row form-row-center">
              <label className="form-label-strong">
                <span className="form-req">*</span>状态
              </label>
              <div className="form-inline" style={{ gap: 20 }}>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="roomStatus"
                    checked={formData.enabled === true}
                    onChange={() => handleFieldChange("enabled", true)}
                  />
                  启用中
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="roomStatus"
                    checked={formData.enabled === false}
                    onChange={() => handleFieldChange("enabled", false)}
                  />
                  已停用
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: 备注 */}
        <div className="card-content">
          <h2 className="form-section-title">备注信息</h2>

          <div className="form-row">
            <label htmlFor="room-note" className="form-label">
              备注
            </label>
            <div>
              <textarea
                id="room-note"
                className="input"
                maxLength={100}
                placeholder="门牌、投影仪连接线、特定使用须知等补充信息（上限100字）"
                value={formData.locationNote}
                onChange={e => handleFieldChange("locationNote", e.target.value)}
              />
              <div className="form-count">
                {(formData.locationNote || "").length} / 100
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="form-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onCancel(isDirty)}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
};

Object.assign(window, {
  RoomFormPage
});
