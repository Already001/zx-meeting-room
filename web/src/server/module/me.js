import http from "../http";

/** 当前用户身份与权限 */
export const getMe = () => http.get("/me");
