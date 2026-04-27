import express from "express";
import prisma from "../lib/prisma.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, danhMucId, loaiVangId, nguonGoc } = req.query;
    const where = {};
    if (search)
      where.OR = [
        { ten: { contains: search, mode: "insensitive" } },
        { maSp: { contains: search, mode: "insensitive" } },
      ];
    if (danhMucId) where.danhMucId = parseInt(danhMucId);
    if (loaiVangId) where.loaiVangId = parseInt(loaiVangId);
    if (nguonGoc) where.nguonGoc = nguonGoc;
    const list = await prisma.sanPham.findMany({
      where,
      include: { danhMuc: true, loaiVang: true },
      orderBy: { taoLuc: "desc" },
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const sp = await prisma.sanPham.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { danhMuc: true, loaiVang: true },
    });
    if (!sp) return res.status(404).json({ error: "Không tìm thấy" });
    res.json(sp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const count = await prisma.sanPham.count();
    const maSp = `SP-${String(count + 1).padStart(5, "0")}`;
    const sp = await prisma.sanPham.create({
      data: { maSp, ...req.body },
      include: { danhMuc: true, loaiVang: true },
    });
    res.status(201).json(sp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const sp = await prisma.sanPham.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: { danhMuc: true, loaiVang: true },
    });
    res.json(sp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.sanPham.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Đã xóa sản phẩm" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
