import express from "express";
import prisma from "../lib/prisma.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const list = await prisma.phieuThuMua.findMany({
      include: {
        khachHang: true,
        chiTiet: { include: { loaiVang: true } },
      },
      orderBy: { taoLuc: "desc" },
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { khachHangId, ghiChu, hinhThucThanhToan, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Chưa có món hàng nào" });
    }

    const tongTienTraKhach = items.reduce((sum, item) => sum + item.thanhTien, 0);
    const count = await prisma.phieuThuMua.count();
    const ngay = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const maPhieu = `TM-${ngay}-${String(count + 1).padStart(3, "0")}`;

    const result = await prisma.$transaction(async (tx) => {
      const phieu = await tx.phieuThuMua.create({
        data: {
          maPhieu,
          khachHangId: khachHangId || null,
          tongTienTraKhach,
          hinhThucThanhToan: hinhThucThanhToan || "TIEN_MAT",
          ghiChu,
          chiTiet: {
            create: items.map((item) => ({
              loaiVangId: item.loaiVangId,
              moTa: item.moTa || null,
              trongLuong: item.trongLuong,
              giaThuVao: item.giaThuVao,
              thanhTien: item.thanhTien,
            })),
          },
        },
        include: {
          khachHang: true,
          chiTiet: { include: { loaiVang: true } },
        },
      });

      const ket = await tx.giaoDichKet.findFirst({
        orderBy: { taoLuc: "desc" },
      });
      await tx.giaoDichKet.create({
        data: {
          loaiGiaoDich: "CHI",
          nguonGocType: "THU_MUA",
          hinhThucThanhToan: hinhThucThanhToan || "TIEN_MAT",
          phieuThuMuaId: phieu.id,
          soTien: tongTienTraKhach,
          soduSau: (ket?.soduSau || 0) - tongTienTraKhach,
          ghiChu: `Thu mua ${maPhieu} (${items.length} món)`,
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
