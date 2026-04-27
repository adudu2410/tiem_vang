import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Input,
  Button,
  Tag,
  Typography,
  Tabs,
  Statistic,
  Modal,
  Form,
  message,
} from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import {
  getKhachHang,
  getKhachHangById,
  createKhachHang,
  updateKhachHang,
} from "../api/khachHang";
import dayjs from "dayjs";

const { Text } = Typography;
const { TabPane } = Tabs;
const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

export default function KhachHang() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async (search = "") => {
    setLoading(true);
    try {
      const res = await getKhachHang({ search });
      setList(res.data);
    } catch {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chonKhach = async (kh) => {
    setSelected(kh);
    try {
      const res = await getKhachHangById(kh.id);
      setDetail(res.data);
    } catch {}
  };

  const openModal = (item = null) => {
    setEditItem(item);
    if (item) form.setFieldsValue(item);
    else form.resetFields();
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editItem) {
        await updateKhachHang(editItem.id, values);
        message.success("Cập nhật thành công");
      } else {
        await createKhachHang(values);
        message.success("Thêm khách hàng thành công");
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi");
    }
  };

  const tongMua =
    detail?.hoaDonBan?.reduce((s, h) => s + h.tongSauChieuKhau, 0) || 0;

  const columns = [
    {
      title: "Khách hàng",
      key: "kh",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#fffbe6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              color: "#854F0B",
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {r.hoTen?.charAt(0)}
          </div>
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {r.hoTen}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              KH-{String(r.id).padStart(5, "0")}
            </Text>
          </div>
        </div>
      ),
    },
    { title: "SĐT", dataIndex: "sdt", key: "sdt" },
    {
      title: "Điểm tích lũy",
      dataIndex: "tongDiem",
      key: "diem",
      render: (v) => <Tag color="gold">{v} điểm</Tag>,
      align: "center",
    },
    {
      title: "Số HĐ mua",
      key: "hd",
      render: (_, r) => r._count?.hoaDonBan || 0,
      align: "center",
    },
    {
      title: "Cầm đồ",
      key: "cd",
      render: (_, r) =>
        r._count?.hopDongCamDo > 0 ? (
          <Tag color="blue">{r._count.hopDongCamDo}</Tag>
        ) : (
          <Tag>Không</Tag>
        ),
      align: "center",
    },
    {
      title: "Thành viên từ",
      dataIndex: "taoLuc",
      key: "tao",
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
  ];

  const hoaDonCols = [
    {
      title: "Mã HĐ",
      dataIndex: "maHd",
      key: "ma",
      render: (v) => (
        <Text code style={{ fontSize: 11 }}>
          {v}
        </Text>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "tongSauChieuKhau",
      key: "tong",
      render: (v) => formatMoney(v) + " đ",
      align: "right",
    },
    {
      title: "Ngày",
      dataIndex: "taoLuc",
      key: "ngay",
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
  ];

  const camDoCols = [
    {
      title: "Mã HĐ",
      dataIndex: "maHopDong",
      key: "ma",
      render: (v) => (
        <Text code style={{ fontSize: 11 }}>
          {v}
        </Text>
      ),
    },
    {
      title: "Tiền vay",
      dataIndex: "soTienChoVay",
      key: "tien",
      render: (v) => formatMoney(v) + " đ",
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      key: "tt",
      render: (v) => <Tag>{v}</Tag>,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Row gutter={16}>
        <Col span={selected ? 14 : 24}>
          <Card
            title={`Khách hàng (${list.length})`}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
              >
                Thêm khách hàng
              </Button>
            }
          >
            <Input.Search
              placeholder="Tìm theo tên, SĐT, CCCD..."
              allowClear
              onSearch={fetchData}
              style={{ marginBottom: 16 }}
            />
            <Table
              dataSource={list}
              columns={columns}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{ pageSize: 10 }}
              onRow={(r) => ({
                onClick: () => chonKhach(r),
                style: {
                  cursor: "pointer",
                  background: selected?.id === r.id ? "#fffbe6" : undefined,
                },
              })}
            />
          </Card>
        </Col>

        {selected && (
          <Col span={10}>
            <Card
              title="Hồ sơ khách hàng"
              extra={
                <Button size="small" onClick={() => setSelected(null)}>
                  ✕
                </Button>
              }
            >
              <div
                style={{
                  textAlign: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid #f0f0f0",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "#fffbe6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "#854F0B",
                    fontSize: 20,
                    margin: "0 auto 8px",
                  }}
                >
                  {selected.hoTen?.charAt(0)}
                </div>
                <Text strong style={{ fontSize: 16 }}>
                  {selected.hoTen}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  KH-{String(selected.id).padStart(5, "0")} · Thành viên từ{" "}
                  {dayjs(selected.taoLuc).format("MM/YYYY")}
                </Text>
                <br />
                <Tag color="gold" style={{ marginTop: 6 }}>
                  {selected.tongDiem} điểm tích lũy
                </Tag>
              </div>

              <Row gutter={8} style={{ marginBottom: 12 }}>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {detail?.hoaDonBan?.length || 0}
                    </div>
                    <div style={{ fontSize: 11, color: "#999" }}>Lần mua</div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {detail?.hopDongCamDo?.length || 0}
                    </div>
                    <div style={{ fontSize: 11, color: "#999" }}>Lần cầm</div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      {(tongMua / 1000000).toFixed(1)}tr
                    </div>
                    <div style={{ fontSize: 11, color: "#999" }}>Tổng chi</div>
                  </Card>
                </Col>
              </Row>

              {[
                ["SĐT", selected.sdt],
                ["CCCD", selected.cccd || "—"],
                [
                  "Ngày sinh",
                  selected.ngaySinh
                    ? dayjs(selected.ngaySinh).format("DD/MM/YYYY")
                    : "—",
                ],
                ["Địa chỉ", selected.diaChi || "—"],
              ].map(([l, v]) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "7px 0",
                    borderBottom: "1px solid #f5f5f5",
                    fontSize: 13,
                  }}
                >
                  <Text type="secondary">{l}</Text>
                  <Text strong>{v}</Text>
                </div>
              ))}

              <div style={{ marginTop: 12 }}>
                <Tabs size="small">
                  <TabPane tab="Mua hàng" key="hd">
                    <Table
                      dataSource={detail?.hoaDonBan || []}
                      columns={hoaDonCols}
                      rowKey="id"
                      size="small"
                      pagination={{ pageSize: 4 }}
                    />
                  </TabPane>
                  <TabPane tab="Cầm đồ" key="cd">
                    <Table
                      dataSource={detail?.hopDongCamDo || []}
                      columns={camDoCols}
                      rowKey="id"
                      size="small"
                      pagination={{ pageSize: 4 }}
                    />
                  </TabPane>
                </Tabs>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button style={{ flex: 1 }} onClick={() => openModal(selected)}>
                  Sửa hồ sơ
                </Button>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      <Modal
        title={editItem ? "Sửa khách hàng" : "Thêm khách hàng mới"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editItem ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
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
    </div>
  );
}
