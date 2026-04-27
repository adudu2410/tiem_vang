import api from "./axios";
export const getDichVu = (params) => api.get("/dich-vu", { params });
export const createDichVu = (data) => api.post("/dich-vu", data);
export const doiTrangThai = (id, trangThai) => api.put(`/dich-vu/${id}/trang-thai`, { trangThai });
export const giaoHang = (id, data) => api.post(`/dich-vu/${id}/giao`, data);
export const huyDichVu = (id) => api.post(`/dich-vu/${id}/huy`);
