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

/** 解析 URL 查询参数 */
export const getUrlParams = (data) => {
  let url = "";
  if (typeof data === "string") {
    if (data.split("?").length && data.split("?")[1])
      url = `?${data.split("?")[1]}`;
  } else {
    url = data.search;
  }
  const result = new Map();
  if (url) {
    const params = url.substring(1).split("&");
    for (let i = 0; i < params.length; i++) {
      const temp = params[i].split("=");
      const currentValue = result.get(temp[0]);
      // URL 查询参数里 + 代表空格
      const value = temp[1] ? temp[1].replace(/\+/g, " ") : temp[1];
      result.set(temp[0], currentValue ?? value);
    }
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
    sessionStorage.setItem("clientType", JSON.stringify(clientType));
  }

  return {
    token: getToken(),
    corpId: getCorpId(),
    clientType: clientType || "app"
  };
};
