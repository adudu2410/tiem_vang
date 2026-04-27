import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import BanHang from "./pages/BanHang";
import KhoHang from "./pages/KhoHang";
import ThuMua from "./pages/ThuMua";
import DoiVang from "./pages/DoiVang";
import CamDo from "./pages/CamDo";
import KhachHang from "./pages/KhachHang";
import DongTien from "./pages/DongTien";
import CauHinh from "./pages/CauHinh";
import DichVu from "./pages/DichVu";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ban-hang" element={<BanHang />} />
          <Route path="/kho-hang" element={<KhoHang />} />
          <Route path="/thu-mua" element={<ThuMua />} />
          <Route path="/doi-vang" element={<DoiVang />} />
          <Route path="/cam-do" element={<CamDo />} />
          <Route path="/dich-vu" element={<DichVu />} />
          <Route path="/khach-hang" element={<KhachHang />} />
          <Route path="/dong-tien" element={<DongTien />} />
          <Route path="/cau-hinh" element={<CauHinh />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
