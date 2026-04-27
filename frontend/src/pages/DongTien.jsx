import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Select,
  Tag,
  Typography,
  Statistic,
  Form,
  InputNumber,
  Input,
  message,
  DatePicker,
  Divider,
  Modal,
} from "antd";
import { PlusOutlined, AuditOutlined } from "@ant-design/icons";
import {
  getDongTien,
  getSoDu,
  nhapChiPhi,
  getBaoCao,
  getKiemQuy,
  luuKiemQuy,
} from "../api/dongTien";
import { getDanhMucChiPhi } from "../api/cauHinh";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;
const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

const NGUON_LABEL = {
  BAN_HANG: { label: "Bán hàng", color: "gold" },
  THU_MUA: { label: "Thu mua", color: "purple" },
  DOI_VANG: { label: "Đổi vàng", color: "cyan" },
  CAM_DO_GIAI_NGAN: { label: "Giải ngân", color: "red" },
  CAM_DO_CHUOC: { label: "Chuộc đồ", color: "green" },
  CAM_DO_LAI: { label: "Thu lãi", color: "blue" },
  CHI_PHI: { label: "Chi phí", color: "red" },
  DIEU_CHINH: { label: "Điều chỉnh", color: "default" },
};

const MENH_GIA = [
  500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000,
];
const INIT_SO_TO = Object.fromEntries(MENH_GIA.map((mg) => [mg, 0]));

export default function DongTien() {
  const [soDu, setSoDu] = useState({});
  const [giaoDich, setGiaoDich] = useState([]);
  const [danhMucCP, setDanhMucCP] = useState([]);
  const [baoCao, setBaoCao] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterLoai, setFilterLoai] = useState(null);
  const [filterHttt, setFilterHttt] = useState(null);
  const [form] = Form.useForm();

  // --- Kiểm quỹ ---
  const [modalKiemQuy, setModalKiemQuy] = useState(false);
  const [soTo, setSoTo] = useState({ ...INIT_SO_TO });
  const [tienDongTep, setTienDongTep] = useState(0);
  const [ghiChuKQ, setGhiChuKQ] = useState("");
  const [lichSuKQ, setLichSuKQ] = useState([]);
  const [loadingKQ, setLoadingKQ] = useState(false);

  const tienMenhGia = MENH_GIA.reduce(
    (sum, mg) => sum + mg * (soTo[mg] || 0),
    0,
  );
  const tongDem = tienMenhGia + (tienDongTep || 0);
  const chenhLech = tongDem - (soDu.soDuHienTai || 0);

  // ---- Data loading ----
  const applyResults = ([sd, gd, dm, bc]) => {
    if (sd.status === "fulfilled") setSoDu(sd.value.data);
    if (gd.status === "fulfilled") setGiaoDich(gd.value.data);
    else message.error("Lỗi tải nhật ký giao dịch");
    if (dm.status === "fulfilled") setDanhMucCP(dm.value.data);
    if (bc.status === "fulfilled") setBaoCao(bc.value.data);
    setLoading(false);
  };

  const buildParams = () => {
    const p = {};
    if (filterLoai) p.loai = filterLoai;
    if (filterHttt) p.hinhThucTT = filterHttt;
    return p;
  };

  const fetchData = () => {
    setLoading(true);
    Promise.allSettled([
      getSoDu(),
      getDongTien(buildParams()),
      getDanhMucChiPhi(),
      getBaoCao({ thang: dayjs().month() + 1, nam: dayjs().year() }),
    ]).then(applyResults);
  };

  useEffect(() => {
    Promise.allSettled([
      getSoDu(),
      getDongTien(buildParams()),
      getDanhMucChiPhi(),
      getBaoCao({ thang: dayjs().month() + 1, nam: dayjs().year() }),
    ]).then(applyResults);
  }, [filterLoai, filterHttt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Chi phí ----
  const handleNhapChiPhi = async () => {
    try {
      const values = await form.validateFields();
      await nhapChiPhi({ ...values, ngayChi: values.ngayChi.toISOString() });
      message.success("Ghi nhận chi phí thành công!");
      form.resetFields();
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi");
    }
  };

  // ---- Kiểm quỹ ----
  const handleMoKiemQuy = () => {
    setSoTo({ ...INIT_SO_TO });
    setTienDongTep(0);
    setGhiChuKQ("");
    setModalKiemQuy(true);
    getKiemQuy()
      .then((r) => setLichSuKQ(r.data))
      .catch(() => {});
  };

  const handleLuuKiemQuy = async () => {
    setLoadingKQ(true);
    try {
      await luuKiemQuy({
        soDuHeThong: soDu.soDuHienTai || 0,
        tienMenhGia,
        tienDongTep: tienDongTep || 0,
        tongTienDem: tongDem,
        chiTietMenhGia: soTo,
        ghiChu: ghiChuKQ || null,
      });
      message.success("Đã lưu kết quả kiểm quỹ!");
      // Refresh soDu để cập nhật "tiền thực tế trong két"
      getSoDu()
        .then((r) => setSoDu(r.data))
        .catch(() => {});
      getKiemQuy().then((r) => setLichSuKQ(r.data));
    } catch (e) {
      message.error(e.response?.data?.error || e.message || "Lỗi lưu kiểm quỹ");
    } finally {
      setLoadingKQ(false);
    }
  };

  // ---- Biểu đồ ----
  const barData = Array.from({ length: 7 }, (_, i) => {
    const ngay = dayjs().subtract(6 - i, "day");
    const thu = giaoDich
      .filter(
        (g) => g.loaiGiaoDich === "THU" && dayjs(g.taoLuc).isSame(ngay, "day"),
      )
      .reduce((s, g) => s + g.soTien, 0);
    const chi = giaoDich
      .filter(
        (g) => g.loaiGiaoDich === "CHI" && dayjs(g.taoLuc).isSame(ngay, "day"),
      )
      .reduce((s, g) => s + g.soTien, 0);
    return { ngay: ngay.format("DD/MM"), thu, chi };
  });

  // ---- Columns ----
  const columns = [
    {
      title: "Thời gian",
      dataIndex: "taoLuc",
      key: "tg",
      render: (v) => dayjs(v).format("HH:mm DD/MM"),
      width: 115,
    },
    {
      title: "Loại",
      dataIndex: "loaiGiaoDich",
      key: "loai",
      width: 58,
      render: (v) => (
        <Tag color={v === "THU" ? "green" : "red"} style={{ fontSize: 11 }}>
          {v === "THU" ? "Thu" : "Chi"}
        </Tag>
      ),
    },
    {
      title: "HT",
      dataIndex: "hinhThucThanhToan",
      key: "httt",
      width: 50,
      render: (v) => (
        <Tag color={v === "TIEN_MAT" ? "orange" : "blue"} style={{ fontSize: 11 }}>
          {v === "TIEN_MAT" ? "TM" : "CK"}
        </Tag>
      ),
    },
    {
      title: "Nguồn gốc",
      dataIndex: "nguonGocType",
      key: "nguon",
      render: (v) => (
        <Tag color={NGUON_LABEL[v]?.color} style={{ fontSize: 11 }}>{NGUON_LABEL[v]?.label || v}</Tag>
      ),
    },
    { title: "Mô tả", dataIndex: "ghiChu", key: "mo_ta", ellipsis: true },
    {
      title: "Số tiền",
      key: "so_tien",
      align: "right",
      render: (_, r) => (
        <Text strong style={{ color: r.loaiGiaoDich === "THU" ? "#52c41a" : "#ff4d4f" }}>
          {r.loaiGiaoDich === "THU" ? "+" : "-"}{formatMoney(r.soTien)} đ
        </Text>
      ),
    },
    {
      title: "Số dư sau",
      dataIndex: "soduSau",
      key: "so_du",
      render: (v) => <Text type="secondary">{formatMoney(v)} đ</Text>,
      align: "right",
    },
  ];

  const lichSuKQColumns = [
    {
      title: "Ngày kiểm",
      dataIndex: "ngayKiem",
      render: (v) => dayjs(v).format("HH:mm DD/MM/YYYY"),
      width: 140,
    },
    {
      title: "Tiền đếm được",
      dataIndex: "tongTienDem",
      align: "right",
      render: (v) => <Text strong>{formatMoney(v)} đ</Text>,
    },
    {
      title: "Số dư HT",
      dataIndex: "soDuHeThong",
      align: "right",
      render: (v) => <Text>{formatMoney(v)} đ</Text>,
    },
    {
      title: "Chênh lệch",
      dataIndex: "chenhLech",
      align: "right",
      render: (v) => (
        <Text
          strong
          style={{ color: v === 0 ? "#52c41a" : v > 0 ? "#faad14" : "#ff4d4f" }}
        >
          {v > 0 ? "+" : ""}
          {formatMoney(v)} đ
        </Text>
      ),
    },
  ];

  // ---- Render chênh lệch kiểm quỹ ----
  const renderChenhLech = () => {
    if (chenhLech === 0)
      return (
        <Tag color="green" style={{ fontSize: 14, padding: "4px 12px" }}>
          Khớp quỹ
        </Tag>
      );
    if (chenhLech > 0)
      return (
        <Tag color="orange" style={{ fontSize: 14, padding: "4px 12px" }}>
          Thừa quỹ +{formatMoney(chenhLech)} đ
        </Tag>
      );
    return (
      <Tag color="red" style={{ fontSize: 14, padding: "4px 12px" }}>
        Thiếu quỹ {formatMoney(chenhLech)} đ
      </Tag>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ===== THỐNG KÊ ===== */}
      <Row gutter={[16, 16]}>
        {/* Tiền mặt */}
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "3px solid #EF9F27" }}>
            <Statistic
              title="Tiền mặt (hệ thống)"
              value={soDu.soDuTienMat ?? 0}
              formatter={(v) => formatMoney(v) + " đ"}
              valueStyle={{ color: "#854F0B" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {soDu.capNhatLuc ? dayjs(soDu.capNhatLuc).format("HH:mm DD/MM") : "—"}
              </Text>
              <Button size="small" icon={<AuditOutlined />} onClick={handleMoKiemQuy} style={{ fontSize: 11 }}>
                Kiểm quỹ
              </Button>
            </div>
            {soDu.tienThucTe != null && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <Text type="secondary" style={{ fontSize: 11 }}>Tiền thực tế trong két</Text>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text strong style={{ fontSize: 15, color: "#1677ff" }}>
                    {formatMoney(soDu.tienThucTe)} đ
                  </Text>
                  {(() => {
                    const cl = soDu.tienThucTe - (soDu.soDuTienMat || 0);
                    if (cl === 0) return <Tag color="green" style={{ fontSize: 10 }}>Khớp</Tag>;
                    if (cl > 0) return <Tag color="orange" style={{ fontSize: 10 }}>+{formatMoney(cl)}</Tag>;
                    return <Tag color="red" style={{ fontSize: 10 }}>{formatMoney(cl)}</Tag>;
                  })()}
                </div>
                <Text type="secondary" style={{ fontSize: 10 }}>
                  Kiểm quỹ: {soDu.tienThucTeCapNhat ? dayjs(soDu.tienThucTeCapNhat).format("HH:mm DD/MM") : "—"}
                </Text>
              </>
            )}
          </Card>
        </Col>

        {/* Chuyển khoản */}
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "3px solid #1677ff" }}>
            <Statistic
              title="Chuyển khoản"
              value={soDu.soDuChuyenKhoan ?? 0}
              formatter={(v) => formatMoney(v) + " đ"}
              valueStyle={{ color: "#1677ff" }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Số dư tài khoản ngân hàng
            </Text>
          </Card>
        </Col>

        {/* Thu / Chi tháng */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Tổng thu tháng này</Text>
                <div>
                  <Text strong style={{ fontSize: 20, color: "#52c41a" }}>
                    {formatMoney(baoCao.tongThu || 0)} đ
                  </Text>
                </div>
              </div>
            </div>
            <Divider style={{ margin: "8px 0" }} />
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Tổng chi tháng này</Text>
              <div>
                <Text strong style={{ fontSize: 20, color: "#ff4d4f" }}>
                  {formatMoney(baoCao.tongChi || 0)} đ
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Lợi nhuận */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Lợi nhuận ròng"
              value={baoCao.loiNhuan || 0}
              formatter={(v) => formatMoney(v) + " đ"}
              valueStyle={{ color: (baoCao.loiNhuan || 0) >= 0 ? "#52c41a" : "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* ===== NỘI DUNG CHÍNH ===== */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card
            title="Nhật ký giao dịch"
            extra={
              <div style={{ display: "flex", gap: 8 }}>
                <Select
                  placeholder="Thu / Chi"
                  allowClear
                  style={{ width: 110 }}
                  onChange={setFilterLoai}
                >
                  <Option value="THU">Tiền vào</Option>
                  <Option value="CHI">Tiền ra</Option>
                </Select>
                <Select
                  placeholder="TM / CK"
                  allowClear
                  style={{ width: 110 }}
                  onChange={setFilterHttt}
                >
                  <Option value="TIEN_MAT">Tiền mặt</Option>
                  <Option value="CHUYEN_KHOAN">Chuyển khoản</Option>
                </Select>
              </div>
            }
          >
            <Table
              dataSource={giaoDich}
              columns={columns}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card title="Nhập chi phí vận hành" size="small">
              <Form form={form} layout="vertical">
                <Form.Item
                  name="danhMucId"
                  label="Danh mục"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Chọn loại chi phí">
                    {danhMucCP.map((d) => (
                      <Option key={d.id} value={d.id}>
                        {d.ten}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="tenChiPhi"
                  label="Tên chi phí"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="VD: Tiền điện tháng 4..." />
                </Form.Item>
                <Form.Item
                  name="soTien"
                  label="Số tiền (đ)"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    formatter={(v) =>
                      `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    placeholder="0"
                  />
                </Form.Item>
                <Form.Item
                  name="ngayChi"
                  label="Ngày chi"
                  initialValue={dayjs()}
                  rules={[{ required: true }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item
                  name="hinhThucThanhToan"
                  label="Hình thức thanh toán"
                  initialValue="TIEN_MAT"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="TIEN_MAT">💵 Tiền mặt</Option>
                    <Option value="CHUYEN_KHOAN">🏦 Chuyển khoản</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="ghiChu" label="Ghi chú">
                  <Input placeholder="Ghi chú thêm..." />
                </Form.Item>
                <Button
                  type="primary"
                  block
                  onClick={handleNhapChiPhi}
                  icon={<PlusOutlined />}
                >
                  Ghi nhận chi phí
                </Button>
              </Form>
            </Card>

            <Card title="Dòng tiền 7 ngày" size="small">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData}>
                  <XAxis dataKey="ngay" style={{ fontSize: 10 }} />
                  <YAxis
                    tickFormatter={(v) => (v / 1000000).toFixed(0) + "tr"}
                    style={{ fontSize: 10 }}
                  />
                  <Tooltip formatter={(v) => formatMoney(v) + " đ"} />
                  <Bar
                    dataKey="thu"
                    name="Thu"
                    fill="#52c41a"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="chi"
                    name="Chi"
                    fill="#ff4d4f"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </Col>
      </Row>

      {/* ===== MODAL KIỂM QUỸ ===== */}
      <Modal
        title={
          <span>
            <AuditOutlined style={{ marginRight: 8, color: "#EF9F27" }} />
            Kiểm quỹ cuối ngày — {dayjs().format("DD/MM/YYYY")}
          </span>
        }
        open={modalKiemQuy}
        onCancel={() => setModalKiemQuy(false)}
        width="min(560px, 95vw)"
        footer={null}
      >
        {/* Bảng đếm từng mệnh giá */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 1fr",
              gap: "6px 8px",
              alignItems: "center",
              marginBottom: 6,
              padding: "0 4px",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mệnh giá
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: 12, textAlign: "center" }}
            >
              Số tờ
            </Text>
            <Text type="secondary" style={{ fontSize: 12, textAlign: "right" }}>
              Thành tiền
            </Text>
          </div>
          <Divider style={{ margin: "4px 0 8px" }} />

          {MENH_GIA.map((mg) => {
            const soToCurrent = soTo[mg] || 0;
            const thanhTien = mg * soToCurrent;
            return (
              <div
                key={mg}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 1fr",
                  gap: "4px 8px",
                  alignItems: "center",
                  marginBottom: 6,
                  padding: "4px 4px",
                  borderRadius: 6,
                  background: soToCurrent > 0 ? "#fffbe6" : "transparent",
                }}
              >
                <Text strong style={{ fontSize: 13 }}>
                  {formatMoney(mg)}đ
                </Text>
                <InputNumber
                  size="small"
                  min={0}
                  value={soTo[mg] || 0}
                  onChange={(v) =>
                    setSoTo((prev) => ({ ...prev, [mg]: v || 0 }))
                  }
                  style={{ width: "100%" }}
                  controls
                />
                <Text
                  style={{
                    textAlign: "right",
                    fontSize: 13,
                    color: thanhTien > 0 ? "#854F0B" : "#bbb",
                  }}
                >
                  {thanhTien > 0 ? formatMoney(thanhTien) + " đ" : "—"}
                </Text>
              </div>
            );
          })}

          <Divider style={{ margin: "8px 0" }} />

          {/* Tiền đã đóng tép */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 1fr",
              gap: "4px 8px",
              alignItems: "center",
              padding: "6px 4px",
              background: tienDongTep > 0 ? "#f6ffed" : "#fafafa",
              borderRadius: 6,
              border: "1px dashed #d9d9d9",
              marginBottom: 6,
            }}
          >
            <Text strong style={{ fontSize: 13 }}>
              Tiền đã đóng tép
            </Text>
            <InputNumber
              size="small"
              min={0}
              step={1000000}
              value={tienDongTep || 0}
              onChange={(v) => setTienDongTep(v || 0)}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              style={{ width: "100%" }}
            />
            <Text
              style={{
                textAlign: "right",
                fontSize: 13,
                color: tienDongTep > 0 ? "#52c41a" : "#bbb",
              }}
            >
              {tienDongTep > 0 ? formatMoney(tienDongTep) + " đ" : "—"}
            </Text>
          </div>

          <Divider style={{ margin: "8px 0" }} />

          {/* Tổng đếm */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 1fr",
              gap: "4px 8px",
              alignItems: "center",
              padding: "4px 4px",
            }}
          >
            <div>
              <Text strong>Tổng tiền đếm được</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Từng tờ: {formatMoney(tienMenhGia)} đ
                {tienDongTep > 0 && ` + Tép: ${formatMoney(tienDongTep)} đ`}
              </Text>
            </div>
            <div />
            <Text
              strong
              style={{ textAlign: "right", fontSize: 16, color: "#1677ff" }}
            >
              {formatMoney(tongDem)} đ
            </Text>
          </div>
        </div>

        {/* Kết quả so sánh */}
        <div
          style={{
            background: "#f9f9f9",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          {[
            [
              "Số dư hệ thống",
              formatMoney(soDu.soDuHienTai || 0) + " đ",
              "#333",
            ],
            ["Tổng tiền đếm được", formatMoney(tongDem) + " đ", "#1677ff"],
          ].map(([l, v, c]) => (
            <div
              key={l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderBottom: "1px solid #f0f0f0",
                fontSize: 13,
              }}
            >
              <Text type="secondary">{l}</Text>
              <Text strong style={{ color: c }}>
                {v}
              </Text>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 10,
              marginTop: 4,
            }}
          >
            <Text strong style={{ fontSize: 14 }}>
              Kết quả
            </Text>
            {renderChenhLech()}
          </div>
        </div>

        {/* Ghi chú + nút lưu */}
        <Input.TextArea
          rows={2}
          placeholder="Ghi chú (nếu có chênh lệch, ghi rõ nguyên nhân...)"
          value={ghiChuKQ}
          onChange={(e) => setGhiChuKQ(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Button
          type="primary"
          block
          icon={<AuditOutlined />}
          loading={loadingKQ}
          onClick={handleLuuKiemQuy}
          style={{ marginBottom: 16 }}
        >
          Lưu kết quả kiểm quỹ
        </Button>

        {/* Lịch sử kiểm quỹ gần đây */}
        {lichSuKQ.length > 0 && (
          <>
            <Divider style={{ margin: "0 0 8px" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Lịch sử kiểm quỹ gần đây
              </Text>
            </Divider>
            <Table
              dataSource={lichSuKQ.slice(0, 5)}
              columns={lichSuKQColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
