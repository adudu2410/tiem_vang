import express from "express";
import prisma from "../lib/prisma.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { trangThai, tuNgay } = req.query;
    const where = {};
    if (trangThai) where.trangThai = trangThai;
    if (tuNgay) where.taoLuc = { gte: new Date(tuNgay) };
    const list = await prisma.phieuDichVu.findMany({
      where,
      include: { khachHang: true },
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
      khachHangId, tenKhach, sdtKhach,
      loaiDichVu, moTaTaiSan, moTaCongViec,
      giaTien, hinhThucThanhToan, ngayHenTra, ghiChu,
    } = req.body;

    const count = await prisma.phieuDichVu.count();
    const ngay = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const maPhieu = `DV-${ngay}-${String(count + 1).padStart(3, "0")}`;

    const phieu = await prisma.phieuDichVu.create({
      data: {
        maPhieu,
        khachHangId: khachHangId || null,
        tenKhach: tenKhach || null,
        sdtKhach: sdtKhach || null,
        loaiDichVu,
        moTaTaiSan,
        moTaCongViec: moTaCongViec || null,
        giaTien,
        hinhThucThanhToan: hinhThucThanhToan || "TIEN_MAT",
        ngayHenTra: ngayHenTra ? new Date(ngayHenTra) : null,
        ghiChu: ghiChu || null,
      },
      include: { khachHang: true },
    });
    res.status(201).json(phieu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật trạng thái (TIEP_NHAN → DANG_LAM → HOAN_THANH)
router.put("/:id/trang-thai", async (req, res) => {
  try {
    const { trangThai } = req.body;
    const phieu = await prisma.phieuDichVu.update({
      where: { id: parseInt(req.params.id) },
      data: { trangThai },
      include: { khachHang: true },
    });
    res.json(phieu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Giao hàng + thu tiền → tạo GiaoDichKet
router.post("/:id/giao", async (req, res) => {
  try {
    const { hinhThucThanhToan } = req.body;
    const phieu = await prisma.phieuDichVu.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!phieu) return res.status(404).json({ error: "Không tìm thấy phiếu" });
    if (phieu.trangThai === "DA_GIAO")
      return res.status(400).json({ error: "Phiếu đã được giao trước đó" });
    if (phieu.trangThai === "DA_HUY")
      return res.status(400).json({ error: "Phiếu đã bị hủy" });

    const httt = hinhThucThanhToan || phieu.hinhThucThanhToan;

    await prisma.$transaction(async (tx) => {
      await tx.phieuDichVu.update({
        where: { id: phieu.id },
        data: { trangThai: "DA_GIAO", hinhThucThanhToan: httt },
      });
      const ket = await tx.giaoDichKet.findFirst({ orderBy: { taoLuc: "desc" } });
      await tx.giaoDichKet.create({
        data: {
          loaiGiaoDich: "THU",
          nguonGocType: "DICH_VU",
          hinhThucThanhToan: httt,
          phieuDichVuId: phieu.id,
          soTien: phieu.giaTien,
          soduSau: (ket?.soduSau || 0) + phieu.giaTien,
          ghiChu: `Dịch vụ ${phieu.maPhieu} — ${phieu.loaiDichVu}`,
        },
      });
    });

    res.json({ message: "Giao hàng và thu tiền thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hủy phiếu
router.post("/:id/huy", async (req, res) => {
  try {
    const phieu = await prisma.phieuDichVu.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!phieu) return res.status(404).json({ error: "Không tìm thấy phiếu" });
    if (phieu.trangThai === "DA_HUY")
      return res.status(400).json({ error: "Phiếu đã bị hủy trước đó" });
    if (phieu.trangThai === "DA_GIAO")
      return res.status(400).json({ error: "Phiếu đã giao, không thể hủy" });

    await prisma.phieuDichVu.update({
      where: { id: phieu.id },
      data: { trangThai: "DA_HUY" },
    });
    res.json({ message: "Đã hủy phiếu dịch vụ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
