import express from "express";
import prisma from "../lib/prisma.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const list = await prisma.phieuDoiVang.findMany({
      include: { khachHang: true, loaiVangCu: true, sanPhamMoi: true },
      orderBy: { taoLuc: "desc" },
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      khachHangId,
      loaiVangCuId,
      trongLuongCuGram,
      giaVangCuApDung,
      sanPhamMoiId,
      giaVangMoiApDung,
      tienCongHangMoi,
      hinhThucThanhToan,
      hinhAnhVangCu,
      ghiChu,
    } = req.body;
    const giaTriVangCu = trongLuongCuGram * (giaVangCuApDung / 3.75);
    const spMoi = await prisma.sanPham.findUnique({
      where: { id: sanPhamMoiId },
    });
    const giaSanPhamMoi = spMoi.trongLuongGram * (giaVangMoiApDung / 3.75);
    const chenhLech = giaSanPhamMoi + tienCongHangMoi - giaTriVangCu;
    const count = await prisma.phieuDoiVang.count();
    const ngay = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const maPhieu = `DV-${ngay}-${String(count + 1).padStart(3, "0")}`;

    const result = await prisma.$transaction(async (tx) => {
      const phieu = await tx.phieuDoiVang.create({
        data: {
          maPhieu,
          khachHangId,
          loaiVangCuId,
          trongLuongCuGram,
          giaVangCuApDung,
          giaTriVangCu,
          sanPhamMoiId,
          giaVangMoiApDung,
          tienCongHangMoi,
          giaSanPhamMoi,
          chenhLech,
          hinhThucThanhToan,
          hinhAnhVangCu,
          ghiChu,
        },
        include: { khachHang: true, loaiVangCu: true, sanPhamMoi: true },
      });
      await tx.sanPham.update({
        where: { id: sanPhamMoiId },
        data: { soLuongTon: { decrement: 1 } },
      });
      const ket = await tx.giaoDichKet.findFirst({
        orderBy: { taoLuc: "desc" },
      });
      await tx.giaoDichKet.create({
        data: {
          loaiGiaoDich: chenhLech >= 0 ? "THU" : "CHI",
          nguonGocType: "DOI_VANG",
          hinhThucThanhToan: hinhThucThanhToan || "TIEN_MAT",
          phieuDoiVangId: phieu.id,
          soTien: Math.abs(chenhLech),
          soduSau: (ket?.soduSau || 0) + chenhLech,
          ghiChu: `Đổi vàng ${maPhieu}`,
        },
      });
      return phieu;
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
