import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Alert,
  Typography,
  Badge,
} from "antd";
import {
  ArrowUpOutlined,
  GoldOutlined,
  ShoppingOutlined,
  LockOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getSoDu, getDongTien } from "../api/dongTien";
import { getCamDo } from "../api/camDo";
import { getSanPham } from "../api/sanPham";
import { getHoaDon } from "../api/hoaDon";
import { getDichVu } from "../api/dichVu";
import dayjs from "dayjs";

const { Text } = Typography;

const formatMoney = (v) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

const PIE_COLORS = ["#EF9F27", "#1D9E75", "#534AB7", "#D3D1C7", "#13c2c2"];

export default function Dashboard() {
  const [soDu, setSoDu] = useState({});
  const [camDo, setCamDo] = useState([]);
  const [sanPham, setSanPham] = useState([]);
  const [hoaDon, setHoaDon] = useState([]);
  const [dichVu, setDichVu] = useState([]);
  const [dongTien, setDongTien] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sd, cd, sp, hd, dv, dt] = await Promise.all([
          getSoDu(),
          getCamDo(),
          getSanPham(),
          getHoaDon({ tuNgay: dayjs().startOf("day").toISOString() }),
          getDichVu({ tuNgay: dayjs().startOf("day").toISOString() }),
          getDongTien({
            tuNgay: dayjs().subtract(6, "day").startOf("day").toISOString(),
          }),
        ]);
        setSoDu(sd.data);
        setCamDo(cd.data);
        setSanPham(sp.data);
        setHoaDon(hd.data);
        setDichVu(dv.data);
        setDongTien(dt.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const quaHan = camDo.filter((h) => h.trangThai === "QUA_HAN");
  const sapDaoHan = camDo.filter((h) => h.trangThai === "SAP_DAO_HAN");
  const sapHet = sanPham.filter((s) => s.soLuongTon <= s.soLuongToiThieu);
  const tongDuNo = camDo
    .filter((h) => ["DANG_CAM", "SAP_DAO_HAN", "QUA_HAN"].includes(h.trangThai))
    .reduce((s, h) => s + h.soTienChoVay, 0);

  // Dữ liệu biểu đồ doanh thu 7 ngày
  const barData = Array.from({ length: 7 }, (_, i) => {
    const ngay = dayjs().subtract(6 - i, "day");
    const thu = dongTien
      .filter(
        (g) => g.loaiGiaoDich === "THU" && dayjs(g.taoLuc).isSame(ngay, "day"),
      )
      .reduce((s, g) => s + g.soTien, 0);
    const chi = dongTien
      .filter(
        (g) => g.loaiGiaoDich === "CHI" && dayjs(g.taoLuc).isSame(ngay, "day"),
      )
      .reduce((s, g) => s + g.soTien, 0);
    return { ngay: ngay.format("DD/MM"), thu, chi };
  });

  // Dữ liệu donut cơ cấu
  const donutData = [
    {
      name: "Bán hàng",
      value: dongTien
        .filter((g) => g.nguonGocType === "BAN_HANG")
        .reduce((s, g) => s + g.soTien, 0),
    },
    {
      name: "Cầm đồ",
      value: dongTien
        .filter((g) => g.nguonGocType === "CAM_DO_CHUOC")
        .reduce((s, g) => s + g.soTien, 0),
    },
    {
      name: "Thu mua",
      value: dongTien
        .filter((g) => g.nguonGocType === "THU_MUA")
        .reduce((s, g) => s + g.soTien, 0),
    },
    {
      name: "Đổi vàng",
      value: dongTien
        .filter((g) => g.nguonGocType === "DOI_VANG")
        .reduce((s, g) => s + g.soTien, 0),
    },
    {
      name: "Dịch vụ",
      value: dongTien
        .filter((g) => g.nguonGocType === "DICH_VU")
        .reduce((s, g) => s + g.soTien, 0),
    },
  ].filter((d) => d.value > 0);

  const camDoColumns = [
    { title: "Khách hàng", dataIndex: ["khachHang", "hoTen"], key: "khach" },
    {
      title: "Đáo hạn",
      dataIndex: "ngayDaoHan",
      key: "dao_han",
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      key: "trang_thai",
      render: (v) => {
        const map = {
          QUA_HAN: ["Quá hạn", "red"],
          SAP_DAO_HAN: ["Sắp đáo hạn", "orange"],
          DANG_CAM: ["Đang cầm", "green"],
        };
        const [label, color] = map[v] || ["Không rõ", "default"];
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Tiền vay",
      dataIndex: "soTienChoVay",
      key: "tien",
      render: (v) => formatMoney(v) + " đ",
      align: "right",
    },
  ];

  const giaoDichHomNay = [
    ...hoaDon.map((h) => ({
      id: `hd-${h.id}`,
      ma: h.maHd,
      khach: h.khachHang?.hoTen || "Khách lẻ",
      tong: h.tongSauChieuKhau,
      gio: h.taoLuc,
      loai: "BAN_HANG",
    })),
    ...dichVu
      .filter((d) => d.trangThai === "DA_GIAO")
      .map((d) => ({
        id: `dv-${d.id}`,
        ma: d.maPhieu,
        khach: d.khachHang?.hoTen || d.tenKhach || "Khách lẻ",
        tong: d.giaTien,
        gio: d.taoLuc,
        loai: "DICH_VU",
      })),
  ].sort((a, b) => dayjs(b.gio).valueOf() - dayjs(a.gio).valueOf());

  const hoaDonColumns = [
    {
      title: "Mã",
      dataIndex: "ma",
      key: "ma",
      render: (v) => (
        <Text code style={{ fontSize: 11 }}>
          {v}
        </Text>
      ),
    },
    {
      title: "Khách",
      dataIndex: "khach",
      key: "khach",
    },
    {
      title: "Loại",
      dataIndex: "loai",
      key: "loai",
      render: (v) =>
        v === "DICH_VU" ? (
          <Tag color="purple" style={{ fontSize: 10 }}>Dịch vụ</Tag>
        ) : (
          <Tag color="gold" style={{ fontSize: 10 }}>Bán hàng</Tag>
        ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "tong",
      key: "tong",
      render: (v) => formatMoney(v) + " đ",
      align: "right",
    },
    {
      title: "Giờ",
      dataIndex: "gio",
      key: "gio",
      render: (v) => dayjs(v).format("HH:mm"),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {quaHan.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message={`Có ${quaHan.length} hợp đồng cầm đồ đã quá hạn — cần xử lý ngay!`}
        />
      )}
      {sapDaoHan.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`Có ${sapDaoHan.length} hợp đồng sắp đáo hạn trong 7 ngày tới`}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Doanh thu hôm nay"
              value={soDu.tongThuHomNay || 0}
              formatter={(v) => formatMoney(v) + " đ"}
              prefix={<ArrowUpOutlined style={{ color: "#52c41a" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Tiền trong két (Hệ thống)"
              value={soDu.soDuHienTai || 0}
              formatter={(v) => formatMoney(v) + " đ"}
              prefix={<GoldOutlined style={{ color: "#EF9F27" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: "3px solid #faad14" }}>
            <Statistic
              title="Dư nợ cầm đồ"
              value={tongDuNo}
              formatter={(v) => formatMoney(v) + " đ"}
              prefix={<LockOutlined style={{ color: "#faad14" }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {
                camDo.filter((h) =>
                  ["DANG_CAM", "SAP_DAO_HAN", "QUA_HAN"].includes(h.trangThai),
                ).length
              }{" "}
              hợp đồng
            </Text>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Hàng tồn kho"
              value={sanPham.length}
              suffix="sản phẩm"
              prefix={<ShoppingOutlined />}
            />
            {sapHet.length > 0 && (
              <Text type="danger" style={{ fontSize: 12 }}>
                {sapHet.length} sắp hết hàng
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="Doanh thu & Chi phí 7 ngày qua">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <XAxis dataKey="ngay" />
                <YAxis tickFormatter={(v) => (v / 1000000).toFixed(0) + "tr"} />
                <Tooltip formatter={(v) => formatMoney(v) + " đ"} />
                <Legend />
                <Bar
                  dataKey="thu"
                  name="Thu"
                  fill="#EF9F27"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="chi"
                  name="Chi"
                  fill="#ff4d4f"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Cơ cấu doanh thu">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(v) + " đ"} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: 220,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                }}
              >
                Chưa có dữ liệu
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <>
                Hợp đồng cần xử lý{" "}
                <Badge count={quaHan.length + sapDaoHan.length} />
              </>
            }
            size="small"
          >
            <Table
              dataSource={[...quaHan, ...sapDaoHan].slice(0, 5)}
              columns={camDoColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
              scroll={{ x: 400 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Giao dịch hôm nay" size="small">
            <Table
              dataSource={giaoDichHomNay.slice(0, 6)}
              columns={hoaDonColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
              scroll={{ x: 400 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
