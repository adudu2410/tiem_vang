import api from "./axios";
export const getThuMua = (params) => api.get("/thu-mua", { params });
export const createThuMua = (data) => api.post("/thu-mua", data);
