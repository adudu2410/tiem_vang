import { useState } from "react";
import { Input, Button, Typography, message } from "antd";
import { SearchOutlined, UserOutlined, PlusOutlined } from "@ant-design/icons";
import { getKhachHang } from "../api/khachHang";

const { Text } = Typography;

/**
 * Props:
 *  - value: object | null  — khách đang chọn
 *  - onChange: (kh) => void — khi chọn KH
 *  - onNew: () => void (optional) — mở modal tạo KH mới
 *  - showDiem: bool (default false) — hiện điểm tích lũy
 *  - placeholder: string
 */
export default function KhachHangSearch({
  value,
  onChange,
  onNew,
  showDiem = false,
  placeholder = "Tìm theo SĐT hoặc tên...",
}) {
  const [search, setSearch] = useState("");
  const [dsKetQua, setDsKetQua] = useState([]);

  const handleSearch = async () => {
    const q = search.trim();
    if (!q) return;
    try {
      const res = await getKhachHang({ search: q });
      if (res.data.length === 0) {
        message.warning("Không tìm thấy khách hàng");
        setDsKetQua([]);
      } else if (res.data.length === 1) {
        chon(res.data[0]);
      } else {
        setDsKetQua(res.data);
      }
    } catch {
      message.error("Lỗi tìm kiếm");
    }
  };

  const chon = (kh) => {
    onChange(kh);
    setSearch("");
    setDsKetQua([]);
  };

  const xoa = () => {
    onChange(null);
    setSearch("");
    setDsKetQua([]);
  };

  const handleChange = (e) => {
    setSearch(e.target.value);
    if (!e.target.value) setDsKetQua([]);
  };

  if (value) {
    return (
      <div
        style={{
          padding: "8px 12px",
          background: "#f6ffed",
          border: "1px solid #b7eb8f",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "#d9f7be", display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 700,
              color: "#389e0d", fontSize: 13, flexShrink: 0,
            }}
          >
            {value.hoTen.charAt(0)}
          </div>
          <div>
            <Text strong style={{ fontSize: 13 }}>{value.hoTen}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {value.sdt}
              {showDiem && value.tongDiem !== undefined && ` · ${value.tongDiem} điểm`}
            </Text>
          </div>
        </div>
        <Button size="small" onClick={xoa}>✕</Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          placeholder={placeholder}
          value={search}
          onChange={handleChange}
          onPressEnter={handleSearch}
          prefix={<UserOutlined />}
          style={{ flex: 1 }}
        />
        <Button onClick={handleSearch} icon={<SearchOutlined />}>Tìm</Button>
        {onNew && (
          <Button onClick={onNew} icon={<PlusOutlined />}>Mới</Button>
        )}
      </div>

      {dsKetQua.length > 1 && (
        <div
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            marginTop: 4,
            background: "#fff",
            boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "5px 12px",
              borderBottom: "1px solid #f0f0f0",
              fontSize: 11,
              color: "#999",
              background: "#fafafa",
            }}
          >
            Tìm thấy {dsKetQua.length} kết quả — chọn khách hàng:
          </div>
          {dsKetQua.map((kh) => (
            <div
              key={kh.id}
              onClick={() => chon(kh)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom: "1px solid #f5f5f5",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <Text strong style={{ fontSize: 13 }}>{kh.hoTen}</Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  {kh.sdt}
                </Text>
                {kh.cccd && (
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                    · {kh.cccd}
                  </Text>
                )}
              </div>
              {showDiem && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {kh.tongDiem} điểm
                </Text>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
