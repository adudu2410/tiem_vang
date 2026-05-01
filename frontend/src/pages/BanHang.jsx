import { useEffect, useState, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  Select,
  Table,
  InputNumber,
  Form,
  message,
  Tag,
  Divider,
  Typography,
  Modal,
  Popconfirm,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { getSanPham } from "../api/sanPham";
import { createKhachHang } from "../api/khachHang";
import KhachHangSearch from "../components/KhachHangSearch";
import ThanhToanSection, { buildThanhToanPayload } from "../components/ThanhToanSection";
import { printHoaDonBan } from "../utils/print";
import { getHoaDon, createHoaDon, updateHoaDon, huyHoaDon } from "../api/hoaDon";
import { getLoaiVang } from "../api/cauHinh";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;

const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

export default function BanHang() {
  // ---- Dữ liệu ----
  const [sanPham, setSanPham] = useState([]);
  const [loaiVang, setLoaiVang] = useState([]);
  const [hoaDons, setHoaDons] = useState([]);

  // ---- Tạo HĐ mới ----
  const [khachHang, setKhachHang] = useState(null);
  const [searchSP, setSearchSP] = useState("");
  const [gioHang, setGioHang] = useState([]);
  const [chieuKhau, setChieuKhau] = useState(0);
  const [hinhThuc, setHinhThuc] = useState("TIEN_MAT");
  const [soTienCK, setSoTienCK] = useState(0);
  const [ghiChu, setGhiChu] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalKH, setModalKH] = useState(false);
  const [formKH] = Form.useForm();

  // ---- Sửa HĐ ----
  const [modalSua, setModalSua] = useState(false);
  const [editData, setEditData] = useState(null);   // HĐ đang sửa (deep copy)
  const [loadingSua, setLoadingSua] = useState(false);

  const maHD = `HD-${dayjs().format("YYYYMMDD")}-xxx`;

  const fetchHoaDons = useCallback(() => {
    getHoaDon({}).then((r) => setHoaDons(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([getSanPham(), getLoaiVang()])
      .then(([sp, lv]) => {
        setSanPham(sp.data);
        setLoaiVang(lv.data);
      })
      .catch(() => message.error("Lỗi tải dữ liệu"));
    fetchHoaDons();
  }, [fetchHoaDons]);

  const themVaoGio = (sp) => {
    const loaiVangSp = loaiVang.find((l) => l.id === sp.loaiVangId);
    const giaVang = loaiVangSp?.giaBanRa || 0;
    const tienCong = sp.tienCongMacDinh || 0;
    const donGia = sp.trongLuongChi * giaVang + tienCong;
    const existing = gioHang.find((i) => i.sanPhamId === sp.id);
    if (existing) {
      setGioHang((g) =>
        g.map((i) =>
          i.sanPhamId === sp.id
            ? { ...i, soLuong: i.soLuong + 1, thanhTien: donGia * (i.soLuong + 1) }
            : i,
        ),
      );
    } else {
      setGioHang((g) => [
        ...g,
        {
          sanPhamId: sp.id,
          ten: sp.ten,
          maSp: sp.maSp,
          loaiVang: loaiVangSp?.kyHieu || "",
          trongLuongChi: sp.trongLuongChi,
          giaVangApDung: giaVang,
          tienCong,
          donGia,
          soLuong: 1,
          thanhTien: donGia,
        },
      ]);
    }
  };

  const capNhatGia = (sanPhamId, field, value) => {
    setGioHang((g) =>
      g.map((i) => {
        if (i.sanPhamId !== sanPhamId) return i;
        const updated = { ...i, [field]: value };
        updated.donGia = updated.trongLuongChi * updated.giaVangApDung + updated.tienCong;
        updated.thanhTien = updated.donGia * updated.soLuong;
        return updated;
      }),
    );
  };

  const xoaKhoiGio = (sanPhamId) =>
    setGioHang((g) => g.filter((i) => i.sanPhamId !== sanPhamId));

  const tongTien = gioHang.reduce((s, i) => s + i.thanhTien, 0);
  const giamGia = (tongTien * chieuKhau) / 100;
  const tongThanhToan = tongTien - giamGia;
  const diemCong = Math.floor(tongThanhToan / 100000);

  const xacNhanHoaDon = async () => {
    if (gioHang.length === 0) return message.warning("Giỏ hàng trống!");
    setLoading(true);
    try {
      const payload = buildThanhToanPayload({ hinhThuc, soTienCK, tongTien: tongThanhToan, ghiChu });
      const res = await createHoaDon({
        khachHangId: khachHang?.id || null,
        chiTietHoaDon: gioHang.map((i) => ({
          sanPhamId: i.sanPhamId,
          soLuong: i.soLuong,
          giaVangApDung: i.giaVangApDung,
          tienCong: i.tienCong,
          donGia: i.donGia,
          thanhTien: i.thanhTien,
        })),
        chieuKhauPhanTram: chieuKhau,
        hinhThucThanhToan: payload.hinhThucThanhToan,
        ghiChu: payload.ghiChu,
      });
      message.success("Tạo hóa đơn thành công!");
      printHoaDonBan({
        maHD: res.data?.maHd || "HĐ mới",
        khachHang,
        items: gioHang,
        tongTien,
        giamGia,
        tongThanhToan,
        hinhThuc,
        soTienCK,
        ghiChu: payload.ghiChu,
        ngay: res.data?.taoLuc,
      });
      setGioHang([]);
      setKhachHang(null);
      setChieuKhau(0);
      setGhiChu("");
      setHinhThuc("TIEN_MAT");
      setSoTienCK(0);
      fetchHoaDons();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi tạo hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const taKhachMoi = async () => {
    try {
      const values = await formKH.validateFields();
      const res = await createKhachHang(values);
      setKhachHang(res.data);
      setModalKH(false);
      formKH.resetFields();
      message.success("Tạo khách hàng thành công");
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi tạo khách hàng");
    }
  };

  // ---- Logic sửa HĐ ----
  const moModalSua = (hd) => {
    setEditData({
      id: hd.id,
      maHd: hd.maHd,
      khachHangId: hd.khachHangId,
      khachHang: hd.khachHang,
      chieuKhauPhanTram: hd.chieuKhauPhanTram,
      hinhThucThanhToan: hd.hinhThucThanhToan,
      ghiChu: hd.ghiChu || "",
      chiTiet: hd.chiTietHoaDon.map((ct) => ({
        id: ct.id,
        ten: ct.sanPham?.ten,
        maSp: ct.sanPham?.maSp,
        trongLuongChi: ct.sanPham?.trongLuongChi || 0,
        loaiVang: ct.sanPham?.loaiVang?.kyHieu || "",
        soLuong: ct.soLuong,
        giaVangApDung: ct.giaVangApDung,
        tienCong: ct.tienCong,
        donGia: ct.donGia,
        thanhTien: ct.thanhTien,
      })),
    });
    setModalSua(true);
  };

  const capNhatEditGia = (ctId, field, value) => {
    setEditData((prev) => ({
      ...prev,
      chiTiet: prev.chiTiet.map((ct) => {
        if (ct.id !== ctId) return ct;
        const updated = { ...ct, [field]: value };
        updated.donGia = updated.trongLuongChi * updated.giaVangApDung + updated.tienCong;
        updated.thanhTien = updated.donGia * updated.soLuong;
        return updated;
      }),
    }));
  };

  const handleChonKhachEdit = (kh) => {
    setEditData((prev) => ({
      ...prev,
      khachHangId: kh?.id || null,
      khachHang: kh || null,
    }));
  };

  const handleHuy = async (id) => {
    try {
      await huyHoaDon(id);
      message.success("Đã hủy hóa đơn — hàng đã trả về kho");
      fetchHoaDons();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi hủy hóa đơn");
    }
  };

  const luuSuaHoaDon = async () => {
    if (!editData) return;
    setLoadingSua(true);
    try {
      await updateHoaDon(editData.id, {
        khachHangId: editData.khachHangId || null,
        chieuKhauPhanTram: editData.chieuKhauPhanTram || 0,
        hinhThucThanhToan: editData.hinhThucThanhToan,
        ghiChu: editData.ghiChu,
        chiTiet: editData.chiTiet.map((ct) => ({
          id: ct.id,
          giaVangApDung: ct.giaVangApDung,
          tienCong: ct.tienCong,
          donGia: ct.donGia,
          thanhTien: ct.thanhTien,
        })),
      });
      message.success("Đã cập nhật hóa đơn!");
      setModalSua(false);
      fetchHoaDons();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi cập nhật hóa đơn");
    } finally {
      setLoadingSua(false);
    }
  };

  const spHienThi = sanPham.filter(
    (s) =>
      s.ten.toLowerCase().includes(searchSP.toLowerCase()) ||
      s.maSp.toLowerCase().includes(searchSP.toLowerCase()),
  );

  // ---- Tính toán trong edit ----
  const tongTienEdit = editData?.chiTiet.reduce((s, ct) => s + ct.thanhTien, 0) || 0;
  const giamGiaEdit = (tongTienEdit * (editData?.chieuKhauPhanTram || 0)) / 100;
  const tongThanhToanEdit = tongTienEdit - giamGiaEdit;

  // ---- Columns ----
  const gioHangColumns = [
    {
      title: "Sản phẩm",
      key: "ten",
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>{r.ten}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.maSp} · {r.trongLuongChi} chỉ · <Tag color="gold" style={{ fontSize: 10 }}>{r.loaiVang}</Tag>
          </Text>
        </div>
      ),
    },
    {
      title: "Giá vàng (đ/chỉ)", key: "giaVang", width: 130,
      render: (_, r) => (
        <InputNumber size="small" style={{ width: "100%" }} value={r.giaVangApDung}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          onChange={(v) => capNhatGia(r.sanPhamId, "giaVangApDung", v)} />
      ),
    },
    {
      title: "Tiền công (đ)", key: "tienCong", width: 120,
      render: (_, r) => (
        <InputNumber size="small" style={{ width: "100%" }} value={r.tienCong}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          onChange={(v) => capNhatGia(r.sanPhamId, "tienCong", v)} />
      ),
    },
    {
      title: "SL", key: "sl", width: 70,
      render: (_, r) => (
        <InputNumber size="small" style={{ width: "100%" }} value={r.soLuong} min={1}
          onChange={(v) => capNhatGia(r.sanPhamId, "soLuong", v)} />
      ),
    },
    {
      title: "Thành tiền", key: "thanhTien", align: "right",
      render: (_, r) => <Text strong>{formatMoney(r.thanhTien)}</Text>,
    },
    {
      key: "xoa", width: 40,
      render: (_, r) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => xoaKhoiGio(r.sanPhamId)} />
      ),
    },
  ];

  const editColumns = [
    {
      title: "Sản phẩm", key: "ten",
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>{r.ten}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.maSp} · {r.trongLuongChi} chỉ · <Tag color="gold" style={{ fontSize: 10 }}>{r.loaiVang}</Tag>
          </Text>
        </div>
      ),
    },
    {
      title: "Giá vàng (đ/chỉ)", key: "gv", width: 130,
      render: (_, r) => (
        <InputNumber size="small" style={{ width: "100%" }} value={r.giaVangApDung}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          onChange={(v) => capNhatEditGia(r.id, "giaVangApDung", v)} />
      ),
    },
    {
      title: "Tiền công (đ)", key: "tc", width: 120,
      render: (_, r) => (
        <InputNumber size="small" style={{ width: "100%" }} value={r.tienCong}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          onChange={(v) => capNhatEditGia(r.id, "tienCong", v)} />
      ),
    },
    { title: "SL", dataIndex: "soLuong", key: "sl", width: 50, align: "center" },
    {
      title: "Thành tiền", key: "tt", align: "right",
      render: (_, r) => <Text strong>{formatMoney(r.thanhTien)}</Text>,
    },
  ];

  const hdColumns = [
    {
      title: "Mã HĐ", dataIndex: "maHd", key: "ma",
      render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: "Khách hàng", key: "khach",
      render: (_, r) => r.khachHang?.hoTen || <Text type="secondary">Khách lẻ</Text>,
    },
    {
      title: "Hình thức", dataIndex: "hinhThucThanhToan", key: "httt", width: 90,
      render: (v) => (
        <Tag color={v === "TIEN_MAT" ? "orange" : "blue"}>
          {v === "TIEN_MAT" ? "Tiền mặt" : "CK"}
        </Tag>
      ),
    },
    {
      title: "Tổng thanh toán", dataIndex: "tongSauChieuKhau", key: "tong",
      align: "right",
      render: (v) => <Text strong>{formatMoney(v)} đ</Text>,
    },
    {
      title: "Ngày", dataIndex: "taoLuc", key: "ngay", width: 110,
      render: (v) => dayjs(v).format("HH:mm DD/MM/YY"),
    },
    {
      title: "Trạng thái", dataIndex: "trangThai", key: "tt", width: 90,
      render: (v) => (
        <Tag color={v === "HOAN_TAT" ? "green" : v === "DA_HUY" ? "red" : "default"}>
          {v === "HOAN_TAT" ? "Hoàn tất" : v === "DA_HUY" ? "Đã hủy" : v}
        </Tag>
      ),
    },
    {
      title: "", key: "action", width: 155,
      render: (_, r) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() =>
              printHoaDonBan({
                maHD: r.maHd,
                khachHang: r.khachHang,
                items: r.chiTietHoaDon || [],
                tongTien: r.tongTien,
                giamGia: r.tongTien - r.tongSauChieuKhau,
                tongThanhToan: r.tongSauChieuKhau,
                hinhThuc: r.hinhThucThanhToan,
                soTienCK: 0,
                ghiChu: r.ghiChu,
                ngay: r.taoLuc,
              })
            }
          >
            In
          </Button>
          {r.trangThai !== "DA_HUY" && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => moModalSua(r)}>
                Sửa
              </Button>
              <Popconfirm
                title="Hủy hóa đơn này?"
                description="Hàng sẽ được trả về kho và số dư sẽ được điều chỉnh."
                onConfirm={() => handleHuy(r.id)}
                okText="Xác nhận hủy"
                cancelText="Không"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger>Hủy</Button>
              </Popconfirm>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card title="Thông tin khách hàng" size="small">
              <KhachHangSearch
                value={khachHang}
                onChange={setKhachHang}
                onNew={() => setModalKH(true)}
                showDiem
              />
            </Card>

            <Card
              title="Sản phẩm" size="small"
              extra={
                <Input.Search placeholder="Tìm sản phẩm..." style={{ width: 220 }}
                  value={searchSP} onChange={(e) => setSearchSP(e.target.value)} />
              }
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 180, overflowY: "auto", marginBottom: 12 }}>
                {spHienThi.map((sp) => (
                  <div
                    key={sp.id}
                    onClick={() => themVaoGio(sp)}
                    style={{ padding: "6px 12px", border: "1px solid #f0f0f0", borderRadius: 8, cursor: "pointer", background: "#fff", transition: "all 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#EF9F27")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#f0f0f0")}
                  >
                    <div style={{ fontWeight: 500, fontSize: 12 }}>{sp.ten}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>
                      {sp.maSp} · <Tag color="gold" style={{ fontSize: 10, margin: 0 }}>{sp.loaiVang?.kyHieu}</Tag>
                    </div>
                  </div>
                ))}
                {spHienThi.length === 0 && <Text type="secondary">Không tìm thấy sản phẩm</Text>}
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <Table
                dataSource={gioHang} columns={gioHangColumns} rowKey="sanPhamId"
                pagination={false} size="small"
                locale={{ emptyText: "Chưa có sản phẩm — click để thêm" }}
                scroll={{ x: 500 }}
              />
            </Card>

            <Card size="small">
              <Text type="secondary" style={{ fontSize: 12 }}>Ghi chú</Text>
              <Input.TextArea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
                placeholder="Ghi chú thêm cho hóa đơn..." rows={2} style={{ marginTop: 4 }} />
            </Card>
          </div>
        </Col>

        <Col xs={24} lg={9}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 0 }}>
            <Card title="Tổng tiền" size="small">
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <Text type="secondary">Tạm tính</Text>
                  <Text>{formatMoney(tongTien)} đ</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <Text type="secondary">Chiết khấu</Text>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <InputNumber size="small" min={0} max={100} value={chieuKhau} onChange={setChieuKhau} style={{ width: 60 }} />
                    <Text type="secondary">%</Text>
                    {giamGia > 0 && <Text type="danger">-{formatMoney(giamGia)} đ</Text>}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
                  <Text strong style={{ fontSize: 15 }}>Tổng thanh toán</Text>
                  <Text strong style={{ fontSize: 18, color: "#854F0B" }}>{formatMoney(tongThanhToan)} đ</Text>
                </div>
              </div>
            </Card>

            <ThanhToanSection
              hinhThuc={hinhThuc}
              onHinhThuc={setHinhThuc}
              soTienCK={soTienCK}
              onSoTienCK={setSoTienCK}
              tongTien={tongThanhToan}
            />

            {khachHang && (
              <Card title="Tích điểm" size="small">
                {[["Điểm hiện tại", `${khachHang.tongDiem} điểm`], ["Điểm cộng thêm", `+ ${diemCong} điểm`]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                    <Text type="secondary">{l}</Text>
                    <Text style={{ color: l.includes("cộng") ? "#52c41a" : undefined }}>{v}</Text>
                  </div>
                ))}
                <Divider style={{ margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <Text type="secondary">Sau giao dịch</Text>
                  <Text strong style={{ color: "#854F0B" }}>{khachHang.tongDiem + diemCong} điểm</Text>
                </div>
              </Card>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <Button style={{ flex: 1 }} onClick={() => { setGioHang([]); setKhachHang(null); setChieuKhau(0); setHinhThuc("TIEN_MAT"); setSoTienCK(0); }}>Hủy</Button>
              <Button type="primary" style={{ flex: 2 }} loading={loading} onClick={xacNhanHoaDon} disabled={gioHang.length === 0}>
                Xác nhận & Lưu
              </Button>
            </div>

            <Card size="small" style={{ background: "#fffbe6", border: "1px solid #ffe58f" }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Mã hóa đơn: </Text>
              <Text strong style={{ fontSize: 11 }}>{maHD}</Text>
            </Card>
          </div>
        </Col>

        {/* ===== LỊCH SỬ HÓA ĐƠN ===== */}
        <Col span={24} style={{ marginTop: 16 }}>
          <Card title="Lịch sử hóa đơn" size="small">
            <Table
              dataSource={hoaDons}
              columns={hdColumns}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 8 }}
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ===== MODAL SỬA HÓA ĐƠN ===== */}
      <Modal
        title={`Sửa hóa đơn — ${editData?.maHd}`}
        open={modalSua}
        onCancel={() => setModalSua(false)}
        width="min(720px, 95vw)"
        onOk={luuSuaHoaDon}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        confirmLoading={loadingSua}
      >
        {editData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Khách hàng */}
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Khách hàng</Text>
              <KhachHangSearch
                value={editData.khachHang}
                onChange={handleChonKhachEdit}
              />
            </div>

            {/* Sản phẩm — chỉnh giá vàng và tiền công */}
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Sản phẩm (chỉnh giá vàng / tiền công)</Text>
              <Table
                dataSource={editData.chiTiet}
                columns={editColumns}
                rowKey="id"
                pagination={false}
                size="small"
                style={{ marginTop: 6 }}
              />
            </div>

            {/* Chiết khấu + HT thanh toán */}
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>Chiết khấu (%)</Text>
                <InputNumber
                  style={{ width: "100%", marginTop: 4 }}
                  min={0} max={100} step={1}
                  value={editData.chieuKhauPhanTram}
                  onChange={(v) => setEditData((p) => ({ ...p, chieuKhauPhanTram: v || 0 }))}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>Hình thức thanh toán</Text>
                <Select
                  style={{ width: "100%", marginTop: 4 }}
                  value={editData.hinhThucThanhToan}
                  onChange={(v) => setEditData((p) => ({ ...p, hinhThucThanhToan: v }))}
                >
                  <Option value="TIEN_MAT">💵 Tiền mặt</Option>
                  <Option value="CHUYEN_KHOAN">🏦 Chuyển khoản</Option>
                </Select>
              </Col>
              <Col xs={24} sm={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>Ghi chú</Text>
                <Input
                  style={{ marginTop: 4 }}
                  value={editData.ghiChu}
                  onChange={(e) => setEditData((p) => ({ ...p, ghiChu: e.target.value }))}
                  placeholder="Ghi chú..."
                />
              </Col>
            </Row>

            {/* Tổng kết */}
            <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 8, padding: "10px 14px" }}>
              {[
                ["Tạm tính", formatMoney(tongTienEdit) + " đ"],
                ["Chiết khấu", `-${formatMoney(giamGiaEdit)} đ`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                  <Text type="secondary">{l}</Text>
                  <Text>{v}</Text>
                </div>
              ))}
              <Divider style={{ margin: "6px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong>Tổng thanh toán mới</Text>
                <Text strong style={{ fontSize: 16, color: "#854F0B" }}>{formatMoney(tongThanhToanEdit)} đ</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== MODAL TẠO KHÁCH MỚI ===== */}
      <Modal
        title="Tạo khách hàng mới"
        open={modalKH}
        onOk={taKhachMoi}
        onCancel={() => setModalKH(false)}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Form form={formKH} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="hoTen" label="Họ tên" rules={[{ required: true }]}>
            <Input placeholder="Nguyễn Thị Lan" />
          </Form.Item>
          <Form.Item name="sdt" label="Số điện thoại" rules={[{ required: true }]}>
            <Input placeholder="0912 345 678" />
          </Form.Item>
          <Form.Item name="cccd" label="CCCD"><Input placeholder="079xxxxxxx" /></Form.Item>
          <Form.Item name="diaChi" label="Địa chỉ"><Input placeholder="Bến Tre" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
