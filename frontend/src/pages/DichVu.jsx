import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  Select,
  InputNumber,
  Form,
  message,
  Table,
  Tag,
  Typography,
  Modal,
  DatePicker,
  Popconfirm,
  Tabs,
  Divider,
} from "antd";
import { PlusOutlined, CheckOutlined, SendOutlined } from "@ant-design/icons";
import {
  getDichVu,
  createDichVu,
  doiTrangThai,
  giaoHang,
  huyDichVu,
} from "../api/dichVu";
import { createKhachHang } from "../api/khachHang";
import KhachHangSearch from "../components/KhachHangSearch";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

const LOAI_DV = [
  "Rửa / Đánh bóng",
  "Hàn / Vá",
  "Sửa / Chỉnh sửa",
  "Thay dây / Khóa",
  "Khác",
];

const TRANG_THAI = {
  TIEP_NHAN: { label: "Tiếp nhận", color: "blue" },
  DANG_LAM: { label: "Đang làm", color: "orange" },
  HOAN_THANH: { label: "Hoàn thành", color: "cyan" },
  DA_GIAO: { label: "Đã giao", color: "green" },
  DA_HUY: { label: "Đã hủy", color: "default" },
};

const BUOC_TIEP_THEO = {
  TIEP_NHAN: {
    trangThai: "DANG_LAM",
    label: "Bắt đầu làm",
    icon: <CheckOutlined />,
  },
  DANG_LAM: {
    trangThai: "HOAN_THANH",
    label: "Đã làm xong",
    icon: <CheckOutlined />,
  },
};

export default function DichVu() {
  const [phieuList, setPhieuList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabActive, setTabActive] = useState("ALL");
  const [form] = Form.useForm();
  const [modalKH, setModalKH] = useState(false);
  const [formKH] = Form.useForm();

  const [khachHang, setKhachHang] = useState(null);
  const [dungKhachLe, setDungKhachLe] = useState(false);

  // Modal giao hàng
  const [modalGiao, setModalGiao] = useState(null); // phieu đang giao
  const [htttGiao, setHtttGiao] = useState("TIEN_MAT");

  const fetchData = () => {
    setLoading(true);
    getDichVu({})
      .then((r) => setPhieuList(r.data))
      .catch(() => message.error("Lỗi tải dữ liệu"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getDichVu({})
      .then((r) => setPhieuList(r.data))
      .catch(() => message.error("Lỗi tải dữ liệu"))
      .finally(() => setLoading(false));
  }, []);

  const taKhachMoi = async () => {
    try {
      const values = await formKH.validateFields();
      const res = await createKhachHang(values);
      setKhachHang(res.data);
      setModalKH(false);
      formKH.resetFields();
    } catch {
      message.error("Lỗi tạo khách hàng");
    }
  };

  const handleTao = async () => {
    try {
      const values = await form.validateFields();
      await createDichVu({
        ...values,
        khachHangId: khachHang?.id || null,
        ngayHenTra: values.ngayHenTra?.toISOString() || null,
      });
      message.success("Đã tạo phiếu dịch vụ!");
      form.resetFields();
      setKhachHang(null);
      setDungKhachLe(false);
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi tạo phiếu");
    }
  };

  const handleDoiTrangThai = async (id, trangThai) => {
    try {
      await doiTrangThai(id, trangThai);
      message.success("Cập nhật trạng thái thành công");
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi");
    }
  };

  const handleGiao = async () => {
    if (!modalGiao) return;
    try {
      await giaoHang(modalGiao.id, { hinhThucThanhToan: htttGiao });
      message.success(
        `Thu tiền ${formatMoney(modalGiao.giaTien)} đ thành công!`,
      );
      setModalGiao(null);
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi giao hàng");
    }
  };

  const handleHuy = async (id) => {
    try {
      await huyDichVu(id);
      message.success("Đã hủy phiếu");
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi hủy");
    }
  };

  const tabData = {
    ALL: phieuList,
    TIEP_NHAN: phieuList.filter((p) => p.trangThai === "TIEP_NHAN"),
    DANG_LAM: phieuList.filter((p) => p.trangThai === "DANG_LAM"),
    HOAN_THANH: phieuList.filter((p) => p.trangThai === "HOAN_THANH"),
    DA_GIAO: phieuList.filter((p) => p.trangThai === "DA_GIAO"),
  };

  const columns = [
    {
      title: "Mã phiếu",
      dataIndex: "maPhieu",
      key: "ma",
      width: 120,
      render: (v) => (
        <Text code style={{ fontSize: 11 }}>
          {v}
        </Text>
      ),
    },
    {
      title: "Khách hàng",
      key: "khach",
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>
            {r.khachHang?.hoTen || r.tenKhach || "Khách lẻ"}
          </Text>
          {(r.khachHang?.sdt || r.sdtKhach) && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {r.khachHang?.sdt || r.sdtKhach}
              </Text>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Dịch vụ",
      key: "dv",
      render: (_, r) => (
        <div>
          <Tag color="purple">{r.loaiDichVu}</Tag>
          <br />
          <Text style={{ fontSize: 11 }}>{r.moTaTaiSan}</Text>
        </div>
      ),
    },
    {
      title: "Ngày hẹn",
      dataIndex: "ngayHenTra",
      key: "hen",
      width: 100,
      render: (v) =>
        v ? (
          <Text style={{ color: dayjs(v).isBefore(dayjs()) && "red" }}>
            {dayjs(v).format("DD/MM/YYYY")}
          </Text>
        ) : (
          "—"
        ),
    },
    {
      title: "Giá (đ)",
      dataIndex: "giaTien",
      key: "gia",
      align: "right",
      width: 110,
      render: (v) => <Text strong>{formatMoney(v)}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      key: "tt",
      width: 110,
      render: (v) => (
        <Tag color={TRANG_THAI[v]?.color}>{TRANG_THAI[v]?.label}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      render: (_, r) => {
        if (r.trangThai === "DA_GIAO" || r.trangThai === "DA_HUY") return null;
        const buoc = BUOC_TIEP_THEO[r.trangThai];
        return (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {buoc && (
              <Button
                size="small"
                icon={buoc.icon}
                onClick={() => handleDoiTrangThai(r.id, buoc.trangThai)}
              >
                {buoc.label}
              </Button>
            )}
            {r.trangThai === "HOAN_THANH" && (
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined />}
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
                onClick={() => {
                  setHtttGiao(r.hinhThucThanhToan);
                  setModalGiao(r);
                }}
              >
                Giao & Thu tiền
              </Button>
            )}
            <Popconfirm
              title="Hủy phiếu này?"
              onConfirm={() => handleHuy(r.id)}
              okText="Hủy phiếu"
              cancelText="Không"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger>
                Hủy
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <Row gutter={16}>
      {/* ===== FORM TẠO PHIẾU ===== */}
      <Col span={9}>
        <Card title="Tạo phiếu dịch vụ" style={{ position: "sticky", top: 0 }}>
          {/* Khách hàng */}
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Khách hàng
            </Text>
            <div style={{ marginTop: 4 }}>
              <KhachHangSearch
                value={khachHang}
                onChange={setKhachHang}
                onNew={() => setModalKH(true)}
              />
            </div>
            {!khachHang && (
              <div style={{ marginTop: 6 }}>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, fontSize: 12 }}
                  onClick={() => setDungKhachLe((v) => !v)}
                >
                  {dungKhachLe ? "▲ Ẩn" : "▼ Nhập tên/SĐT khách lẻ"}
                </Button>
                {dungKhachLe && (
                  <Row gutter={8} style={{ marginTop: 6 }}>
                    <Col span={12}>
                      <Form.Item noStyle name="tenKhach">
                        <Input placeholder="Tên khách lẻ" size="small" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item noStyle name="sdtKhach">
                        <Input placeholder="SĐT khách lẻ" size="small" />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
              </div>
            )}
          </div>

          <Form form={form} layout="vertical" size="small">
            <Form.Item
              name="loaiDichVu"
              label="Loại dịch vụ"
              rules={[{ required: true }]}
            >
              <Select placeholder="Chọn loại dịch vụ">
                {LOAI_DV.map((l) => (
                  <Option key={l} value={l}>
                    {l}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="moTaTaiSan"
              label="Mô tả tài sản"
              rules={[{ required: true }]}
            >
              <Input.TextArea
                rows={2}
                placeholder="VD: Nhẫn vàng 18K, dây chuyền SJC..."
              />
            </Form.Item>
            <Form.Item name="moTaCongViec" label="Công việc cần làm">
              <Input.TextArea
                rows={2}
                placeholder="VD: Hàn vỡ đốt nhẫn, đánh bóng lại..."
              />
            </Form.Item>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  name="giaTien"
                  label="Giá dịch vụ (đ)"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    step={10000}
                    formatter={(v) =>
                      `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="ngayHenTra" label="Ngày hẹn trả">
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="hinhThucThanhToan"
              label="Hình thức thanh toán"
              initialValue="TIEN_MAT"
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
              icon={<PlusOutlined />}
              onClick={handleTao}
            >
              Tạo phiếu dịch vụ
            </Button>
          </Form>
        </Card>
      </Col>

      {/* ===== DANH SÁCH PHIẾU ===== */}
      <Col span={15}>
        <Card title="Danh sách phiếu dịch vụ">
          <Tabs
            activeKey={tabActive}
            onChange={setTabActive}
            size="small"
            style={{ marginBottom: 8 }}
          >
            <TabPane tab={`Tất cả (${phieuList.length})`} key="ALL" />
            <TabPane
              tab={
                <span style={{ color: "#1677ff" }}>
                  Tiếp nhận ({tabData.TIEP_NHAN.length})
                </span>
              }
              key="TIEP_NHAN"
            />
            <TabPane
              tab={
                <span style={{ color: "#faad14" }}>
                  Đang làm ({tabData.DANG_LAM.length})
                </span>
              }
              key="DANG_LAM"
            />
            <TabPane
              tab={
                <span style={{ color: "#13c2c2" }}>
                  Hoàn thành ({tabData.HOAN_THANH.length})
                </span>
              }
              key="HOAN_THANH"
            />
            <TabPane
              tab={
                <span style={{ color: "#52c41a" }}>
                  Đã giao ({tabData.DA_GIAO.length})
                </span>
              }
              key="DA_GIAO"
            />
          </Tabs>
          <Table
            dataSource={tabData[tabActive]}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={{ pageSize: 8 }}
          />
        </Card>
      </Col>

      {/* ===== MODAL GIAO HÀNG & THU TIỀN ===== */}
      <Modal
        title="Giao hàng & Thu tiền"
        open={!!modalGiao}
        onOk={handleGiao}
        onCancel={() => setModalGiao(null)}
        okText="Xác nhận thu tiền"
        cancelText="Hủy"
        okButtonProps={{
          style: { background: "#52c41a", borderColor: "#52c41a" },
        }}
      >
        {modalGiao && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 12,
            }}
          >
            <div
              style={{ background: "#f9f9f9", padding: 12, borderRadius: 8 }}
            >
              {[
                ["Phiếu", modalGiao.maPhieu],
                [
                  "Khách",
                  modalGiao.khachHang?.hoTen ||
                    modalGiao.tenKhach ||
                    "Khách lẻ",
                ],
                ["Dịch vụ", modalGiao.loaiDichVu],
                ["Tài sản", modalGiao.moTaTaiSan],
              ].map(([l, v]) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0",
                    borderBottom: "1px solid #f0f0f0",
                    fontSize: 13,
                  }}
                >
                  <Text type="secondary">{l}</Text>
                  <Text strong>{v}</Text>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "#fffbe6",
                border: "1px solid #ffe58f",
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong style={{ fontSize: 14 }}>
                Tiền thu khách
              </Text>
              <Text strong style={{ fontSize: 20, color: "#854F0B" }}>
                {formatMoney(modalGiao.giaTien)} đ
              </Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hình thức thanh toán
              </Text>
              <Select
                value={htttGiao}
                onChange={setHtttGiao}
                style={{ width: "100%", marginTop: 6 }}
              >
                <Option value="TIEN_MAT">💵 Tiền mặt</Option>
                <Option value="CHUYEN_KHOAN">🏦 Chuyển khoản</Option>
              </Select>
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
            <Input />
          </Form.Item>
          <Form.Item
            name="sdt"
            label="Số điện thoại"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="cccd" label="CCCD">
            <Input />
          </Form.Item>
          <Form.Item name="diaChi" label="Địa chỉ">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
}
