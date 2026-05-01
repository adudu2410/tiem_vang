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
  Tag,
  Typography,
  Divider,
  Modal,
} from "antd";
import { SwapOutlined } from "@ant-design/icons";
import { createDoiVang, getDoiVang } from "../api/doiVang";
import { createKhachHang } from "../api/khachHang";
import KhachHangSearch from "../components/KhachHangSearch";
import ThanhToanSection, { buildThanhToanPayload } from "../components/ThanhToanSection";
import { printPhieuDoiVang } from "../utils/print";
import { getLoaiVang } from "../api/cauHinh";
import { getSanPham } from "../api/sanPham";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;
const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

export default function DoiVang() {
  const [loaiVang, setLoaiVang] = useState([]);
  const [sanPham, setSanPham] = useState([]);
  const [khachHang, setKhachHang] = useState(null);
  const [spChon, setSpChon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalKH, setModalKH] = useState(false);
  const [hinhThuc, setHinhThuc] = useState("TIEN_MAT");
  const [soTienCK, setSoTienCK] = useState(0);
  const [formKH] = Form.useForm();
  const [form] = Form.useForm();

  const loaiVangCuId = Form.useWatch("loaiVangCuId", form);
  const trongLuongCuGram = Form.useWatch("trongLuongCuGram", form);
  const tyLeThuMua = Form.useWatch("tyLeThuMua", form) || 92;
  const giaVangMoiApDung = Form.useWatch("giaVangMoiApDung", form) || 0;
  const tienCongHangMoi = Form.useWatch("tienCongHangMoi", form) || 0;

  const loaiVangCu = loaiVang.find((l) => l.id === loaiVangCuId);
  const giaVangCuApDung = loaiVangCu?.giaMuaVao || 0;
  const giaTriVangCu = trongLuongCuGram
    ? trongLuongCuGram * (giaVangCuApDung / 3.75) * (tyLeThuMua / 100)
    : 0;
  const giaSanPhamMoi = spChon
    ? spChon.trongLuongGram * (giaVangMoiApDung / 3.75)
    : 0;
  const chenhLech = giaSanPhamMoi + tienCongHangMoi - giaTriVangCu;

  useEffect(() => {
    const fetchInit = async () => {
      const [lv, sp] = await Promise.all([getLoaiVang(), getSanPham()]);
      setLoaiVang(lv.data);
      setSanPham(sp.data);
    };
    fetchInit();
  }, []);

  const chonSanPham = (sp) => {
    setSpChon(sp);
    const lv = loaiVang.find((l) => l.id === sp.loaiVangId);
    form.setFieldsValue({
      sanPhamMoiId: sp.id,
      giaVangMoiApDung: lv?.giaBanRa || 0,
      tienCongHangMoi: sp.tienCongMacDinh || 0,
    });
  };

  const taKhachMoi = async () => {
    try {
      const values = await formKH.validateFields();
      const res = await createKhachHang(values);
      setKhachHang(res.data);
      setModalKH(false);
      formKH.resetFields();
      message.success("Tạo khách hàng thành công");
    } catch {
      message.error("Lỗi");
    }
  };

  const handleSubmit = async () => {
    if (!spChon) return message.warning("Chưa chọn sản phẩm mới!");
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = buildThanhToanPayload({
        hinhThuc,
        soTienCK,
        tongTien: Math.abs(chenhLech),
        ghiChu: values.ghiChu || "",
      });
      const res = await createDoiVang({
        ...values,
        khachHangId: khachHang?.id || null,
        giaVangCuApDung,
        giaTriVangCu,
        chenhLech,
        hinhThucThanhToan: payload.hinhThucThanhToan,
        ghiChu: payload.ghiChu,
      });
      message.success("Tạo phiếu đổi vàng thành công!");
      const loaiVangCuData = loaiVang.find((l) => l.id === loaiVangCuId);
      printPhieuDoiVang({
        maPhieu: res.data?.maPhieu || "PDV",
        khachHang,
        vangCu: [
          ["Loại vàng", loaiVangCuData?.ten || ""],
          ["Trọng lượng", `${trongLuongCuGram}g`],
          ["Giá mua vào", `${formatMoney(giaVangCuApDung)} đ/chỉ`],
          ["Tỷ lệ thu mua", `${tyLeThuMua}%`],
          ["Giá trị vàng cũ", `${formatMoney(giaTriVangCu)} đ`],
        ],
        vangMoi: [
          ["Sản phẩm", spChon?.ten || ""],
          ["Trọng lượng", spChon ? `${spChon.trongLuongGram}g` : ""],
          ["Giá vàng", `${formatMoney(giaVangMoiApDung)} đ/chỉ`],
          ["Tiền công", `${formatMoney(tienCongHangMoi)} đ`],
          ["Tổng SP mới", `${formatMoney(giaSanPhamMoi + tienCongHangMoi)} đ`],
        ],
        chenhLech,
        hinhThuc,
        soTienCK,
        ghiChu: payload.ghiChu,
        ngay: new Date().toISOString(),
      });
      form.resetFields();
      setKhachHang(null);
      setSpChon(null);
      setHinhThuc("TIEN_MAT");
      setSoTienCK(0);
    } catch (e) {
      message.error(e.response?.data?.error || "Lỗi tạo phiếu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Thông tin khách hàng" size="small">
            <KhachHangSearch
              value={khachHang}
              onChange={setKhachHang}
              onNew={() => setModalKH(true)}
            />
          </Card>

          <Card title="Vàng cũ khách mang đến" size="small">
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="loaiVangCuId"
                    label="Loại vàng cũ"
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
                    name="trongLuongCuGram"
                    label="Trọng lượng (gram)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} step={0.1} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="tyLeThuMua"
                    label="Tỷ lệ thu mua (%)"
                    initialValue={92}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} max={100} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Giá mua vào hiện tại">
                    <Input
                      value={formatMoney(giaVangCuApDung) + " đ/chỉ"}
                      disabled
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="ghiChu" label="Tình trạng vàng cũ">
                <Input.TextArea
                  rows={2}
                  placeholder="VD: Dây chuyền 24K, còn mới..."
                />
              </Form.Item>

              <Divider>Vàng mới khách nhận</Divider>

              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Chọn sản phẩm từ kho:
                </Text>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 6,
                    maxHeight: 150,
                    overflowY: "auto",
                  }}
                >
                  {sanPham
                    .filter((s) => s.soLuongTon > 0)
                    .map((sp) => (
                      <div
                        key={sp.id}
                        onClick={() => chonSanPham(sp)}
                        style={{
                          padding: "4px 10px",
                          border: `1px solid ${spChon?.id === sp.id ? "#EF9F27" : "#f0f0f0"}`,
                          background: spChon?.id === sp.id ? "#fffbe6" : "#fff",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        <strong>{sp.ten}</strong> ·{" "}
                        <Tag color="gold" style={{ fontSize: 10, margin: 0 }}>
                          {sp.loaiVang?.kyHieu}
                        </Tag>
                      </div>
                    ))}
                </div>
              </div>

              {spChon && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="sanPhamMoiId" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="giaVangMoiApDung"
                      label="Giá vàng mới (đ/chỉ)"
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
                    <Form.Item name="tienCongHangMoi" label="Tiền công (đ)">
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
              )}
            </Form>
          </Card>
        </div>
      </Col>

      <Col xs={24} lg={10}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            position: "sticky",
            top: 0,
          }}
        >
          <Card title="Bảng tính chênh lệch" size="small">
            <div
              style={{
                background: "#fff1f0",
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#cf1322", fontWeight: 500, fontSize: 12 }}>
                Giá trị vàng cũ
              </Text>
              {[
                [
                  "Trọng lượng",
                  trongLuongCuGram ? `${trongLuongCuGram}g` : "—",
                ],
                ["Giá mua vào", formatMoney(giaVangCuApDung) + " đ/chỉ"],
                ["Tỷ lệ", `${tyLeThuMua}%`],
                ["Giá trị", formatMoney(giaTriVangCu) + " đ"],
              ].map(([l, v]) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    padding: "3px 0",
                  }}
                >
                  <Text type="secondary">{l}</Text>
                  <Text>{v}</Text>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <SwapOutlined style={{ fontSize: 20, color: "#999" }} />
            </div>

            <div
              style={{
                background: "#f6ffed",
                borderRadius: 8,
                padding: 10,
                marginTop: 8,
              }}
            >
              <Text style={{ color: "#389e0d", fontWeight: 500, fontSize: 12 }}>
                Giá trị vàng mới
              </Text>
              {[
                ["Sản phẩm", spChon?.ten || "—"],
                ["Trọng lượng", spChon ? `${spChon.trongLuongGram}g` : "—"],
                ["Giá vàng", formatMoney(giaVangMoiApDung) + " đ/chỉ"],
                ["Tiền vàng", formatMoney(giaSanPhamMoi) + " đ"],
                ["Tiền công", formatMoney(tienCongHangMoi) + " đ"],
                ["Tổng", formatMoney(giaSanPhamMoi + tienCongHangMoi) + " đ"],
              ].map(([l, v]) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    padding: "3px 0",
                  }}
                >
                  <Text type="secondary">{l}</Text>
                  <Text>{v}</Text>
                </div>
              ))}
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                background: chenhLech >= 0 ? "#f6ffed" : "#fff1f0",
                border: `1px solid ${chenhLech >= 0 ? "#b7eb8f" : "#ffa39e"}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                strong
                style={{ color: chenhLech >= 0 ? "#389e0d" : "#cf1322" }}
              >
                {chenhLech >= 0 ? "Khách bù thêm" : "Tiệm hoàn lại"}
              </Text>
              <Text
                strong
                style={{
                  fontSize: 20,
                  color: chenhLech >= 0 ? "#389e0d" : "#cf1322",
                }}
              >
                {formatMoney(Math.abs(chenhLech))} đ
              </Text>
            </div>
          </Card>

          <ThanhToanSection
            hinhThuc={hinhThuc}
            onHinhThuc={setHinhThuc}
            soTienCK={soTienCK}
            onSoTienCK={setSoTienCK}
            tongTien={Math.abs(chenhLech)}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <Button
              style={{ flex: 1 }}
              onClick={() => {
                form.resetFields();
                setKhachHang(null);
                setSpChon(null);
                setHinhThuc("TIEN_MAT");
                setSoTienCK(0);
              }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              style={{ flex: 2 }}
              loading={loading}
              onClick={handleSubmit}
            >
              Xác nhận & In phiếu
            </Button>
          </div>
        </div>
      </Col>

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
