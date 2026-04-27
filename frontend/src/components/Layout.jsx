import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Typography } from "antd";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  GoldOutlined,
  SwapOutlined,
  LockOutlined,
  TeamOutlined,
  DollarOutlined,
  SettingOutlined,
  ShoppingOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
  {
    key: "g1",
    label: "Nghiệp vụ",
    type: "group",
    children: [
      { key: "/ban-hang", icon: <ShoppingCartOutlined />, label: "Bán hàng" },
      { key: "/kho-hang", icon: <GoldOutlined />, label: "Kho hàng" },
      { key: "/thu-mua", icon: <ShoppingOutlined />, label: "Thu mua" },
      { key: "/doi-vang", icon: <SwapOutlined />, label: "Đổi vàng" },
      { key: "/cam-do", icon: <LockOutlined />, label: "Cầm đồ" },
      { key: "/dich-vu", icon: <ToolOutlined />, label: "Dịch vụ" },
    ],
  },
  {
    key: "g2",
    label: "Quản lý",
    type: "group",
    children: [
      { key: "/khach-hang", icon: <TeamOutlined />, label: "Khách hàng" },
      { key: "/dong-tien", icon: <DollarOutlined />, label: "Dòng tiền" },
      { key: "/cau-hinh", icon: <SettingOutlined />, label: "Cấu hình" },
    ],
  },
];

const pageTitles = {
  "/": "Dashboard",
  "/ban-hang": "Bán hàng",
  "/kho-hang": "Kho hàng",
  "/thu-mua": "Thu mua",
  "/doi-vang": "Đổi vàng",
  "/cam-do": "Cầm đồ",
  "/dich-vu": "Dịch vụ",
  "/khach-hang": "Khách hàng",
  "/dong-tien": "Dòng tiền",
  "/cau-hinh": "Cấu hình",
};

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}
      >
        <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: "#EF9F27",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GoldOutlined style={{ color: "#fff", fontSize: 16 }} />
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  NGỌC BÍCH VÂN
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>
                  Quản lý nội bộ
                </div>
              </div>
            )}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: "none", marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Text strong style={{ fontSize: 16 }}>
            {pageTitles[location.pathname] || "Trang"}
          </Text>
        </Header>
        <Content style={{ margin: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
