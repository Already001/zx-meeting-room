import http from "../http";

/** 分页列表；空 keyword/building/floor 不带，enabled 为 undefined 时不带 */
export const listRooms = ({
  keyword,
  enabled,
  buildingName,
  floorName,
  page,
  pageSize
} = {}) => {
  const params = {};
  if (keyword) params.keyword = keyword;
  if (buildingName) params.buildingName = buildingName;
  if (floorName) params.floorName = floorName;
  if (enabled !== undefined) params.enabled = enabled;
  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.pageSize = pageSize;
  return http.get("/rooms", { params });
};

export const getRoom = (id) => http.get(`/rooms/${id}`);

export const createRoom = (payload) => http.post("/rooms", payload);

export const updateRoom = (id, payload) => http.put(`/rooms/${id}`, payload);

export const setRoomEnabled = (id, enabled) =>
  http.put(`/rooms/${id}/enabled`, { enabled });
