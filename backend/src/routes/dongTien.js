import express from "express";
import prisma from "../lib/prisma.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { loai, nguonGoc, tuNgay, denNgay, hinhThucTT } = req.query;
    const where = {};
    if (loai) where.loaiGiaoDich = loai;
    if (nguonGoc) where.nguonGocType = nguonGoc;
    if (hinhThucTT) where.hinhThucThanhToan = hinhThucTT;
    if (tuNgay || denNgay) {
      where.taoLuc = {};
      if (tuNgay) where.taoLuc.gte = new Date(tuNgay);
      if (denNgay) where.taoLuc.lte = new Date(denNgay);
    }
    const list = await prisma.giaoDichKet.findMany({
      where,
      orderBy: { taoLuc: "desc" },
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/so-du", async (req, res) => {
  try {
    const cuoi = await prisma.giaoDichKet.findFirst({
      orderBy: { taoLuc: "desc" },
    });
    const homNayStart = new Date();
    homNayStart.setHours(0, 0, 0, 0);
    const homNay = await prisma.giaoDichKet.findMany({
      where: { taoLuc: { gte: homNayStart } },
    });
    // Số dư riêng tiền mặt / chuyển khoản
    const agg = await prisma.giaoDichKet.groupBy({
      by: ["hinhThucThanhToan", "loaiGiaoDich"],
      _sum: { soTien: true },
    });
    const getSum = (httt, loai) =>
      agg.find((a) => a.hinhThucThanhToan === httt && a.loaiGiaoDich === loai)
        ?._sum.soTien || 0;
    const soDuTienMat =
      getSum("TIEN_MAT", "THU") - getSum("TIEN_MAT", "CHI");
    const soDuChuyenKhoan =
      getSum("CHUYEN_KHOAN", "THU") - getSum("CHUYEN_KHOAN", "CHI");

    // Kiểm quỹ gần nhất
    let tienThucTe = null;
    let tienThucTeCapNhat = null;
    try {
      const kq = await prisma.kiemQuy.findFirst({ orderBy: { ngayKiem: "desc" } });
      tienThucTe = kq?.tongTienDem ?? null;
      tienThucTeCapNhat = kq?.ngayKiem ?? null;
    } catch { /* bỏ qua nếu bảng chưa tồn tại */ }

    res.json({
      soDuHienTai: cuoi?.soduSau || 0,
      soDuTienMat,
      soDuChuyenKhoan,
      tongThuHomNay: homNay
        .filter((g) => g.loaiGiaoDich === "THU")
        .reduce((s, g) => s + g.soTien, 0),
      tongChiHomNay: homNay
        .filter((g) => g.loaiGiaoDich === "CHI")
        .reduce((s, g) => s + g.soTien, 0),
      capNhatLuc: cuoi?.taoLuc,
      tienThucTe,
      tienThucTeCapNhat,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/chi-phi", async (req, res) => {
  try {
    const { tenChiPhi, danhMucId, soTien, ngayChi, ghiChu, hinhThucThanhToan } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const chiPhi = await tx.chiPhiVanHanh.create({
        data: {
          tenChiPhi,
          danhMucId,
          soTien,
          ngayChi: new Date(ngayChi),
          ghiChu,
        },
      });
      const ket = await tx.giaoDichKet.findFirst({
        orderBy: { taoLuc: "desc" },
      });
      await tx.giaoDichKet.create({
        data: {
          loaiGiaoDich: "CHI",
          nguonGocType: "CHI_PHI",
          hinhThucThanhToan: hinhThucThanhToan || "TIEN_MAT",
          chiPhiId: chiPhi.id,
          soTien,
          soduSau: (ket?.soduSau || 0) - soTien,
          ghiChu: tenChiPhi,
        },
      });
      return chiPhi;
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/bao-cao", async (req, res) => {
  try {
    const { thang, nam } = req.query;
    const tuNgay = new Date(
      nam || new Date().getFullYear(),
      (thang || new Date().getMonth() + 1) - 1,
      1,
    );
    const denNgay = new Date(
      tuNgay.getFullYear(),
      tuNgay.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const gd = await prisma.giaoDichKet.findMany({
      where: { taoLuc: { gte: tuNgay, lte: denNgay } },
    });
    const tongThu = gd
      .filter((g) => g.loaiGiaoDich === "THU")
      .reduce((s, g) => s + g.soTien, 0);
    const tongChi = gd
      .filter((g) => g.loaiGiaoDich === "CHI")
      .reduce((s, g) => s + g.soTien, 0);
    const chiPhi = await prisma.chiPhiVanHanh.findMany({
      where: { ngayChi: { gte: tuNgay, lte: denNgay } },
      include: { danhMuc: true },
    });
    res.json({
      tongThu,
      tongChi,
      loiNhuan: tongThu - tongChi,
      chiPhi,
      tuNgay,
      denNgay,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/kiem-quy", async (req, res) => {
  try {
    const list = await prisma.kiemQuy.findMany({
      orderBy: { ngayKiem: "desc" },
      take: 30,
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/kiem-quy", async (req, res) => {
  try {
    const { soDuHeThong, tienMenhGia, tienDongTep, tongTienDem, chiTietMenhGia, ghiChu } = req.body;
    const result = await prisma.kiemQuy.create({
      data: {
        soDuHeThong,
        tienMenhGia,
        tienDongTep: tienDongTep || 0,
        tongTienDem,
        chenhLech: tongTienDem - soDuHeThong,
        chiTietMenhGia,
        ghiChu: ghiChu || null,
      },
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
