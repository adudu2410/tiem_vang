import express from "express";
import prisma from "../lib/prisma.js";
const router = express.Router();

// >= 10 triệu: 1.500đ/triệu/ngày — dưới 10 triệu: 2.000đ/triệu/ngày
function tinhLai(soTienChoVay, soNgay) {
  const ratePerMillion = soTienChoVay >= 10_000_000 ? 1500 : 2000;
  return (soTienChoVay / 1_000_000) * ratePerMillion * soNgay;
}

router.get("/", async (req, res) => {
  try {
    const { trangThai } = req.query;
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await prisma.hopDongCamDo.updateMany({
      where: { trangThai: "DANG_CAM", ngayDaoHan: { lt: now } },
      data: { trangThai: "QUA_HAN" },
    });
    await prisma.hopDongCamDo.updateMany({
      where: { trangThai: "DANG_CAM", ngayDaoHan: { gte: now, lte: in7Days } },
      data: { trangThai: "SAP_DAO_HAN" },
    });
    const where = trangThai ? { trangThai } : {};
    const list = await prisma.hopDongCamDo.findMany({
      where,
      include: { khachHang: true, loaiVang: true },
      orderBy: { ngayDaoHan: "asc" },
    });
    const result = list.map((hd) => {
      const soNgay = Math.floor((now - new Date(hd.ngayVay)) / 86400000);
      return {
        ...hd,
        soNgayThucTe: soNgay,
        laiPhatSinh: tinhLai(hd.soTienChoVay, soNgay),
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const hd = await prisma.hopDongCamDo.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { khachHang: true, loaiVang: true, thanhToanCamDo: true },
    });
    if (!hd) return res.status(404).json({ error: "Không tìm thấy" });
    const soNgay = Math.floor((new Date() - new Date(hd.ngayVay)) / 86400000);
    const laiPhatSinh = tinhLai(hd.soTienChoVay, soNgay);
    res.json({
      ...hd,
      soNgayThucTe: soNgay,
      laiPhatSinh,
      tongCanTra: hd.soTienChoVay + laiPhatSinh,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      khachHangId,
      loaiVangId,
      moTaTaiSan,
      trongLuongGram,
      giaTriThamDinh,
      soTienChoVay,
      ngayVay,
      ngayDaoHan,
      hinhAnhTaiSan,
      ghiChu,
    } = req.body;
    // Tự tính lãi suất theo bậc thang (lưu đơn vị đ/triệu/ngày)
    const laiSuatNgay = soTienChoVay >= 10_000_000 ? 1500 : 2000;
    const count = await prisma.hopDongCamDo.count();
    const maHopDong = `CD-${String(count + 1).padStart(4, "0")}`;
    const result = await prisma.$transaction(async (tx) => {
      const hd = await tx.hopDongCamDo.create({
        data: {
          maHopDong,
          khachHangId,
          loaiVangId,
          moTaTaiSan,
          trongLuongGram,
          giaTriThamDinh,
          soTienChoVay,
          laiSuatNgay,
          ngayVay: new Date(ngayVay),
          ngayDaoHan: new Date(ngayDaoHan),
          hinhAnhTaiSan,
          ghiChu,
        },
        include: { khachHang: true },
      });
      const ket = await tx.giaoDichKet.findFirst({
        orderBy: { taoLuc: "desc" },
      });
      await tx.giaoDichKet.create({
        data: {
          loaiGiaoDich: "CHI",
          nguonGocType: "CAM_DO_GIAI_NGAN",
          hinhThucThanhToan: "TIEN_MAT",
          hopDongId: hd.id,
          soTien: soTienChoVay,
          soduSau: (ket?.soduSau || 0) - soTienChoVay,
          ghiChu: `Giải ngân ${maHopDong}`,
        },
      });
      return hd;
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/chuoc", async (req, res) => {
  try {
    const { hinhThucThanhToan } = req.body;
    const hd = await prisma.hopDongCamDo.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!hd) return res.status(404).json({ error: "Không tìm thấy" });
    const soNgay = Math.floor((new Date() - new Date(hd.ngayVay)) / 86400000);
    const tienLai = tinhLai(hd.soTienChoVay, soNgay);
    const tongTien = hd.soTienChoVay + tienLai;
    await prisma.$transaction(async (tx) => {
      await tx.hopDongCamDo.update({
        where: { id: hd.id },
        data: { trangThai: "DA_CHUOC" },
      });
      await tx.thanhToanCamDo.create({
        data: {
          hopDongId: hd.id,
          loaiThanhToan: "CHUOC_DO",
          ngayThanhToan: new Date(),
          soNgayThucTe: soNgay,
          tienGoc: hd.soTienChoVay,
          tienLai,
          tongTien,
        },
      });
      const ket = await tx.giaoDichKet.findFirst({
        orderBy: { taoLuc: "desc" },
      });
      await tx.giaoDichKet.create({
        data: {
          loaiGiaoDich: "THU",
          nguonGocType: "CAM_DO_CHUOC",
          hinhThucThanhToan: hinhThucThanhToan || "TIEN_MAT",
          hopDongId: hd.id,
          soTien: tongTien,
          soduSau: (ket?.soduSau || 0) + tongTien,
          ghiChu: `Chuộc đồ ${hd.maHopDong}`,
        },
      });
    });
    res.json({ message: "Chuộc đồ thành công", tongTien });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/gia-han", async (req, res) => {
  try {
    const { ngayDaoHanMoi, ghiChu } = req.body;
    const hd = await prisma.hopDongCamDo.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    const soNgay = Math.floor((new Date() - new Date(hd.ngayVay)) / 86400000);
    const tienLai = tinhLai(hd.soTienChoVay, soNgay);
    await prisma.$transaction(async (tx) => {
      await tx.hopDongCamDo.update({
        where: { id: hd.id },
        data: { ngayDaoHan: new Date(ngayDaoHanMoi), trangThai: "DANG_CAM" },
      });
      await tx.thanhToanCamDo.create({
        data: {
          hopDongId: hd.id,
          loaiThanhToan: "GIA_HAN",
          ngayThanhToan: new Date(),
          soNgayThucTe: soNgay,
          tienGoc: hd.soTienChoVay,
          tienLai,
          tongTien: tienLai,
          ngayDaoHanMoi: new Date(ngayDaoHanMoi),
          ghiChu,
        },
      });
    });
    res.json({ message: "Gia hạn thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
