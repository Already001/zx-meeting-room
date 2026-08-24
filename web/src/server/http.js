import axios from "axios";
import { getToken, setToken, getCorpId, showToastError } from "@/utils";
import { useSessionStorage } from "@vueuse/core";
import { unref } from "vue";

let errorFlag = false;
let IsRefrshToken = false; // 是否正在刷新 token
let currentResponse;

const errorMsg = ["O_T_001", "O_T_002", "O_T_003"];
const retryMap = new Map();

export const baseMap = {
  base: "/api/",
  auth: "/api/oauth",
  meeting: "/meetingApi"
};

// clientType 唯一取值入口是 bootstrapAuthFromUrl()（在各 main.js 挂载前调用），
// 这里只读 sessionStorage，不再重复解析 URL——见 utils/index.js 顶部注释。
const clientType = useSessionStorage("clientType", "app");

export const setClientType = (v) => {
  if (v) {
    clientType.value = v;
  }
};

const http = axios.create({
  baseURL: baseMap.meeting,
  timeout: 30000,
  validateStatus: (status) => status < 400,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
    clientType,
    version: "v1"
  }
});

export const insRequestArgs = [
  (request) => {
    retryRequest(request);
    request.headers.clientType = unref(clientType);
    if (
      request.url.indexOf("/refresh/token") === -1 &&
      request.url.indexOf("/app/login") === -1
    ) {
      const token = getToken("access_token");
      if (token) {
        request.headers.Authorization = `Bearer ${token}`;
      }
      // 调用方可按业务归属显式指定企业，未指定时用当前企业
      if (!request.headers.zxCorpId) {
        request.headers.zxCorpId = getCorpId();
      }
    }
    return request;
  },
  (error) => Promise.reject(error)
];
// @ts-ignore axios 类型未导出 tuple 形态的拦截器参数
http.interceptors.request.use(...insRequestArgs);

export const insResponseArgs = [
  (response) => {
    if (response.status === 200 && errorMsg.includes(response.data.code)) {
      if (response.data.code === "O_T_003") {
        if (!errorFlag) {
          errorFlag = true;
          showToastError(response.data.msg || "登录已过期，请重新登录");
          setTimeout(() => {
            errorFlag = false;
          }, 2000);
        }
        return Promise.reject(response);
      }
      if (!IsRefrshToken) {
        IsRefrshToken = true;
        currentResponse = response;
        return refreshToken()
          // 无论刷新成功/失败/返回假值都要复位，否则此后所有 O_T_001/002
          // 会一直走下面的排队分支，定时器与 pending Promise 永久堆积
          .finally(() => {
            IsRefrshToken = false;
          })
          .then((res) => {
            if (res) {
              const option = { ...currentResponse.config };
              if (typeof currentResponse.config.data === "string") {
                try {
                  option.data = JSON.parse(currentResponse.config.data);
                } catch (error) {
                  option.data = currentResponse.config.data;
                }
              }
              return http(option);
            }
          })
          .catch((error) => {
            showToastError(response.data.msg || "登录已过期，请重新登录");
            return Promise.reject(error);
          });
      }
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const polling = setInterval(() => {
          if (!IsRefrshToken) {
            clearInterval(polling);
            const option = { ...response.config };
            if (typeof response.config.data === "string") {
              try {
                option.data = JSON.parse(response.config.data);
              } catch (error) {
                option.data = response.config.data;
              }
            }
            resolve(http(option));
            return;
          }
          // 最长等待 5s，避免刷新链异常挂起时排队分支无限轮询
          if (Date.now() - start > 5000) {
            clearInterval(polling);
            reject(new Error("等待 token 刷新超时"));
          }
        }, 10);
      });
    }
    if (response.data.code !== "M0000") {
      return Promise.reject(response.data);
    }
    return response.data.data;
  },
  (error = {}) => {
    if (!axios.isCancel(error)) {
      const { config } = error;
      if (config && config.headers) {
        const retrylog = retryMap.get(config.headers.retrykey);
        if (retrylog <= 3) {
          return retryXHR(config);
        }
        retryMap.delete(config.headers.retrykey);
      }
    }
    return Promise.reject(error);
  }
];
// @ts-ignore 同上
http.interceptors.response.use(...insResponseArgs);

export function refreshToken() {
  const refresh_token = getToken("refresh_token");
  return http
    .post("/api/refresh/token", {}, { params: { refresh_token }, baseURL: "" })
    .then((data) => {
      const { access_token, refresh_token } = data;
      setToken({ access_token, refresh_token });
      return data;
    })
    .catch((error) => Promise.reject(error));
}

const retryRequest = (config) => {
  if (!config.headers.retrykey) {
    config.headers.retrykey = `${Date.now()}#${config.url}`;
  }
  const retrylog = retryMap.has(config.headers.retrykey)
    ? retryMap.get(config.headers.retrykey)
    : 0;
  retryMap.set(config.headers.retrykey, retrylog + 1);
};

const retryXHR = (config) => {
  config.url = config.url.replace(config.baseURL, "");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(http(config));
    }, 2000);
  });
};

export default http;
