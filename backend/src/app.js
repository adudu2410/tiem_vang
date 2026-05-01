import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "dotenv/config";
import sanPhamRoutes from "./routes/sanPham.js";
import hoaDonRoutes from "./routes/hoaDon.js";
import khachHangRoutes from "./routes/khachHang.js";
import thuMuaRoutes from "./routes/thuMua.js";
import doiVangRoutes from "./routes/doiVang.js";
import camDoRoutes from "./routes/camDo.js";
import dongTienRoutes from "./routes/dongTien.js";
import cauHinhRoutes from "./routes/cauHinh.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server đang chạy rất mượt" });
});

app.use("/api/san-pham", sanPhamRoutes);
app.use("/api/hoa-don", hoaDonRoutes);
app.use("/api/khach-hang", khachHangRoutes);
app.use("/api/thu-mua", thuMuaRoutes);
app.use("/api/doi-vang", doiVangRoutes);
app.use("/api/cam-do", camDoRoutes);
app.use("/api/dong-tien", dongTienRoutes);
app.use("/api/cau-hinh", cauHinhRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Lỗi server", message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
