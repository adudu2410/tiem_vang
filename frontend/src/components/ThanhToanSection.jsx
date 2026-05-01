import { Card, Select, InputNumber } from "antd";
import { Typography } from "antd";

const { Option } = Select;
const { Text } = Typography;
const fmt = (v) => new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

export function buildThanhToanPayload({ hinhThuc, soTienCK, tongTien, ghiChu = "" }) {
  if (hinhThuc === "KET_HOP") {
    const tm = Math.max(0, (tongTien || 0) - (soTienCK || 0));
    const note = `[TM:${fmt(tm)}đ | CK:${fmt(soTienCK || 0)}đ]`;
    return {
      hinhThucThanhToan: "CHUYEN_KHOAN",
      ghiChu: ghiChu ? `${ghiChu} ${note}` : note,
    };
  }
  return {
    hinhThucThanhToan: hinhThuc === "TIEN_MAT" ? "TIEN_MAT" : "CHUYEN_KHOAN",
    ghiChu,
  };
}

export default function ThanhToanSection({
  hinhThuc,
  onHinhThuc,
  soTienCK,
  onSoTienCK,
  tongTien,
  title = "Hình thức thanh toán",
}) {
  const soTienTM = Math.max(0, (tongTien || 0) - (soTienCK || 0));

  return (
    <Card title={title} size="small">
      <Select
        value={hinhThuc}
        onChange={(v) => {
          onHinhThuc(v);
          if (v === "TIEN_MAT") onSoTienCK(0);
        }}
        style={{ width: "100%" }}
      >
        <Option value="TIEN_MAT">💵 Tiền mặt</Option>
        <Option value="CHUYEN_KHOAN">🏦 Chuyển khoản</Option>
        <Option value="KET_HOP">💵🏦 Tiền mặt + Chuyển khoản</Option>
      </Select>

      {hinhThuc === "CHUYEN_KHOAN" && tongTien > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: "6px 10px",
            background: "#e6f4ff",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          <Text type="secondary">Số tiền CK: </Text>
          <Text strong style={{ color: "#0958d9" }}>
            {fmt(tongTien)} đ
          </Text>
        </div>
      )}

      {hinhThuc === "KET_HOP" && (
        <div style={{ marginTop: 8 }}>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginBottom: 4 }}
          >
            Số tiền chuyển khoản (đ)
          </Text>
          <InputNumber
            style={{ width: "100%" }}
            value={soTienCK}
            min={0}
            max={tongTien || undefined}
            onChange={onSoTienCK}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            placeholder="Nhập số tiền chuyển khoản..."
          />
          <div
            style={{
              marginTop: 6,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <Text type="secondary">Tiền mặt còn lại:</Text>
            <Text strong style={{ color: "#854F0B" }}>
              {fmt(soTienTM)} đ
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
}
