import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Input,
  InputNumber,
  Form,
  message,
  Tag,
  Popconfirm,
  Typography,
  Divider,
  Space,
} from "antd";
import { PlusOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import {
  createLoaiVang,
  getLoaiVang,
  updateLoaiVang,
  getDanhMuc,
  createDanhMuc,
  deleteDanhMuc,
  getDanhMucChiPhi,
  createDanhMucChiPhi,
  getCauHinhHeThong,
  updateCauHinhHeThong,
} from "../api/cauHinh";

const { Text, Title } = Typography;
const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

export default function CauHinh() {
  const [loaiVang, setLoaiVang] = useState([]);
  const [danhMuc, setDanhMuc] = useState([]);
  const [danhMucCP, setDanhMucCP] = useState([]);
  const [cauHinh, setCauHinh] = useState({});
  const [newDM, setNewDM] = useState("");
  const [newDMCP, setNewDMCP] = useState("");
  const [loading, setLoading] = useState(false);
  const [formCH] = Form.useForm();
  const [editingLV, setEditingLV] = useState({});
  const [newLV, setNewLV] = useState({
    ten: "",
    kyHieu: "",
    giaMuaVao: 0,
    giaBanRa: 0,
  });

  const fetchData = async () => {
    try {
      const [lv, dm, dmcp, ch] = await Promise.all([
        getLoaiVang(),
        getDanhMuc(),
        getDanhMucChiPhi(),
        getCauHinhHeThong(),
      ]);
      setLoaiVang(lv.data);
      setDanhMuc(dm.data);
      setDanhMucCP(dmcp.data);
      setCauHinh(ch.data);
      formCH.setFieldsValue(ch.data);
    } catch {
      message.error("Lỗi tải dữ liệu");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const luuGiaVang = async (id) => {
    try {
      const row = loaiVang.find((x) => x.id === id);
      const edited = editingLV[id];

      if (!edited) return;

      const payload = {
        giaMuaVao: edited.giaMuaVao ?? row.giaMuaVao,
        giaBanRa: edited.giaBanRa ?? row.giaBanRa,
      };

      await updateLoaiVang(id, payload);

      message.success("Cập nhật giá vàng thành công!");

      setEditingLV((e) => {
        const n = { ...e };
        delete n[id];
        return n;
      });

      fetchData();
    } catch {
      message.error("Lỗi cập nhật");
    }
  };

  const themLoaiVang = async () => {
    try {
      if (!newLV.ten || !newLV.kyHieu) {
        return message.warning("Nhập tên và ký hiệu");
      }

      await createLoaiVang(newLV);

      message.success("Thêm loại vàng thành công");

      setNewLV({
        ten: "",
        kyHieu: "",
        giaMuaVao: 0,
        giaBanRa: 0,
      });

      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi");
    }
  };

  const themDanhMuc = async () => {
    if (!newDM.trim()) return;
    try {
      await createDanhMuc({ ten: newDM.trim() });
      message.success("Thêm danh mục thành công");
      setNewDM("");
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi");
    }
  };

  const xoaDanhMuc = async (id) => {
    try {
      await deleteDanhMuc(id);
      message.success("Đã xóa danh mục");
      fetchData();
    } catch {
      message.error("Không thể xóa — đang có sản phẩm sử dụng");
    }
  };

  const themDanhMucCP = async () => {
    if (!newDMCP.trim()) return;
    try {
      await createDanhMucChiPhi({ ten: newDMCP.trim() });
      message.success("Thêm loại chi phí thành công");
      setNewDMCP("");
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi");
    }
  };

  const luuCauHinh = async () => {
    try {
      const values = await formCH.validateFields();
      setLoading(true);
      await updateCauHinhHeThong(values);
      message.success("Lưu cấu hình thành công!");
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  const lvColumns = [
    {
      title: "Loại vàng",
      dataIndex: "ten",
      key: "ten",
      render: (v, r) => (
        <>
          <Text strong>{v}</Text> <Tag>{r.kyHieu}</Tag>
        </>
      ),
    },
    {
      title: "Giá mua vào (đ/chỉ)",
      key: "mua",
      render: (_, r) => (
        <InputNumber
          style={{ width: "100%" }}
          value={editingLV[r.id]?.giaMuaVao ?? r.giaMuaVao}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          onChange={(v) =>
            setEditingLV((e) => ({
              ...e,
              [r.id]: { ...e[r.id], giaMuaVao: v },
            }))
          }
          size="small"
        />
      ),
    },
    {
      title: "Giá bán ra (đ/chỉ)",
      key: "ban",
      render: (_, r) => (
        <InputNumber
          style={{ width: "100%" }}
          value={editingLV[r.id]?.giaBanRa ?? r.giaBanRa}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          onChange={(v) =>
            setEditingLV((e) => ({ ...e, [r.id]: { ...e[r.id], giaBanRa: v } }))
          }
          size="small"
        />
      ),
    },
    {
      title: "",
      key: "luu",
      width: 80,
      render: (_, r) => (
        <Button
          size="small"
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => luuGiaVang(r.id)}
          disabled={!editingLV[r.id]}
        >
          Lưu
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card
              title="Bảng giá vàng hôm nay"
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Chỉnh sửa trực tiếp → nhấn Lưu
                </Text>
              }
            >
              <Table
                dataSource={loaiVang}
                columns={lvColumns}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 500 }}
              />
              <Divider />

              <Space wrap>
                <Input
                  placeholder="Tên"
                  value={newLV.ten}
                  onChange={(e) => setNewLV({ ...newLV, ten: e.target.value })}
                  style={{ width: 120 }}
                />

                <Input
                  placeholder="Ký hiệu"
                  value={newLV.kyHieu}
                  onChange={(e) =>
                    setNewLV({ ...newLV, kyHieu: e.target.value })
                  }
                  style={{ width: 80 }}
                />

                <InputNumber
                  placeholder="Giá mua"
                  onChange={(v) => setNewLV({ ...newLV, giaMuaVao: v })}
                />

                <InputNumber
                  placeholder="Giá bán"
                  onChange={(v) => setNewLV({ ...newLV, giaBanRa: v })}
                />

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={themLoaiVang}
                >
                  Thêm
                </Button>
              </Space>
            </Card>

            <Card title="Tỷ lệ nghiệp vụ">
              <Form form={formCH} layout="vertical">
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Lãi suất cầm đồ">
                      <div style={{ fontSize: 12, lineHeight: 2, color: "#555" }}>
                        <div>
                          Dưới 10 triệu:{" "}
                          <Text strong>2.000đ / triệu / ngày</Text>
                        </div>
                        <div>
                          Từ 10 triệu trở lên:{" "}
                          <Text strong>1.500đ / triệu / ngày</Text>
                        </div>
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="canh_bao_dao_han"
                      label="Nhắc đáo hạn trước (ngày)"
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={1}
                        step={1}
                        placeholder="7"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="nguong_ton_kho"
                      label="Ngưỡng cảnh báo tồn kho (cái)"
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        step={1}
                        placeholder="3"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="diem_tren_trieu"
                      label="Điểm tích lũy / 100,000đ"
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={1}
                        step={1}
                        placeholder="1"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={luuCauHinh}
                  loading={loading}
                >
                  Lưu tỷ lệ
                </Button>
              </Form>
            </Card>
          </div>
        </Col>

        <Col xs={24} lg={10}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card title="Danh mục sản phẩm" size="small">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 12,
                  minHeight: 40,
                }}
              >
                {danhMuc.map((d) => (
                  <Tag
                    key={d.id}
                    closable
                    onClose={() => xoaDanhMuc(d.id)}
                    style={{ marginBottom: 4 }}
                  >
                    {d.ten}
                  </Tag>
                ))}
                {danhMuc.length === 0 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Chưa có danh mục nào
                  </Text>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  value={newDM}
                  onChange={(e) => setNewDM(e.target.value)}
                  onPressEnter={themDanhMuc}
                  placeholder="Thêm danh mục mới..."
                  style={{ flex: 1 }}
                  size="small"
                />
                <Button
                  size="small"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={themDanhMuc}
                >
                  Thêm
                </Button>
              </div>
            </Card>

            <Card title="Danh mục chi phí vận hành" size="small">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 12,
                  minHeight: 40,
                }}
              >
                {danhMucCP.map((d) => (
                  <Tag key={d.id} color="red" style={{ marginBottom: 4 }}>
                    {d.ten}
                  </Tag>
                ))}
                {danhMucCP.length === 0 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Chưa có loại chi phí nào
                  </Text>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  value={newDMCP}
                  onChange={(e) => setNewDMCP(e.target.value)}
                  onPressEnter={themDanhMucCP}
                  placeholder="VD: Tiền điện, Tiền nước..."
                  style={{ flex: 1 }}
                  size="small"
                />
                <Button
                  size="small"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={themDanhMucCP}
                >
                  Thêm
                </Button>
              </div>
            </Card>

            <Card title="Thông tin tiệm" size="small">
              <Form layout="vertical">
                <Form.Item label="Tên tiệm">
                  <Input placeholder="Tiệm Vàng Gia Đình" />
                </Form.Item>
                <Form.Item label="Địa chỉ">
                  <Input placeholder="123 Đường ABC, Bến Tre" />
                </Form.Item>
                <Form.Item label="Số điện thoại">
                  <Input placeholder="0901 234 567" />
                </Form.Item>
                <Form.Item label="Số dư két ban đầu (đ)">
                  <InputNumber
                    style={{ width: "100%" }}
                    formatter={(v) =>
                      `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    placeholder="0"
                  />
                </Form.Item>
                <Button type="primary" icon={<SaveOutlined />} block>
                  Lưu thông tin
                </Button>
              </Form>
            </Card>

            <Card
              title="Hướng dẫn nhập dữ liệu đầu tiên"
              size="small"
              style={{ background: "#fffbe6", border: "1px solid #ffe58f" }}
            >
              <div style={{ fontSize: 12, lineHeight: 1.8, color: "#854F0B" }}>
                <strong>Thứ tự nhập dữ liệu ban đầu:</strong>
                <br />
                1. Nhập các loại vàng và giá
                <br />
                2. Thêm danh mục sản phẩm
                <br />
                3. Thêm danh mục chi phí
                <br />
                4. Vào Kho hàng → thêm sản phẩm
                <br />
                5. Bắt đầu sử dụng các chức năng
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}
