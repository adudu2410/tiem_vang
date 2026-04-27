import api from "./axios";
export const getDoiVang = (params) => api.get("/doi-vang", { params });
export const createDoiVang = (data) => api.post("/doi-vang", data);
