import api from "./axios";
export const getSanPham = (params) => api.get("/san-pham", { params });
export const getSanPhamById = (id) => api.get(`/san-pham/${id}`);
export const createSanPham = (data) => api.post("/san-pham", data);
export const updateSanPham = (id, data) => api.put(`/san-pham/${id}`, data);
export const deleteSanPham = (id) => api.delete(`/san-pham/${id}`);
