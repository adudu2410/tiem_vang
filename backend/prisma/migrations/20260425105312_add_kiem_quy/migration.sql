-- CreateTable
CREATE TABLE "kiem_quy" (
    "id" SERIAL NOT NULL,
    "ngayKiem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soDuHeThong" DOUBLE PRECISION NOT NULL,
    "tongTienDem" DOUBLE PRECISION NOT NULL,
    "chenhLech" DOUBLE PRECISION NOT NULL,
    "chiTietMenhGia" JSONB NOT NULL,
    "ghiChu" TEXT,

    CONSTRAINT "kiem_quy_pkey" PRIMARY KEY ("id")
);
