import api from "./axios";
export const getDongTien = (params) => api.get("/dong-tien", { params });
export const getSoDu = () => api.get("/dong-tien/so-du");
export const nhapChiPhi = (data) => api.post("/dong-tien/chi-phi", data);
export const getBaoCao = (params) => api.get("/dong-tien/bao-cao", { params });
export const getKiemQuy = () => api.get("/dong-tien/kiem-quy");
export const luuKiemQuy = (data) => api.post("/dong-tien/kiem-quy", data);
