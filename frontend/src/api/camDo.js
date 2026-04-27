import api from "./axios";
export const getCamDo = (params) => api.get("/cam-do", { params });
export const getCamDoById = (id) => api.get(`/cam-do/${id}`);
export const createCamDo = (data) => api.post("/cam-do", data);
export const chuocDo = (id, data) => api.post(`/cam-do/${id}/chuoc`, data);
export const giaHan = (id, data) => api.post(`/cam-do/${id}/gia-han`, data);
