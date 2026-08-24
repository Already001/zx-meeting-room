export * from "./dialog";

/** 取 token（本期只从 sessionStorage 读，来源见 bootstrapAuthFromUrl） */
export const getToken = (type = "access_token") => {
  try {
    const token = JSON.parse(sessionStorage.getItem("meetingToken") || "null");
    return token ? token[type] : null;
  } catch (error) {
    return null;
  }
};

/** 保存 token */
export const setToken = (data) => {
  sessionStorage.setItem("meetingToken", JSON.stringify(data));
};

/** 取企业 ID */
export const getCorpId = () => sessionStorage.getItem("meetingCorpId");

/** 解析 URL 查询参数（用 URLSearchParams 按规范处理 + 与 %XX 转义） */
export const getUrlParams = (data) => {
  const qs =
    typeof data === "string" ? data.split("?")[1] || "" : data.search;
  const sp = new URLSearchParams(qs);
  const result = new Map();
  for (const [k] of sp) {
    // 同名参数保留首个值，与旧实现行为一致
    if (!result.has(k)) result.set(k, sp.get(k));
  }
  return result;
};

/**
 * 本期登录态入口：从 URL query 取 token / corpId / clientType 落 sessionStorage，
 * 没带参数时沿用已有的 sessionStorage 值。
 * 后续接 JSBridge（wnsdk.meeting.* 或 window.webview.ipcRenderer）时只改这一个函数，
 * 不要在组件里各写一份取 token 逻辑。
 */
export const bootstrapAuthFromUrl = () => {
  const params = getUrlParams(location.href);
  const token = params.get("token");
  const corpId = params.get("corpId");
  const clientType = params.get("clientType");

  if (token) {
    setToken({ access_token: token, refresh_token: params.get("refreshToken") || "" });
  }
  if (corpId) {
    sessionStorage.setItem("meetingCorpId", corpId);
  }
  if (clientType) {
    sessionStorage.setItem("clientType", clientType);
  }

  // 落盘之后再清理地址栏里的敏感参数，避免明文 token 残留（Referer/日志泄露）
  if (token || corpId || clientType) {
    const u = new URL(location.href);
    ["token", "refreshToken", "corpId", "clientType"].forEach((k) => u.searchParams.delete(k));
    history.replaceState(null, "", u.toString());
  }

  return {
    token: getToken(),
    corpId: getCorpId(),
    clientType: clientType || "app"
  };
};
