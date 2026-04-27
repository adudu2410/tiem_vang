import api from "./axios";
export const getHoaDon = (params) => api.get("/hoa-don", { params });
export const getHoaDonById = (id) => api.get(`/hoa-don/${id}`);
export const createHoaDon = (data) => api.post("/hoa-don", data);
export const updateHoaDon = (id, data) => api.put(`/hoa-don/${id}`, data);
export const huyHoaDon = (id) => api.post(`/hoa-don/${id}/huy`);
