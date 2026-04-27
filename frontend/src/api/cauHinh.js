import api from "./axios";

export const getLoaiVang = () => api.get("/cau-hinh/loai-vang");

export const updateLoaiVang = (id, data) =>
  api.put(`/cau-hinh/loai-vang/${id}`, data);

// 👉 THÊM DÒNG NÀY
export const createLoaiVang = (data) => api.post("/cau-hinh/loai-vang", data);

export const getDanhMuc = () => api.get("/cau-hinh/danh-muc");

export const createDanhMuc = (data) => api.post("/cau-hinh/danh-muc", data);

export const deleteDanhMuc = (id) => api.delete(`/cau-hinh/danh-muc/${id}`);

export const getDanhMucChiPhi = () => api.get("/cau-hinh/danh-muc-chi-phi");

export const createDanhMucChiPhi = (data) =>
  api.post("/cau-hinh/danh-muc-chi-phi", data);

export const getCauHinhHeThong = () => api.get("/cau-hinh/he-thong");

export const updateCauHinhHeThong = (data) =>
  api.put("/cau-hinh/he-thong", data);
