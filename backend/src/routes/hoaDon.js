import express from "express";
import prisma from "../lib/prisma.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, trangThai, tuNgay, denNgay } = req.query;
    const where = {};
    if (trangThai) where.trangThai = trangThai;
    if (tuNgay || denNgay) {
      where.taoLuc = {};
      if (tuNgay) where.taoLuc.gte = new Date(tuNgay);
      if (denNgay) where.taoLuc.lte = new Date(denNgay);
    }
    const list = await prisma.hoaDonBan.findMany({
      where,
      include: {
        khachHang: true,
        chiTietHoaDon: {
          include: { sanPham: { include: { loaiVang: true } } },
        },
      },
      orderBy: { taoLuc: "desc" },
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const hd = await prisma.hoaDonBan.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        khachHang: true,
        chiTietHoaDon: { include: { sanPham: true } },
      },
    });
    if (!hd) return res.status(404).json({ error: "Không tìm thấy" });
    res.json(hd);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      khachHangId,
      chiTietHoaDon,
      chieuKhauPhanTram,
      hinhThucThanhToan,
      ghiChu,
    } = req.body;
    const count = await prisma.hoaDonBan.count();
    const ngay = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const maHd = `HD-${ngay}-${String(count + 1).padStart(3, "0")}`;
    const tongTien = chiTietHoaDon.reduce((s, i) => s + i.thanhTien, 0);
    const tongSauChieuKhau =
      tongTien - (tongTien * (chieuKhauPhanTram || 0)) / 100;

    const result = await prisma.$transaction(async (tx) => {
      const hd = await tx.hoaDonBan.create({
        data: {
          maHd,
          khachHangId,
          tongTien,
          chieuKhauPhanTram: chieuKhauPhanTram || 0,
          tongSauChieuKhau,
          hinhThucThanhToan,
          trangThai: "HOAN_TAT",
          ghiChu,
          chiTietHoaDon: { create: chiTietHoaDon },
        },
        include: { chiTietHoaDon: true },
      });
      for (const item of chiTietHoaDon) {
        await tx.sanPham.update({
          where: { id: item.sanPhamId },
          data: { soLuongTon: { decrement: item.soLuong } },
        });
      }
      if (khachHangId) {
        await tx.khachHang.update({
          where: { id: khachHangId },
          data: {
            tongDiem: { increment: Math.floor(tongSauChieuKhau / 100000) },
          },
        });
      }
      const ket = await tx.giaoDichKet.findFirst({
        orderBy: { taoLuc: "desc" },
      });
      await tx.giaoDichKet.create({
        data: {
          loaiGiaoDich: "THU",
          nguonGocType: "BAN_HANG",
          hinhThucThanhToan: hinhThucThanhToan || "TIEN_MAT",
          hoaDonId: hd.id,
          soTien: tongSauChieuKhau,
          soduSau: (ket?.soduSau || 0) + tongSauChieuKhau,
          ghiChu: `Bán hàng ${maHd}`,
        },
      });
      return hd;
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/huy", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const hd = await prisma.hoaDonBan.findUnique({
      where: { id },
      include: { chiTietHoaDon: true },
    });
    if (!hd) return res.status(404).json({ error: "Không tìm thấy hóa đơn" });
    if (hd.trangThai === "DA_HUY")
      return res.status(400).json({ error: "Hóa đơn đã được hủy trước đó" });

    await prisma.$transaction(async (tx) => {
      // 1. Đánh dấu hủy
      await tx.hoaDonBan.update({
        where: { id },
        data: { trangThai: "DA_HUY" },
      });

      // 2. Hoàn trả tồn kho
      for (const ct of hd.chiTietHoaDon) {
        await tx.sanPham.update({
          where: { id: ct.sanPhamId },
          data: { soLuongTon: { increment: ct.soLuong } },
        });
      }

      // 3. Điều chỉnh GiaoDichKet: zero-out entry và cascade số dư
      const gd = await tx.giaoDichKet.findFirst({ where: { hoaDonId: id } });
      if (gd) {
        const amount = gd.soTien;
        await tx.giaoDichKet.update({
          where: { id: gd.id },
          data: {
            soTien: 0,
            soduSau: gd.soduSau - amount,
            ghiChu: `[ĐÃ HỦY] ${gd.ghiChu || ""}`,
          },
        });
        await tx.giaoDichKet.updateMany({
          where: { id: { gt: gd.id } },
          data: { soduSau: { increment: -amount } },
        });
      }

      // 4. Hoàn điểm tích lũy
      if (hd.khachHangId) {
        const diem = Math.floor(hd.tongSauChieuKhau / 100000);
        if (diem > 0) {
          await tx.khachHang.update({
            where: { id: hd.khachHangId },
            data: { tongDiem: { decrement: diem } },
          });
        }
      }
    });

    res.json({ message: "Hủy hóa đơn thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { khachHangId, chieuKhauPhanTram, hinhThucThanhToan, ghiChu, chiTiet } = req.body;

    const hd = await prisma.hoaDonBan.findUnique({
      where: { id },
      include: { chiTietHoaDon: { include: { sanPham: true } } },
    });
    if (!hd) return res.status(404).json({ error: "Không tìm thấy hóa đơn" });

    const tongTien = chiTiet.reduce((s, i) => s + i.thanhTien, 0);
    const tongSauChieuKhau = tongTien - (tongTien * (chieuKhauPhanTram || 0)) / 100;
    const diff = tongSauChieuKhau - hd.tongSauChieuKhau;

    await prisma.$transaction(async (tx) => {
      await tx.hoaDonBan.update({
        where: { id },
        data: {
          khachHangId: khachHangId || null,
          tongTien,
          chieuKhauPhanTram: chieuKhauPhanTram || 0,
          tongSauChieuKhau,
          hinhThucThanhToan,
          ghiChu,
        },
      });

      for (const ct of chiTiet) {
        await tx.chiTietHoaDon.update({
          where: { id: ct.id },
          data: {
            giaVangApDung: ct.giaVangApDung,
            tienCong: ct.tienCong,
            donGia: ct.donGia,
            thanhTien: ct.thanhTien,
          },
        });
      }

      // Cập nhật GiaoDichKet và các giao dịch sau đó
      const gd = await tx.giaoDichKet.findFirst({ where: { hoaDonId: id } });
      if (gd && diff !== 0) {
        await tx.giaoDichKet.update({
          where: { id: gd.id },
          data: {
            soTien: tongSauChieuKhau,
            soduSau: gd.soduSau + diff,
            hinhThucThanhToan,
          },
        });
        await tx.giaoDichKet.updateMany({
          where: { id: { gt: gd.id } },
          data: { soduSau: { increment: diff } },
        });
      } else if (gd) {
        await tx.giaoDichKet.update({
          where: { id: gd.id },
          data: { hinhThucThanhToan },
        });
      }

      // Điều chỉnh điểm tích lũy
      const oldPoints = Math.floor(hd.tongSauChieuKhau / 100000);
      const newPoints = Math.floor(tongSauChieuKhau / 100000);

      if (hd.khachHangId && hd.khachHangId !== (khachHangId || null)) {
        // Khách thay đổi: hoàn điểm cho KH cũ, cộng cho KH mới
        await tx.khachHang.update({
          where: { id: hd.khachHangId },
          data: { tongDiem: { decrement: oldPoints } },
        });
        if (khachHangId) {
          await tx.khachHang.update({
            where: { id: khachHangId },
            data: { tongDiem: { increment: newPoints } },
          });
        }
      } else if (hd.khachHangId && oldPoints !== newPoints) {
        // Cùng KH nhưng số tiền đổi → điều chỉnh điểm
        await tx.khachHang.update({
          where: { id: hd.khachHangId },
          data: { tongDiem: { increment: newPoints - oldPoints } },
        });
      } else if (!hd.khachHangId && khachHangId) {
        // Thêm KH mới vào HĐ không có KH trước
        await tx.khachHang.update({
          where: { id: khachHangId },
          data: { tongDiem: { increment: newPoints } },
        });
      }
    });

    const result = await prisma.hoaDonBan.findUnique({
      where: { id },
      include: {
        khachHang: true,
        chiTietHoaDon: { include: { sanPham: { include: { loaiVang: true } } } },
      },
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
