import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  Select,
  InputNumber,
  message,
  Table,
  Tag,
  Typography,
  Modal,
  Form,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { createThuMua, getThuMua } from "../api/thuMua";
import { createKhachHang } from "../api/khachHang";
import KhachHangSearch from "../components/KhachHangSearch";
import { getLoaiVang } from "../api/cauHinh";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const { Option } = Select;

const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

export default function ThuMua() {
  const [loaiVang, setLoaiVang] = useState([]);
  const [khachHang, setKhachHang] = useState(null);
  const [lichSu, setLichSu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalKH, setModalKH] = useState(false);
  const [hinhThucTT, setHinhThucTT] = useState("TIEN_MAT");
  const [ghiChuPhieu, setGhiChuPhieu] = useState("");
  const [formKH] = Form.useForm();

  // --- Giỏ hàng (danh sách món thu mua) ---
  const [items, setItems] = useState([]);

  // --- Form thêm món ---
  const [newItem, setNewItem] = useState({
    loaiVangId: null,
    moTa: "",
    trongLuong: null,
    giaThuVao: 0,
  });

  const tongTien = items.reduce((s, i) => s + i.thanhTien, 0);
  const tongTrongLuong = items.reduce((s, i) => s + (i.trongLuong || 0), 0);

  const thanhTienMon =
    newItem.trongLuong && newItem.giaThuVao
      ? newItem.trongLuong * newItem.giaThuVao
      : 0;

  useEffect(() => {
    getLoaiVang()
      .then((r) => setLoaiVang(r.data))
      .catch(() => message.error("Không tải được danh sách loại vàng"));

    getThuMua()
      .then((r) => setLichSu(r.data))
      .catch(() => {});
  }, []);

  const handleChonLoaiVang = (id) => {
    const lv = loaiVang.find((l) => l.id === id);
    setNewItem((prev) => ({
      ...prev,
      loaiVangId: id,
      giaThuVao: lv?.giaMuaVao || 0,
    }));
  };

  const handleThemMon = () => {
    if (!newItem.loaiVangId)
      return message.warning("Chọn loại vàng");
    if (!newItem.trongLuong || newItem.trongLuong <= 0)
      return message.warning("Nhập trọng lượng");
    if (!newItem.giaThuVao || newItem.giaThuVao <= 0)
      return message.warning("Nhập giá thu vào");

    const thanhTien = newItem.trongLuong * newItem.giaThuVao;
    setItems((prev) => [
      ...prev,
      { ...newItem, thanhTien, _id: Date.now() },
    ]);
    setNewItem({ loaiVangId: null, moTa: "", trongLuong: null, giaThuVao: 0 });
  };

  const handleXoaMon = (_id) =>
    setItems((prev) => prev.filter((i) => i._id !== _id));

  const taKhachMoi = async () => {
    try {
      const values = await formKH.validateFields();
      const res = await createKhachHang(values);
      setKhachHang(res.data);
      setModalKH(false);
      formKH.resetFields();
      message.success("Tạo khách hàng thành công");
    } catch {
      message.error("Lỗi tạo khách hàng");
    }
  };

  const handleSubmit = async () => {
    if (items.length === 0)
      return message.warning("Chưa có món hàng nào trong phiếu");
    setLoading(true);
    try {
      await createThuMua({
        khachHangId: khachHang?.id || null,
        ghiChu: ghiChuPhieu || null,
        hinhThucThanhToan: hinhThucTT,
        items: items.map(({ loaiVangId, moTa, trongLuong, giaThuVao, thanhTien }) => ({
          loaiVangId,
          moTa,
          trongLuong,
          giaThuVao,
          thanhTien,
        })),
      });
      message.success("Tạo phiếu thu mua thành công!");
      setItems([]);
      setKhachHang(null);
      setGhiChuPhieu("");
      const ls = await getThuMua();
      setLichSu(ls.data);
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi tạo phiếu");
    } finally {
      setLoading(false);
    }
  };

  // Cột bảng món hàng đang thêm
  const itemColumns = [
    {
      title: "STT",
      width: 48,
      render: (_, __, idx) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {idx + 1}
        </Text>
      ),
    },
    {
      title: "Loại vàng",
      render: (_, r) => {
        const lv = loaiVang.find((l) => l.id === r.loaiVangId);
        return lv ? <Tag color="gold">{lv.ten}</Tag> : "—";
      },
    },
    {
      title: "Mô tả tài sản",
      dataIndex: "moTa",
      render: (v) => (
        <Text style={{ fontSize: 12 }}>{v || <Text type="secondary">—</Text>}</Text>
      ),
    },
    {
      title: "Trọng lượng",
      dataIndex: "trongLuong",
      align: "right",
      render: (v) => `${v} chỉ`,
    },
    {
      title: "Giá thu vào",
      dataIndex: "giaThuVao",
      align: "right",
      render: (v) => (
        <Text style={{ fontSize: 12 }}>{formatMoney(v)} đ/chỉ</Text>
      ),
    },
    {
      title: "Thành tiền",
      dataIndex: "thanhTien",
      align: "right",
      render: (v) => <Text strong>{formatMoney(v)} đ</Text>,
    },
    {
      title: "",
      width: 40,
      render: (_, r) => (
        <Button
          danger
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleXoaMon(r._id)}
        />
      ),
    },
  ];

  // Cột bảng lịch sử
  const lichSuColumns = [
    {
      title: "Mã phiếu",
      dataIndex: "maPhieu",
      render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: "Khách hàng",
      render: (_, r) => r.khachHang?.hoTen || "Khách lẻ",
    },
    {
      title: "Hàng thu mua",
      render: (_, r) =>
        r.chiTiet?.map((ct) => (
          <Tag key={ct.id} color="gold" style={{ marginBottom: 2 }}>
            {ct.loaiVang?.kyHieu} {ct.trongLuong}chỉ
          </Tag>
        )),
    },
    {
      title: "Số món",
      render: (_, r) => r.chiTiet?.length || 0,
      align: "center",
      width: 70,
    },
    {
      title: "Tiền trả khách",
      dataIndex: "tongTienTraKhach",
      render: (v) => <Text strong>{formatMoney(v)} đ</Text>,
      align: "right",
    },
    {
      title: "Ngày",
      dataIndex: "taoLuc",
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
      width: 130,
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {/* ===== CỘT TRÁI ===== */}
      <Col span={15}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Khách hàng */}
          <Card title="Khách hàng" size="small">
            <KhachHangSearch
              value={khachHang}
              onChange={setKhachHang}
              onNew={() => setModalKH(true)}
            />
          </Card>

          {/* Danh sách món hàng */}
          <Card
            title={
              <span>
                Hàng thu mua{" "}
                {items.length > 0 && (
                  <Tag color="blue">{items.length} món</Tag>
                )}
              </span>
            }
            size="small"
          >
            {/* Bảng món đã thêm */}
            {items.length > 0 && (
              <Table
                dataSource={items}
                columns={itemColumns}
                rowKey="_id"
                pagination={false}
                size="small"
                style={{ marginBottom: 12 }}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={3} />
                    <Table.Summary.Cell align="right">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {tongTrongLuong.toFixed(2)} chỉ
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell />
                    <Table.Summary.Cell align="right">
                      <Text strong style={{ color: "#854F0B" }}>
                        {formatMoney(tongTien)} đ
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell />
                  </Table.Summary.Row>
                )}
              />
            )}

            {/* Form thêm món */}
            <div
              style={{
                background: "#fafafa",
                border: "1px dashed #d9d9d9",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text
                type="secondary"
                style={{ fontSize: 12, marginBottom: 8, display: "block" }}
              >
                Thêm món hàng
              </Text>
              <Row gutter={8} align="middle">
                <Col span={6}>
                  <Select
                    placeholder="Loại vàng"
                    style={{ width: "100%" }}
                    value={newItem.loaiVangId}
                    onChange={handleChonLoaiVang}
                    size="small"
                  >
                    {loaiVang.map((l) => (
                      <Option key={l.id} value={l.id}>
                        {l.ten}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={7}>
                  <Input
                    placeholder="Mô tả (tùy chọn)"
                    value={newItem.moTa}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, moTa: e.target.value }))
                    }
                    size="small"
                  />
                </Col>
                <Col span={4}>
                  <InputNumber
                    placeholder="Trọng lượng (chỉ)"
                    style={{ width: "100%" }}
                    min={0}
                    step={0.1}
                    value={newItem.trongLuong}
                    onChange={(v) =>
                      setNewItem((prev) => ({ ...prev, trongLuong: v }))
                    }
                    size="small"
                  />
                </Col>
                <Col span={5}>
                  <InputNumber
                    placeholder="Giá thu vào (đ/chỉ)"
                    style={{ width: "100%" }}
                    min={0}
                    step={100000}
                    value={newItem.giaThuVao}
                    onChange={(v) =>
                      setNewItem((prev) => ({ ...prev, giaThuVao: v }))
                    }
                    formatter={(v) =>
                      `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    size="small"
                  />
                </Col>
                <Col span={2}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleThemMon}
                    size="small"
                    style={{ width: "100%" }}
                  />
                </Col>
              </Row>
              {thanhTienMon > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: "#888" }}>
                  → Thành tiền:{" "}
                  <Text strong style={{ color: "#854F0B" }}>
                    {formatMoney(thanhTienMon)} đ
                  </Text>
                </div>
              )}
            </div>
          </Card>

          {/* Ghi chú phiếu */}
          <Card title="Ghi chú" size="small">
            <Input.TextArea
              rows={2}
              placeholder="Ghi chú cho phiếu thu mua..."
              value={ghiChuPhieu}
              onChange={(e) => setGhiChuPhieu(e.target.value)}
            />
          </Card>
        </div>
      </Col>

      {/* ===== CỘT PHẢI ===== */}
      <Col span={9}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            position: "sticky",
            top: 0,
          }}
        >
          {/* Tổng kết */}
          <Card title="Tổng kết phiếu" size="small">
            <div
              style={{
                background: "#f9f9f9",
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}
            >
              {[
                ["Số món hàng", `${items.length} món`],
                [
                  "Tổng trọng lượng",
                  items.length > 0 ? `${tongTrongLuong.toFixed(2)} chỉ` : "—",
                ],
              ].map(([l, v]) => (
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
                  <Text>{v}</Text>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "#fffbe6",
                border: "1px solid #ffe58f",
                borderRadius: 8,
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong style={{ color: "#854F0B" }}>
                Tiền trả khách
              </Text>
              <Title level={4} style={{ margin: 0, color: "#854F0B" }}>
                {formatMoney(tongTien)} đ
              </Title>
            </div>
          </Card>

          {/* Thanh toán */}
          <Card title="Hình thức thanh toán" size="small">
            <Select
              value={hinhThucTT}
              onChange={setHinhThucTT}
              style={{ width: "100%" }}
            >
              <Option value="TIEN_MAT">Tiền mặt</Option>
              <Option value="CHUYEN_KHOAN">Chuyển khoản</Option>
            </Select>
          </Card>

          {/* Nút hành động */}
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              style={{ flex: 1 }}
              onClick={() => {
                setItems([]);
                setKhachHang(null);
                setGhiChuPhieu("");
              }}
            >
              Hủy phiếu
            </Button>
            <Button
              type="primary"
              style={{ flex: 2 }}
              loading={loading}
              onClick={handleSubmit}
              disabled={items.length === 0}
            >
              Xác nhận & In phiếu
            </Button>
          </div>
        </div>
      </Col>

      {/* ===== LỊCH SỬ ===== */}
      <Col span={24}>
        <Card title="Lịch sử thu mua" size="small">
          <Table
            dataSource={lichSu}
            columns={lichSuColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 8 }}
          />
        </Card>
      </Col>

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
