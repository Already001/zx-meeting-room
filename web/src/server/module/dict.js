import http from "../http";

export const listDicts = (type) =>
  http.get("/dicts", { params: type ? { type } : {} });

export const createDict = (payload) => http.post("/dicts", payload);

export const updateDict = (id, payload) => http.put(`/dicts/${id}`, payload);

export const setDictEnabled = (id, enabled) =>
  http.put(`/dicts/${id}/enabled`, { enabled });

export const deleteDict = (id) => http.delete(`/dicts/${id}`);
