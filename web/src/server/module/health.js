import http from "../http";

/** 后端健康检查（拦截器已拆掉 M0000 信封，这里拿到的是 data.data） */
export const getHealth = () => http.get("/health");
