const fmt = (v) => new Intl.NumberFormat("vi-VN").format(Math.round(v || 0));

function fmtDateTime(d) {
  return new Date(d || Date.now()).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function openPrint(html) {
  try {
    const win = window.open("", "_blank", "width=520,height=750");
    win.document.write(html);
    win.document.close();
    win.addEventListener("load", () => {
      win.focus();
      win.print();
    });
  } catch {
    alert("Không thể mở cửa sổ in. Vui lòng cho phép popup trong trình duyệt.");
  }
}

const css = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; max-width: 380px; margin: 0 auto; color: #111; }
  .header { text-align: center; margin-bottom: 10px; }
  .header h2 { font-size: 15px; font-weight: bold; letter-spacing: 1px; }
  .header p { font-size: 11px; color: #555; }
  .dash { border-top: 1px dashed #333; margin: 8px 0; }
  .title { text-align: center; font-size: 13px; font-weight: bold; padding: 4px 0; letter-spacing: 2px; }
  .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 11px; }
  th { border-bottom: 1px solid #333; padding: 3px 2px; text-align: left; font-weight: bold; }
  td { padding: 3px 2px; vertical-align: top; }
  .num { text-align: right; }
  .grand { font-size: 13px; font-weight: bold; border-top: 1px dashed #333; padding-top: 5px; margin-top: 3px; }
  .paybox { border: 1px dashed #333; padding: 6px 10px; margin: 8px 0; font-size: 12px; }
  .note { font-size: 11px; color: #555; margin: 4px 0; }
  .sigs { display: flex; justify-content: space-around; margin-top: 28px; text-align: center; font-size: 11px; }
  .sigs div { min-width: 100px; }
  .sigs .name { font-weight: bold; margin-bottom: 30px; }
  .thanks { text-align: center; margin-top: 14px; font-size: 11px; color: #666; border-top: 1px dashed #ccc; padding-top: 8px; }
  @media print { body { padding: 4px; } }
`;

function ptText(hinhThuc, soTienCK, total) {
  if (hinhThuc === "TIEN_MAT") return `Tiền mặt: ${fmt(total)} đ`;
  if (hinhThuc === "CHUYEN_KHOAN") return `Chuyển khoản: ${fmt(total)} đ`;
  const ck = soTienCK || 0;
  const tm = Math.max(0, total - ck);
  return `Tiền mặt: ${fmt(tm)} đ &nbsp;|&nbsp; Chuyển khoản: ${fmt(ck)} đ`;
}

export function printHoaDonBan({
  maHD,
  khachHang,
  items,
  tongTien,
  giamGia,
  tongThanhToan,
  hinhThuc,
  soTienCK,
  ghiChu,
  ngay,
}) {
  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${maHD}</title><style>${css}</style></head>
<body>
<div class="header"><h2>TIỆM VÀNG NGỌC BÍCH VÂN</h2><p>Chuyên kinh doanh vàng bạc đá quý</p></div>
<div class="dash"></div>
<div class="title">HÓA ĐƠN BÁN HÀNG</div>
<div class="dash"></div>
<div class="row"><span>Mã HĐ:</span><span><b>${maHD}</b></span></div>
<div class="row"><span>Ngày:</span><span>${fmtDateTime(ngay)}</span></div>
<div class="row"><span>Khách:</span><span>${khachHang?.hoTen || "Khách lẻ"}</span></div>
${khachHang?.sdt ? `<div class="row"><span>SĐT:</span><span>${khachHang.sdt}</span></div>` : ""}
<div class="dash"></div>
<table>
  <thead><tr><th>Sản phẩm</th><th class="num">SL</th><th class="num">Đơn giá</th><th class="num">T.Tiền</th></tr></thead>
  <tbody>${items
    .map(
      (i) => `
    <tr>
      <td>${i.ten || i.sanPham?.ten || ""}${i.maSp || i.sanPham?.maSp ? `<br><span style="font-size:10px;color:#888">${i.maSp || i.sanPham?.maSp}</span>` : ""}</td>
      <td class="num">${i.soLuong}</td>
      <td class="num">${fmt(i.donGia)}</td>
      <td class="num">${fmt(i.thanhTien)}</td>
    </tr>`,
    )
    .join("")}
  </tbody>
</table>
<div class="dash"></div>
<div class="row"><span>Tạm tính:</span><span>${fmt(tongTien)} đ</span></div>
${giamGia > 0 ? `<div class="row"><span>Giảm giá:</span><span>- ${fmt(giamGia)} đ</span></div>` : ""}
<div class="row grand"><span>TỔNG THANH TOÁN:</span><span>${fmt(tongThanhToan)} đ</span></div>
<div class="paybox"><b>Thanh toán:</b> ${ptText(hinhThuc, soTienCK, tongThanhToan)}</div>
${ghiChu ? `<div class="note">Ghi chú: ${ghiChu}</div>` : ""}
<div class="sigs">
  <div><div class="name">Khách hàng</div><small>(Ký, ghi rõ họ tên)</small></div>
  <div><div class="name">Người bán</div><small>(Ký, ghi rõ họ tên)</small></div>
</div>
<div class="thanks">Cảm ơn quý khách! Hẹn gặp lại.</div>
</body></html>`);
}

export function printPhieuThuMua({
  maPhieu,
  khachHang,
  items,
  tongTien,
  hinhThuc,
  soTienCK,
  ghiChu,
  ngay,
}) {
  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${maPhieu}</title><style>${css}</style></head>
<body>
<div class="header"><h2>TIỆM VÀNG NGỌC BÍCH VÂN</h2></div>
<div class="dash"></div>
<div class="title">PHIẾU THU MUA VÀNG</div>
<div class="dash"></div>
<div class="row"><span>Mã phiếu:</span><span><b>${maPhieu}</b></span></div>
<div class="row"><span>Ngày:</span><span>${fmtDateTime(ngay)}</span></div>
<div class="row"><span>Khách:</span><span>${khachHang?.hoTen || "Khách lẻ"}</span></div>
${khachHang?.sdt ? `<div class="row"><span>SĐT:</span><span>${khachHang.sdt}</span></div>` : ""}
<div class="dash"></div>
<table>
  <thead><tr><th>Loại / Mô tả</th><th class="num">T.Lượng</th><th class="num">Giá/chỉ</th><th class="num">T.Tiền</th></tr></thead>
  <tbody>${items
    .map(
      (i) => `
    <tr>
      <td>${i.tenLoaiVang || ""}${i.moTa ? `<br><span style="font-size:10px;color:#888">${i.moTa}</span>` : ""}</td>
      <td class="num">${i.trongLuong} chỉ</td>
      <td class="num">${fmt(i.giaThuVao)}</td>
      <td class="num">${fmt(i.thanhTien)}</td>
    </tr>`,
    )
    .join("")}
  </tbody>
</table>
<div class="dash"></div>
<div class="row grand"><span>TIỀN TRẢ KHÁCH:</span><span>${fmt(tongTien)} đ</span></div>
<div class="paybox"><b>Thanh toán:</b> ${ptText(hinhThuc, soTienCK, tongTien)}</div>
${ghiChu ? `<div class="note">Ghi chú: ${ghiChu}</div>` : ""}
<div class="sigs">
  <div><div class="name">Khách hàng</div><small>(Ký, ghi rõ họ tên)</small></div>
  <div><div class="name">Người thu mua</div><small>(Ký, ghi rõ họ tên)</small></div>
</div>
<div class="thanks">Cảm ơn quý khách!</div>
</body></html>`);
}

export function printPhieuDoiVang({
  maPhieu,
  khachHang,
  vangCu,
  vangMoi,
  chenhLech,
  hinhThuc,
  soTienCK,
  ghiChu,
  ngay,
}) {
  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${maPhieu}</title><style>${css}</style></head>
<body>
<div class="header"><h2>TIỆM VÀNG NGỌC BÍCH VÂN</h2></div>
<div class="dash"></div>
<div class="title">PHIẾU ĐỔI VÀNG</div>
<div class="dash"></div>
<div class="row"><span>Mã phiếu:</span><span><b>${maPhieu}</b></span></div>
<div class="row"><span>Ngày:</span><span>${fmtDateTime(ngay)}</span></div>
<div class="row"><span>Khách:</span><span>${khachHang?.hoTen || "Khách lẻ"}</span></div>
${khachHang?.sdt ? `<div class="row"><span>SĐT:</span><span>${khachHang.sdt}</span></div>` : ""}
<div class="dash"></div>
<div style="font-weight:bold;font-size:11px;margin:4px 0">VÀNG CŨ KHÁCH MANG ĐẾN:</div>
${vangCu.map(([l, v]) => `<div class="row"><span style="color:#888">${l}:</span><span>${v}</span></div>`).join("")}
<div class="dash"></div>
<div style="font-weight:bold;font-size:11px;margin:4px 0">VÀNG MỚI KHÁCH NHẬN:</div>
${vangMoi.map(([l, v]) => `<div class="row"><span style="color:#888">${l}:</span><span>${v}</span></div>`).join("")}
<div class="dash"></div>
<div class="row grand"><span>${chenhLech >= 0 ? "KHÁCH BÙ THÊM:" : "TIỆM HOÀN LẠI:"}</span><span>${fmt(Math.abs(chenhLech))} đ</span></div>
${Math.abs(chenhLech) > 0 ? `<div class="paybox"><b>Thanh toán:</b> ${ptText(hinhThuc, soTienCK, Math.abs(chenhLech))}</div>` : ""}
${ghiChu ? `<div class="note">Ghi chú: ${ghiChu}</div>` : ""}
<div class="sigs">
  <div><div class="name">Khách hàng</div><small>(Ký, ghi rõ họ tên)</small></div>
  <div><div class="name">Nhân viên</div><small>(Ký, ghi rõ họ tên)</small></div>
</div>
<div class="thanks">Cảm ơn quý khách!</div>
</body></html>`);
}

export function printHopDongCamDo({
  maHopDong,
  khachHang,
  loaiVang,
  moTa,
  trongLuong,
  giaTriThamDinh,
  soTienChoVay,
  laiSuatNgay,
  ngayVay,
  ngayDaoHan,
  ghiChu,
}) {
  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>HD ${maHopDong}</title><style>${css}</style></head>
<body>
<div class="header"><h2>TIỆM VÀNG NGỌC BÍCH VÂN</h2></div>
<div class="dash"></div>
<div class="title">HỢP ĐỒNG CẦM ĐỒ</div>
<div class="dash"></div>
<div class="row"><span>Mã HĐ:</span><span><b>${maHopDong}</b></span></div>
<div class="row"><span>Ngày lập:</span><span>${fmtDateTime()}</span></div>
<div class="dash"></div>
<div style="font-weight:bold;font-size:11px;margin:4px 0">THÔNG TIN KHÁCH HÀNG:</div>
<div class="row"><span>Họ tên:</span><span>${khachHang?.hoTen || ""}</span></div>
<div class="row"><span>SĐT:</span><span>${khachHang?.sdt || ""}</span></div>
${khachHang?.cccd ? `<div class="row"><span>CCCD:</span><span>${khachHang.cccd}</span></div>` : ""}
<div class="dash"></div>
<div style="font-weight:bold;font-size:11px;margin:4px 0">TÀI SẢN CẦM:</div>
<div class="row"><span>Loại vàng:</span><span>${loaiVang}</span></div>
<div class="row"><span>Mô tả:</span><span>${moTa}</span></div>
<div class="row"><span>Trọng lượng:</span><span>${trongLuong} gram</span></div>
<div class="row"><span>Giá trị thẩm định:</span><span>${fmt(giaTriThamDinh)} đ</span></div>
<div class="dash"></div>
<div style="font-weight:bold;font-size:11px;margin:4px 0">ĐIỀU KHOẢN:</div>
<div class="row"><span>Số tiền cho vay:</span><span><b>${fmt(soTienChoVay)} đ</b></span></div>
<div class="row"><span>Lãi suất:</span><span>${laiSuatNgay.toLocaleString("vi-VN")} đ/triệu/ngày</span></div>
<div class="row"><span>Ngày vay:</span><span>${new Date(ngayVay).toLocaleDateString("vi-VN")}</span></div>
<div class="row"><span>Ngày đáo hạn:</span><span><b>${new Date(ngayDaoHan).toLocaleDateString("vi-VN")}</b></span></div>
${ghiChu ? `<div class="note">Ghi chú: ${ghiChu}</div>` : ""}
<div class="dash"></div>
<div style="font-size:10px;color:#555;margin:6px 0;line-height:1.6">
  Khách hàng cam kết hoàn trả đúng hạn. Quá hạn sẽ tính lãi theo thỏa thuận hai bên.
</div>
<div class="sigs">
  <div><div class="name">Bên vay (KH)</div><small>(Ký, ghi rõ họ tên)</small></div>
  <div><div class="name">Bên cho vay</div><small>(Ký, ghi rõ họ tên)</small></div>
</div>
</body></html>`);
}

export function printPhieuChuoc({
  maHopDong,
  khachHang,
  soTienGoc,
  soNgay,
  tienLai,
  tongTien,
  hinhThuc,
  soTienCK,
  ngay,
}) {
  openPrint(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Phiếu chuộc ${maHopDong}</title><style>${css}</style></head>
<body>
<div class="header"><h2>TIỆM VÀNG NGỌC BÍCH VÂN</h2></div>
<div class="dash"></div>
<div class="title">PHIẾU CHUỘC ĐỒ</div>
<div class="dash"></div>
<div class="row"><span>Mã HĐ:</span><span><b>${maHopDong}</b></span></div>
<div class="row"><span>Ngày chuộc:</span><span>${fmtDateTime(ngay)}</span></div>
<div class="row"><span>Khách hàng:</span><span>${khachHang?.hoTen || ""}</span></div>
${khachHang?.sdt ? `<div class="row"><span>SĐT:</span><span>${khachHang.sdt}</span></div>` : ""}
<div class="dash"></div>
<div class="row"><span>Tiền gốc:</span><span>${fmt(soTienGoc)} đ</span></div>
<div class="row"><span>Số ngày vay:</span><span>${soNgay} ngày</span></div>
<div class="row"><span>Tiền lãi:</span><span>${fmt(tienLai)} đ</span></div>
<div class="row grand"><span>TỔNG CẦN TRẢ:</span><span>${fmt(tongTien)} đ</span></div>
<div class="paybox"><b>Thanh toán:</b> ${ptText(hinhThuc, soTienCK, tongTien)}</div>
<div class="sigs">
  <div><div class="name">Khách hàng</div><small>(Ký tên)</small></div>
  <div><div class="name">Nhân viên</div><small>(Ký tên)</small></div>
</div>
<div class="thanks">Cảm ơn quý khách! Tài sản đã được hoàn trả.</div>
</body></html>`);
}
