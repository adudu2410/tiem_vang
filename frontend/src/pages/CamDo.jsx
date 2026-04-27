import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  Select,
  Form,
  InputNumber,
  message,
  Table,
  Tag,
  Typography,
  Divider,
  Modal,
  Tabs,
  Statistic,
  DatePicker,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getCamDo, createCamDo, chuocDo, giaHan } from "../api/camDo";
import { createKhachHang } from "../api/khachHang";
import KhachHangSearch from "../components/KhachHangSearch";
import { getLoaiVang } from "../api/cauHinh";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

const TRANG_THAI = {
  DANG_CAM: { label: "Đang cầm", color: "green" },
  SAP_DAO_HAN: { label: "Sắp đáo hạn", color: "orange" },
  QUA_HAN: { label: "Quá hạn", color: "red" },
  DA_CHUOC: { label: "Đã chuộc", color: "default" },
  DA_THANH_LY: { label: "Đã thanh lý", color: "default" },
};

export default function CamDo() {
  const [hopDong, setHopDong] = useState([]);
  const [loaiVang, setLoaiVang] = useState([]);
  const [khachHang, setKhachHang] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tabActive, setTabActive] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [modalTao, setModalTao] = useState(false);
  const [modalGiaHan, setModalGiaHan] = useState(false);
  const [modalKH, setModalKH] = useState(false);
  const [htttChuoc, setHtttChuoc] = useState("TIEN_MAT");
  const [formTao] = Form.useForm();
  const [formGiaHan] = Form.useForm();
  const [formKH] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hd, lv] = await Promise.all([getCamDo(), getLoaiVang()]);
      setHopDong(hd.data);
      setLoaiVang(lv.data);
    } catch {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([getCamDo(), getLoaiVang()])
      .then(([hd, lv]) => {
        setHopDong(hd.data);
        setLoaiVang(lv.data);
      })
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
    } catch {}
  };

  const handleTaoHD = async () => {
    if (!khachHang) return message.warning("Chưa chọn khách hàng!");
    try {
      const values = await formTao.validateFields();
      await createCamDo({
        ...values,
        khachHangId: khachHang.id,
        ngayVay: values.ngayVay.toISOString(),
        ngayDaoHan: values.ngayDaoHan.toISOString(),
      });
      message.success("Tạo hợp đồng thành công!");
      setModalTao(false);
      formTao.resetFields();
      setKhachHang(null);
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi");
    }
  };

  const handleChuoc = async (id) => {
    try {
      const res = await chuocDo(id, { hinhThucThanhToan: htttChuoc });
      message.success(
        `Chuộc thành công! Tổng thu: ${formatMoney(res.data.tongTien)} đ`,
      );
      fetchData();
      setSelected(null);
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi");
    }
  };

  const handleGiaHan = async () => {
    try {
      const values = await formGiaHan.validateFields();
      await giaHan(selected.id, {
        ngayDaoHanMoi: values.ngayDaoHanMoi.toISOString(),
        ghiChu: values.ghiChu,
      });
      message.success("Gia hạn thành công!");
      setModalGiaHan(false);
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi");
    }
  };

  const tabFilter = {
    ALL: hopDong,
    DANG_CAM: hopDong.filter((h) => h.trangThai === "DANG_CAM"),
    SAP_DAO_HAN: hopDong.filter((h) => h.trangThai === "SAP_DAO_HAN"),
    QUA_HAN: hopDong.filter((h) => h.trangThai === "QUA_HAN"),
    DA_CHUOC: hopDong.filter((h) =>
      ["DA_CHUOC", "DA_THANH_LY"].includes(h.trangThai),
    ),
  };
  const tongDuNo = hopDong
    .filter((h) => ["DANG_CAM", "SAP_DAO_HAN", "QUA_HAN"].includes(h.trangThai))
    .reduce((s, h) => s + h.soTienChoVay, 0);

  const columns = [
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
      title: "Khách hàng",
      key: "khach",
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>
            {r.khachHang?.hoTen}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.khachHang?.sdt}
          </Text>
        </div>
      ),
    },
    { title: "Tài sản", dataIndex: "moTaTaiSan", key: "ts", ellipsis: true },
    {
      title: "Tiền vay",
      dataIndex: "soTienChoVay",
      key: "tien",
      render: (v) => <Text strong>{formatMoney(v)}</Text>,
      align: "right",
    },
    {
      title: "Lãi PS",
      key: "lai",
      render: (_, r) => (
        <Text type="warning">{formatMoney(r.laiPhatSinh)}</Text>
      ),
      align: "right",
    },
    {
      title: "Đáo hạn",
      dataIndex: "ngayDaoHan",
      key: "dao",
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      key: "tt",
      render: (v) => (
        <Tag color={TRANG_THAI[v]?.color}>{TRANG_THAI[v]?.label}</Tag>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Tổng dư nợ"
              value={tongDuNo}
              formatter={(v) => formatMoney(v) + " đ"}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Đang cầm"
              value={tabFilter.DANG_CAM.length}
              suffix="hợp đồng"
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: "3px solid #faad14" }}>
            <Statistic
              title="Sắp đáo hạn"
              value={tabFilter.SAP_DAO_HAN.length}
              suffix="hợp đồng"
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: "3px solid #ff4d4f" }}>
            <Statistic
              title="Quá hạn"
              value={tabFilter.QUA_HAN.length}
              suffix="hợp đồng"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={selected ? 15 : 24}>
          <Card
            title="Danh sách hợp đồng"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalTao(true)}
              >
                Tạo hợp đồng
              </Button>
            }
          >
            <Tabs
              activeKey={tabActive}
              onChange={setTabActive}
              size="small"
              style={{ marginBottom: 12 }}
            >
              <TabPane tab={`Tất cả (${hopDong.length})`} key="ALL" />
              <TabPane
                tab={`Đang cầm (${tabFilter.DANG_CAM.length})`}
                key="DANG_CAM"
              />
              <TabPane
                tab={`Sắp đáo hạn (${tabFilter.SAP_DAO_HAN.length})`}
                key="SAP_DAO_HAN"
              />
              <TabPane
                tab={
                  <Text type="danger">
                    Quá hạn ({tabFilter.QUA_HAN.length})
                  </Text>
                }
                key="QUA_HAN"
              />
              <TabPane
                tab={`Đã đóng (${tabFilter.DA_CHUOC.length})`}
                key="DA_CHUOC"
              />
            </Tabs>
            <Table
              dataSource={tabFilter[tabActive]}
              columns={columns}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{ pageSize: 8 }}
              scroll={{ x: 600 }}
              onRow={(r) => ({
                onClick: () => setSelected(r === selected ? null : r),
                style: {
                  cursor: "pointer",
                  background: selected?.id === r.id ? "#fffbe6" : undefined,
                },
              })}
            />
          </Card>
        </Col>

        {selected && (
          <Col xs={24} lg={9}>
            <Card
              title="Chi tiết hợp đồng"
              extra={
                <Button size="small" onClick={() => setSelected(null)}>
                  ✕
                </Button>
              }
            >
              <div
                style={{
                  background: "#f9f9f9",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text code>{selected.maHopDong}</Text>
                <Tag
                  color={TRANG_THAI[selected.trangThai]?.color}
                  style={{ marginLeft: 8 }}
                >
                  {TRANG_THAI[selected.trangThai]?.label}
                </Tag>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ fontSize: 15 }}>
                    {selected.khachHang?.hoTen}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {selected.khachHang?.sdt} · {selected.khachHang?.cccd}
                  </Text>
                </div>
              </div>

              {[
                ["Tài sản", selected.moTaTaiSan],
                ["Loại vàng", selected.loaiVang?.ten],
                ["Trọng lượng", `${selected.trongLuongGram}g`],
                [
                  "Giá trị thẩm định",
                  formatMoney(selected.giaTriThamDinh) + " đ",
                ],
                ["Tiền cho vay", formatMoney(selected.soTienChoVay) + " đ"],
                ["Lãi suất", `${selected.laiSuatNgay.toLocaleString("vi-VN")}đ/triệu/ngày`],
                ["Ngày vay", dayjs(selected.ngayVay).format("DD/MM/YYYY")],
                [
                  "Ngày đáo hạn",
                  dayjs(selected.ngayDaoHan).format("DD/MM/YYYY"),
                ],
                ["Số ngày thực tế", `${selected.soNgayThucTe} ngày`],
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

              <div
                style={{
                  margin: "12px 0",
                  padding: 12,
                  background: "#fffbe6",
                  border: "1px solid #ffe58f",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    padding: "4px 0",
                  }}
                >
                  <Text>Tiền gốc</Text>
                  <Text>{formatMoney(selected.soTienChoVay)} đ</Text>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    padding: "4px 0",
                  }}
                >
                  <Text>Lãi phát sinh ({selected.soNgayThucTe} ngày)</Text>
                  <Text type="warning">
                    {formatMoney(selected.laiPhatSinh)} đ
                  </Text>
                </div>
                <Divider style={{ margin: "8px 0", borderColor: "#ffe58f" }} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#854F0B",
                  }}
                >
                  <span>Tổng cần trả</span>
                  <span>
                    {formatMoney(
                      selected.soTienChoVay + (selected.laiPhatSinh || 0),
                    )}{" "}
                    đ
                  </span>
                </div>
              </div>

              {["DANG_CAM", "SAP_DAO_HAN", "QUA_HAN"].includes(
                selected.trangThai,
              ) && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <Select
                    value={htttChuoc}
                    onChange={setHtttChuoc}
                    style={{ width: "100%" }}
                    size="small"
                  >
                    <Option value="TIEN_MAT">💵 Tiền mặt</Option>
                    <Option value="CHUYEN_KHOAN">🏦 Chuyển khoản</Option>
                  </Select>
                  <Button
                    type="primary"
                    style={{ background: "#52c41a", borderColor: "#52c41a" }}
                    block
                    onClick={() => handleChuoc(selected.id)}
                  >
                    Chuộc đồ
                  </Button>
                  <Button block onClick={() => setModalGiaHan(true)}>
                    Gia hạn
                  </Button>
                  {selected.trangThai === "QUA_HAN" && (
                    <Button danger block>
                      Xử lý quá hạn
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </Col>
        )}
      </Row>

      <Modal
        title="Tạo hợp đồng cầm đồ"
        open={modalTao}
        onOk={handleTaoHD}
        onCancel={() => {
          setModalTao(false);
          setKhachHang(null);
        }}
        okText="Tạo hợp đồng"
        cancelText="Hủy"
        width={600}
      >
        <div style={{ marginBottom: 12 }}>
          <KhachHangSearch
            value={khachHang}
            onChange={setKhachHang}
            onNew={() => setModalKH(true)}
          />
        </div>
        <Form form={formTao} layout="vertical">
          <Row gutter={16}>
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
            <Col span={12}>
              <Form.Item
                name="trongLuongGram"
                label="Trọng lượng (gram)"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} step={0.1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="moTaTaiSan"
            label="Mô tả tài sản"
            rules={[{ required: true }]}
          >
            <Input.TextArea
              rows={2}
              placeholder="VD: Nhẫn vàng 18K, 3.2 chỉ, còn mới..."
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="giaTriThamDinh"
                label="Giá trị thẩm định (đ)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="soTienChoVay"
                label="Số tiền cho vay (đ)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ngayVay"
                label="Ngày vay"
                initialValue={dayjs()}
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ngayDaoHan"
                label="Ngày đáo hạn"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <div
            style={{
              background: "#fffbe6",
              border: "1px solid #ffe58f",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 12,
              color: "#854F0B",
              marginBottom: 12,
            }}
          >
            Lãi suất tự động: &lt; 10 triệu → <b>2.000đ/triệu/ngày</b> · ≥ 10 triệu → <b>1.500đ/triệu/ngày</b>
          </div>
          <Form.Item name="ghiChu" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Gia hạn hợp đồng"
        open={modalGiaHan}
        onOk={handleGiaHan}
        onCancel={() => setModalGiaHan(false)}
        okText="Gia hạn"
        cancelText="Hủy"
      >
        <Form form={formGiaHan} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="ngayDaoHanMoi"
            label="Ngày đáo hạn mới"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="ghiChu" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

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
    </div>
  );
}
