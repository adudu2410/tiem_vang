import express from "express";
import prisma from "../lib/prisma.js";
const router = express.Router();

router.get("/loai-vang", async (req, res) => {
  try {
    res.json(await prisma.loaiVang.findMany({ orderBy: { id: "asc" } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/loai-vang", async (req, res) => {
  try {
    const lv = await prisma.loaiVang.create({ data: req.body });
    res.status(201).json(lv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/loai-vang/:id", async (req, res) => {
  try {
    const lv = await prisma.loaiVang.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(lv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/danh-muc", async (req, res) => {
  try {
    res.json(await prisma.danhMuc.findMany());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/danh-muc", async (req, res) => {
  try {
    res.status(201).json(await prisma.danhMuc.create({ data: req.body }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/danh-muc/:id", async (req, res) => {
  try {
    await prisma.danhMuc.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Đã xóa" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/danh-muc-chi-phi", async (req, res) => {
  try {
    res.json(await prisma.danhMucChiPhi.findMany());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/danh-muc-chi-phi", async (req, res) => {
  try {
    res.status(201).json(await prisma.danhMucChiPhi.create({ data: req.body }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/he-thong", async (req, res) => {
  try {
    const list = await prisma.cauHinhHeThong.findMany();
    const config = {};
    list.forEach((c) => {
      config[c.tenCauHinh] = c.giaTri;
    });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/he-thong", async (req, res) => {
  try {
    const results = await Promise.all(
      Object.entries(req.body).map(([key, value]) =>
        prisma.cauHinhHeThong.upsert({
          where: { tenCauHinh: key },
          update: { giaTri: String(value) },
          create: { tenCauHinh: key, giaTri: String(value) },
        }),
      ),
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
