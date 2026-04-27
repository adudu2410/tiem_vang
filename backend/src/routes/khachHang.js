import express from "express";
import prisma from "../lib/prisma.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search)
      where.OR = [
        { hoTen: { contains: search, mode: "insensitive" } },
        { sdt: { contains: search } },
        { cccd: { contains: search } },
      ];
    const list = await prisma.khachHang.findMany({
      where,
      include: { _count: { select: { hoaDonBan: true, hopDongCamDo: true } } },
      orderBy: { taoLuc: "desc" },
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const kh = await prisma.khachHang.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        hoaDonBan: { orderBy: { taoLuc: "desc" }, take: 10 },
        hopDongCamDo: { orderBy: { taoLuc: "desc" }, take: 10 },
        phieuThuMua: { orderBy: { taoLuc: "desc" }, take: 10 },
        phieuDoiVang: { orderBy: { taoLuc: "desc" }, take: 10 },
      },
    });
    if (!kh) return res.status(404).json({ error: "Không tìm thấy" });
    res.json(kh);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const kh = await prisma.khachHang.create({ data: req.body });
    res.status(201).json(kh);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const kh = await prisma.khachHang.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(kh);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
