-- CreateEnum
CREATE TYPE "TrangThaiDV" AS ENUM ('TIEP_NHAN', 'DANG_LAM', 'HOAN_THANH', 'DA_GIAO', 'DA_HUY');

-- AlterEnum
ALTER TYPE "NguonGocType" ADD VALUE 'DICH_VU';

-- AlterTable
ALTER TABLE "giao_dich_ket" ADD COLUMN     "phieuDichVuId" INTEGER;

-- CreateTable
CREATE TABLE "phieu_dich_vu" (
    "id" SERIAL NOT NULL,
    "maPhieu" TEXT NOT NULL,
    "khachHangId" INTEGER,
    "tenKhach" TEXT,
    "sdtKhach" TEXT,
    "loaiDichVu" TEXT NOT NULL,
    "moTaTaiSan" TEXT NOT NULL,
    "moTaCongViec" TEXT,
    "giaTien" DOUBLE PRECISION NOT NULL,
    "hinhThucThanhToan" "HinhThucTT" NOT NULL DEFAULT 'TIEN_MAT',
    "trangThai" "TrangThaiDV" NOT NULL DEFAULT 'TIEP_NHAN',
    "ngayHenTra" TIMESTAMP(3),
    "ghiChu" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phieu_dich_vu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phieu_dich_vu_maPhieu_key" ON "phieu_dich_vu"("maPhieu");

-- AddForeignKey
ALTER TABLE "phieu_dich_vu" ADD CONSTRAINT "phieu_dich_vu_khachHangId_fkey" FOREIGN KEY ("khachHangId") REFERENCES "khach_hang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_ket" ADD CONSTRAINT "giao_dich_ket_phieuDichVuId_fkey" FOREIGN KEY ("phieuDichVuId") REFERENCES "phieu_dich_vu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
