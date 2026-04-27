-- CreateEnum
CREATE TYPE "NguonGoc" AS ENUM ('NHAP_MOI', 'THU_MUA');

-- CreateEnum
CREATE TYPE "HinhThucTT" AS ENUM ('TIEN_MAT', 'CHUYEN_KHOAN');

-- CreateEnum
CREATE TYPE "TrangThaiHD" AS ENUM ('NHAP', 'HOAN_TAT', 'DA_HUY');

-- CreateEnum
CREATE TYPE "TrangThaiCD" AS ENUM ('DANG_CAM', 'SAP_DAO_HAN', 'QUA_HAN', 'DA_CHUOC', 'DA_THANH_LY');

-- CreateEnum
CREATE TYPE "LoaiTTCD" AS ENUM ('CHUOC_DO', 'GIA_HAN', 'TRA_LAI', 'THANH_LY');

-- CreateEnum
CREATE TYPE "LoaiGD" AS ENUM ('THU', 'CHI');

-- CreateEnum
CREATE TYPE "NguonGocType" AS ENUM ('BAN_HANG', 'THU_MUA', 'DOI_VANG', 'CAM_DO_GIAI_NGAN', 'CAM_DO_CHUOC', 'CAM_DO_LAI', 'CHI_PHI', 'DIEU_CHINH');

-- CreateTable
CREATE TABLE "khach_hang" (
    "id" SERIAL NOT NULL,
    "hoTen" TEXT NOT NULL,
    "sdt" TEXT NOT NULL,
    "cccd" TEXT,
    "ngaySinh" TIMESTAMP(3),
    "diaChi" TEXT,
    "tongDiem" INTEGER NOT NULL DEFAULT 0,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "khach_hang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loai_vang" (
    "id" SERIAL NOT NULL,
    "ten" TEXT NOT NULL,
    "kyHieu" TEXT NOT NULL,
    "giaMuaVao" DOUBLE PRECISION NOT NULL,
    "giaBanRa" DOUBLE PRECISION NOT NULL,
    "capNhatLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loai_vang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cau_hinh_he_thong" (
    "id" SERIAL NOT NULL,
    "tenCauHinh" TEXT NOT NULL,
    "giaTri" TEXT NOT NULL,
    "moTa" TEXT,
    "capNhatLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cau_hinh_he_thong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "danh_muc" (
    "id" SERIAL NOT NULL,
    "ten" TEXT NOT NULL,
    "moTa" TEXT,

    CONSTRAINT "danh_muc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "san_pham" (
    "id" SERIAL NOT NULL,
    "maSp" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "danhMucId" INTEGER NOT NULL,
    "loaiVangId" INTEGER NOT NULL,
    "trongLuongChi" DOUBLE PRECISION NOT NULL,
    "trongLuongGram" DOUBLE PRECISION NOT NULL,
    "soLuongTon" INTEGER NOT NULL DEFAULT 0,
    "soLuongToiThieu" INTEGER NOT NULL DEFAULT 1,
    "giaVon" DOUBLE PRECISION NOT NULL,
    "giaBan" DOUBLE PRECISION NOT NULL,
    "tienCongMacDinh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nguonGoc" "NguonGoc" NOT NULL DEFAULT 'NHAP_MOI',
    "hinhAnh" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "san_pham_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hoa_don_ban" (
    "id" SERIAL NOT NULL,
    "maHd" TEXT NOT NULL,
    "khachHangId" INTEGER,
    "tongTien" DOUBLE PRECISION NOT NULL,
    "chieuKhauPhanTram" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tongSauChieuKhau" DOUBLE PRECISION NOT NULL,
    "hinhThucThanhToan" "HinhThucTT" NOT NULL,
    "trangThai" "TrangThaiHD" NOT NULL DEFAULT 'HOAN_TAT',
    "ghiChu" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hoa_don_ban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chi_tiet_hoa_don" (
    "id" SERIAL NOT NULL,
    "hoaDonId" INTEGER NOT NULL,
    "sanPhamId" INTEGER NOT NULL,
    "soLuong" INTEGER NOT NULL,
    "giaVangApDung" DOUBLE PRECISION NOT NULL,
    "tienCong" DOUBLE PRECISION NOT NULL,
    "donGia" DOUBLE PRECISION NOT NULL,
    "thanhTien" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "chi_tiet_hoa_don_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phieu_thu_mua" (
    "id" SERIAL NOT NULL,
    "maPhieu" TEXT NOT NULL,
    "khachHangId" INTEGER,
    "loaiVangId" INTEGER NOT NULL,
    "trongLuongGram" DOUBLE PRECISION NOT NULL,
    "giaTTLucMua" DOUBLE PRECISION NOT NULL,
    "tyLeThuMua" DOUBLE PRECISION NOT NULL,
    "tongTienTraKhach" DOUBLE PRECISION NOT NULL,
    "hinhAnhTaiSan" TEXT,
    "ghiChu" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phieu_thu_mua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phieu_doi_vang" (
    "id" SERIAL NOT NULL,
    "maPhieu" TEXT NOT NULL,
    "khachHangId" INTEGER,
    "loaiVangCuId" INTEGER NOT NULL,
    "trongLuongCuGram" DOUBLE PRECISION NOT NULL,
    "giaVangCuApDung" DOUBLE PRECISION NOT NULL,
    "giaTriVangCu" DOUBLE PRECISION NOT NULL,
    "sanPhamMoiId" INTEGER NOT NULL,
    "giaVangMoiApDung" DOUBLE PRECISION NOT NULL,
    "tienCongHangMoi" DOUBLE PRECISION NOT NULL,
    "giaSanPhamMoi" DOUBLE PRECISION NOT NULL,
    "chenhLech" DOUBLE PRECISION NOT NULL,
    "hinhThucThanhToan" "HinhThucTT" NOT NULL,
    "hinhAnhVangCu" TEXT,
    "ghiChu" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phieu_doi_vang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hop_dong_cam_do" (
    "id" SERIAL NOT NULL,
    "maHopDong" TEXT NOT NULL,
    "khachHangId" INTEGER NOT NULL,
    "loaiVangId" INTEGER NOT NULL,
    "moTaTaiSan" TEXT NOT NULL,
    "trongLuongGram" DOUBLE PRECISION NOT NULL,
    "giaTriThamDinh" DOUBLE PRECISION NOT NULL,
    "soTienChoVay" DOUBLE PRECISION NOT NULL,
    "laiSuatNgay" DOUBLE PRECISION NOT NULL,
    "ngayVay" TIMESTAMP(3) NOT NULL,
    "ngayDaoHan" TIMESTAMP(3) NOT NULL,
    "trangThai" "TrangThaiCD" NOT NULL DEFAULT 'DANG_CAM',
    "hinhAnhTaiSan" TEXT,
    "ghiChu" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hop_dong_cam_do_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thanh_toan_cam_do" (
    "id" SERIAL NOT NULL,
    "hopDongId" INTEGER NOT NULL,
    "loaiThanhToan" "LoaiTTCD" NOT NULL,
    "ngayThanhToan" TIMESTAMP(3) NOT NULL,
    "soNgayThucTe" INTEGER NOT NULL,
    "tienGoc" DOUBLE PRECISION NOT NULL,
    "tienLai" DOUBLE PRECISION NOT NULL,
    "tongTien" DOUBLE PRECISION NOT NULL,
    "ngayDaoHanMoi" TIMESTAMP(3),
    "ghiChu" TEXT,

    CONSTRAINT "thanh_toan_cam_do_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "danh_muc_chi_phi" (
    "id" SERIAL NOT NULL,
    "ten" TEXT NOT NULL,
    "moTa" TEXT,

    CONSTRAINT "danh_muc_chi_phi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chi_phi_van_hanh" (
    "id" SERIAL NOT NULL,
    "tenChiPhi" TEXT NOT NULL,
    "danhMucId" INTEGER NOT NULL,
    "soTien" DOUBLE PRECISION NOT NULL,
    "ngayChi" TIMESTAMP(3) NOT NULL,
    "ghiChu" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chi_phi_van_hanh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giao_dich_ket" (
    "id" SERIAL NOT NULL,
    "loaiGiaoDich" "LoaiGD" NOT NULL,
    "nguonGocType" "NguonGocType" NOT NULL,
    "hoaDonId" INTEGER,
    "phieuThuMuaId" INTEGER,
    "phieuDoiVangId" INTEGER,
    "hopDongId" INTEGER,
    "chiPhiId" INTEGER,
    "soTien" DOUBLE PRECISION NOT NULL,
    "soduSau" DOUBLE PRECISION NOT NULL,
    "ghiChu" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giao_dich_ket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "khach_hang_sdt_key" ON "khach_hang"("sdt");

-- CreateIndex
CREATE UNIQUE INDEX "khach_hang_cccd_key" ON "khach_hang"("cccd");

-- CreateIndex
CREATE UNIQUE INDEX "loai_vang_kyHieu_key" ON "loai_vang"("kyHieu");

-- CreateIndex
CREATE UNIQUE INDEX "cau_hinh_he_thong_tenCauHinh_key" ON "cau_hinh_he_thong"("tenCauHinh");

-- CreateIndex
CREATE UNIQUE INDEX "danh_muc_ten_key" ON "danh_muc"("ten");

-- CreateIndex
CREATE UNIQUE INDEX "san_pham_maSp_key" ON "san_pham"("maSp");

-- CreateIndex
CREATE UNIQUE INDEX "hoa_don_ban_maHd_key" ON "hoa_don_ban"("maHd");

-- CreateIndex
CREATE UNIQUE INDEX "phieu_thu_mua_maPhieu_key" ON "phieu_thu_mua"("maPhieu");

-- CreateIndex
CREATE UNIQUE INDEX "phieu_doi_vang_maPhieu_key" ON "phieu_doi_vang"("maPhieu");

-- CreateIndex
CREATE UNIQUE INDEX "hop_dong_cam_do_maHopDong_key" ON "hop_dong_cam_do"("maHopDong");

-- CreateIndex
CREATE UNIQUE INDEX "danh_muc_chi_phi_ten_key" ON "danh_muc_chi_phi"("ten");

-- AddForeignKey
ALTER TABLE "san_pham" ADD CONSTRAINT "san_pham_danhMucId_fkey" FOREIGN KEY ("danhMucId") REFERENCES "danh_muc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "san_pham" ADD CONSTRAINT "san_pham_loaiVangId_fkey" FOREIGN KEY ("loaiVangId") REFERENCES "loai_vang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoa_don_ban" ADD CONSTRAINT "hoa_don_ban_khachHangId_fkey" FOREIGN KEY ("khachHangId") REFERENCES "khach_hang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chi_tiet_hoa_don" ADD CONSTRAINT "chi_tiet_hoa_don_hoaDonId_fkey" FOREIGN KEY ("hoaDonId") REFERENCES "hoa_don_ban"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chi_tiet_hoa_don" ADD CONSTRAINT "chi_tiet_hoa_don_sanPhamId_fkey" FOREIGN KEY ("sanPhamId") REFERENCES "san_pham"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_thu_mua" ADD CONSTRAINT "phieu_thu_mua_khachHangId_fkey" FOREIGN KEY ("khachHangId") REFERENCES "khach_hang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_thu_mua" ADD CONSTRAINT "phieu_thu_mua_loaiVangId_fkey" FOREIGN KEY ("loaiVangId") REFERENCES "loai_vang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_doi_vang" ADD CONSTRAINT "phieu_doi_vang_khachHangId_fkey" FOREIGN KEY ("khachHangId") REFERENCES "khach_hang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_doi_vang" ADD CONSTRAINT "phieu_doi_vang_loaiVangCuId_fkey" FOREIGN KEY ("loaiVangCuId") REFERENCES "loai_vang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_doi_vang" ADD CONSTRAINT "phieu_doi_vang_sanPhamMoiId_fkey" FOREIGN KEY ("sanPhamMoiId") REFERENCES "san_pham"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hop_dong_cam_do" ADD CONSTRAINT "hop_dong_cam_do_khachHangId_fkey" FOREIGN KEY ("khachHangId") REFERENCES "khach_hang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hop_dong_cam_do" ADD CONSTRAINT "hop_dong_cam_do_loaiVangId_fkey" FOREIGN KEY ("loaiVangId") REFERENCES "loai_vang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_toan_cam_do" ADD CONSTRAINT "thanh_toan_cam_do_hopDongId_fkey" FOREIGN KEY ("hopDongId") REFERENCES "hop_dong_cam_do"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chi_phi_van_hanh" ADD CONSTRAINT "chi_phi_van_hanh_danhMucId_fkey" FOREIGN KEY ("danhMucId") REFERENCES "danh_muc_chi_phi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_ket" ADD CONSTRAINT "giao_dich_ket_hoaDonId_fkey" FOREIGN KEY ("hoaDonId") REFERENCES "hoa_don_ban"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_ket" ADD CONSTRAINT "giao_dich_ket_phieuThuMuaId_fkey" FOREIGN KEY ("phieuThuMuaId") REFERENCES "phieu_thu_mua"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_ket" ADD CONSTRAINT "giao_dich_ket_phieuDoiVangId_fkey" FOREIGN KEY ("phieuDoiVangId") REFERENCES "phieu_doi_vang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_ket" ADD CONSTRAINT "giao_dich_ket_hopDongId_fkey" FOREIGN KEY ("hopDongId") REFERENCES "hop_dong_cam_do"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_ket" ADD CONSTRAINT "giao_dich_ket_chiPhiId_fkey" FOREIGN KEY ("chiPhiId") REFERENCES "chi_phi_van_hanh"("id") ON DELETE SET NULL ON UPDATE CASCADE;
