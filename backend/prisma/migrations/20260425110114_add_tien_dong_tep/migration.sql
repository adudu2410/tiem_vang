/*
  Warnings:

  - Added the required column `tienMenhGia` to the `kiem_quy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "kiem_quy" ADD COLUMN     "tienDongTep" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tienMenhGia" DOUBLE PRECISION NOT NULL;
