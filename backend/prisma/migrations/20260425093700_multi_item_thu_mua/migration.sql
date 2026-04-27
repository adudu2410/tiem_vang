/*
  Warnings:

  - You are about to drop the column `giaTTLucMua` on the `phieu_thu_mua` table. All the data in the column will be lost.
  - You are about to drop the column `hinhAnhTaiSan` on the `phieu_thu_mua` table. All the data in the column will be lost.
  - You are about to drop the column `loaiVangId` on the `phieu_thu_mua` table. All the data in the column will be lost.
  - You are about to drop the column `trongLuongGram` on the `phieu_thu_mua` table. All the data in the column will be lost.
  - You are about to drop the column `tyLeThuMua` on the `phieu_thu_mua` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "phieu_thu_mua" DROP CONSTRAINT "phieu_thu_mua_loaiVangId_fkey";

-- AlterTable
ALTER TABLE "phieu_thu_mua" DROP COLUMN "giaTTLucMua",
DROP COLUMN "hinhAnhTaiSan",
DROP COLUMN "loaiVangId",
DROP COLUMN "trongLuongGram",
DROP COLUMN "tyLeThuMua",
ADD COLUMN     "hinhThucThanhToan" "HinhThucTT" NOT NULL DEFAULT 'TIEN_MAT';

-- CreateTable
CREATE TABLE "chi_tiet_thu_mua" (
    "id" SERIAL NOT NULL,
    "phieuThuMuaId" INTEGER NOT NULL,
    "loaiVangId" INTEGER NOT NULL,
    "moTa" TEXT,
    "trongLuong" DOUBLE PRECISION NOT NULL,
    "giaThuVao" DOUBLE PRECISION NOT NULL,
    "thanhTien" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "chi_tiet_thu_mua_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "chi_tiet_thu_mua" ADD CONSTRAINT "chi_tiet_thu_mua_phieuThuMuaId_fkey" FOREIGN KEY ("phieuThuMuaId") REFERENCES "phieu_thu_mua"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chi_tiet_thu_mua" ADD CONSTRAINT "chi_tiet_thu_mua_loaiVangId_fkey" FOREIGN KEY ("loaiVangId") REFERENCES "loai_vang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
