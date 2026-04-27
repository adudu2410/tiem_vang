import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Statistic,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Space,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  getSanPham,
  createSanPham,
  updateSanPham,
  deleteSanPham,
} from "../api/sanPham";
import { getDanhMuc } from "../api/cauHinh";
import { getLoaiVang } from "../api/cauHinh";

const { Text } = Typography;
const { Option } = Select;

const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

export default function KhoHang() {
  const [sanPham, setSanPham] = useState([]);
  const [danhMuc, setDanhMuc] = useState([]);
  const [loaiVang, setLoaiVang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filters, setFilters] = useState({});
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sp, dm, lv] = await Promise.all([
        getSanPham(filters),
        getDanhMuc(),
        getLoaiVang(),
      ]);
      setSanPham(sp.data);
      setDanhMuc(dm.data);
      setLoaiVang(lv.data);
    } catch (e) {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const openModal = (item = null) => {
    setEditItem(item);
    if (item) {
      form.setFieldsValue({
        ...item,
        danhMucId: item.danhMucId,
        loaiVangId: item.loaiVangId,
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editItem) {
        await updateSanPham(editItem.id, values);
        message.success("Cập nhật thành công");
      } else {
        await createSanPham(values);
        message.success("Thêm sản phẩm thành công");
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi lưu dữ liệu");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSanPham(id);
      message.success("Đã xóa sản phẩm");
      if (selected?.id === id) setSelected(null);
      fetchData();
    } catch (e) {
      message.error("Không thể xóa sản phẩm này");
    }
  };

  const sapHet = sanPham.filter((s) => s.soLuongTon <= s.soLuongToiThieu);
  const tongGiaTriKho = sanPham.reduce(
    (s, p) => s + p.giaVon * p.soLuongTon,
    0,
  );

  const columns = [
    {
      title: "Sản phẩm",
      key: "ten",
      render: (_, r) => (
        <div>
          <Text strong>{r.ten}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.maSp}
          </Text>
        </div>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: ["danhMuc", "ten"],
      key: "danhMuc",
    },
    {
      title: "Loại vàng",
      key: "loaiVang",
      render: (_, r) => <Tag color="gold">{r.loaiVang?.kyHieu}</Tag>,
    },
    {
      title: "Trọng lượng",
      key: "trongLuong",
      render: (_, r) => `${r.trongLuongChi} chỉ`,
    },
    {
      title: "Tiền công",
      dataIndex: "tienCongMacDinh",
      key: "tienCong",
      render: (v) => formatMoney(v) + " đ",
      align: "right",
    },
    {
      title: "Giá bán",
      dataIndex: "giaBan",
      key: "giaBan",
      render: (v) => <Text strong>{formatMoney(v)} đ</Text>,
      align: "right",
    },
    {
      title: "Tồn kho",
      key: "ton",
      align: "center",
      render: (_, r) => {
        const color =
          r.soLuongTon <= r.soLuongToiThieu
            ? "red"
            : r.soLuongTon <= r.soLuongToiThieu * 2
              ? "orange"
              : "green";
        return <Tag color={color}>{r.soLuongTon} cái</Tag>;
      },
    },
    {
      title: "Nguồn",
      dataIndex: "nguonGoc",
      key: "nguon",
      render: (v) => <Tag>{v === "NHAP_MOI" ? "Nhập mới" : "Thu mua"}</Tag>,
    },
    {
      title: "",
      key: "action",
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              openModal(r);
            }}
          />
          <Popconfirm
            title="Xóa sản phẩm này?"
            onConfirm={(e) => {
              handleDelete(r.id);
            }}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng sản phẩm"
              value={sanPham.length}
              suffix="sản phẩm"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Giá trị kho (vốn)"
              value={tongGiaTriKho}
              formatter={(v) => formatMoney(v) + " đ"}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            style={{
              borderLeft: sapHet.length > 0 ? "3px solid #faad14" : undefined,
            }}
          >
            <Statistic
              title="Sắp hết hàng"
              value={sapHet.length}
              suffix="sản phẩm"
              prefix={
                sapHet.length > 0 ? (
                  <WarningOutlined style={{ color: "#faad14" }} />
                ) : null
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Hàng thu mua"
              value={sanPham.filter((s) => s.nguonGoc === "THU_MUA").length}
              suffix="sản phẩm"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={selected ? 16 : 24}>
          <Card
            title="Danh sách sản phẩm"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
              >
                Thêm sản phẩm
              </Button>
            }
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <Input.Search
                placeholder="Tìm theo tên, mã sản phẩm..."
                allowClear
                style={{ flex: 1 }}
                onSearch={(v) => setFilters((f) => ({ ...f, search: v }))}
              />
              <Select
                placeholder="Danh mục"
                allowClear
                style={{ width: 150 }}
                onChange={(v) => setFilters((f) => ({ ...f, danhMucId: v }))}
              >
                {danhMuc.map((d) => (
                  <Option key={d.id} value={d.id}>
                    {d.ten}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Loại vàng"
                allowClear
                style={{ width: 130 }}
                onChange={(v) => setFilters((f) => ({ ...f, loaiVangId: v }))}
              >
                {loaiVang.map((l) => (
                  <Option key={l.id} value={l.id}>
                    {l.ten}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Nguồn gốc"
                allowClear
                style={{ width: 130 }}
                onChange={(v) => setFilters((f) => ({ ...f, nguonGoc: v }))}
              >
                <Option value="NHAP_MOI">Nhập mới</Option>
                <Option value="THU_MUA">Thu mua</Option>
              </Select>
            </div>
            <Table
              dataSource={sanPham}
              columns={columns}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{ pageSize: 10 }}
              onRow={(r) => ({
                onClick: () => setSelected(r),
                style: {
                  cursor: "pointer",
                  background: selected?.id === r.id ? "#fffbe6" : undefined,
                },
              })}
            />
          </Card>
        </Col>

        {selected && (
          <Col span={8}>
            <Card
              title="Chi tiết sản phẩm"
              extra={
                <Button size="small" onClick={() => setSelected(null)}>
                  ✕
                </Button>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px 0",
                    borderBottom: "1px solid #f0f0f0",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: "#fffbe6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 8px",
                    }}
                  >
                    <GoldOutlined style={{ fontSize: 28, color: "#EF9F27" }} />
                  </div>
                  <Text strong style={{ fontSize: 16 }}>
                    {selected.ten}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {selected.maSp}
                  </Text>
                </div>

                {[
                  ["Danh mục", selected.danhMuc?.ten],
                  ["Loại vàng", selected.loaiVang?.ten],
                  [
                    "Trọng lượng",
                    `${selected.trongLuongChi} chỉ · ${selected.trongLuongGram}g`,
                  ],
                  ["Giá vốn", formatMoney(selected.giaVon) + " đ"],
                  ["Giá bán", formatMoney(selected.giaBan) + " đ"],
                  [
                    "Tiền công mặc định",
                    formatMoney(selected.tienCongMacDinh) + " đ",
                  ],
                  ["Tồn kho", `${selected.soLuongTon} cái`],
                  ["Tồn kho tối thiểu", `${selected.soLuongToiThieu} cái`],
                  [
                    "Nguồn gốc",
                    selected.nguonGoc === "NHAP_MOI" ? "Nhập mới" : "Thu mua",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #f9f9f9",
                      fontSize: 13,
                    }}
                  >
                    <Text type="secondary">{label}</Text>
                    <Text strong>{value}</Text>
                  </div>
                ))}

                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <Button
                    style={{ flex: 1 }}
                    onClick={() => openModal(selected)}
                  >
                    Sửa
                  </Button>
                  <Button type="primary" style={{ flex: 1 }}>
                    Bán ngay
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      <Modal
        title={editItem ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editItem ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="ten"
            label="Tên sản phẩm"
            rules={[{ required: true, message: "Nhập tên sản phẩm" }]}
          >
            <Input placeholder="VD: Nhẫn trơn nữ" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="danhMucId"
                label="Danh mục"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn danh mục">
                  {danhMuc.map((d) => (
                    <Option key={d.id} value={d.id}>
                      {d.ten}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="loaiVangId"
                label="Loại vàng"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn loại vàng">
                  {loaiVang.map((l) => (
                    <Option key={l.id} value={l.id}>
                      {l.ten}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="trongLuongChi"
                label="Trọng lượng (chỉ)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="trongLuongGram"
                label="Trọng lượng (gram)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="giaVon"
                label="Giá vốn (đ)"
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
            </Col>
            <Col span={12}>
              <Form.Item
                name="giaBan"
                label="Giá bán (đ)"
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
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tienCongMacDinh" label="Tiền công mặc định (đ)">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="soLuongTon"
                label="Số lượng nhập"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="soLuongToiThieu" label="Tồn kho tối thiểu">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="1"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nguonGoc" label="Nguồn gốc">
                <Select defaultValue="NHAP_MOI">
                  <Option value="NHAP_MOI">Nhập mới</Option>
                  <Option value="THU_MUA">Thu mua</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
