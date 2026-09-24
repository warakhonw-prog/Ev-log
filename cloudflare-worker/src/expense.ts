/**
 * รายงานค่าใช้จ่ายสำหรับเบิกจ่าย (แผนที่ 4): Excel (.xlsx) และหน้าพิมพ์/บันทึกเป็น PDF
 * แยกการเดินทาง "งาน (Business)" กับ "ส่วนตัว (Personal)"
 */

import { isDcCharge } from "./battery";
import { Vehicle, Purpose } from "./fleet";
import { buildXlsx, XS, XlsxCell } from "./xlsx";
import { formatThaiDate } from "./reports";

export interface ExpenseRow {
  iso: string;
  time: string;
  kind: "charge" | "trip";
  odoStart: number;
  odoEnd: number;
  km: number;
  min: number;
  cons: number;
  kwh: number;
  net: number;
  note: string;
  vehicle: string;
  driver: string;
  purpose: Purpose;
}

export interface ExpenseFilter {
  /** YYYY-MM หรือ "" = ทุกเดือน */
  month: string;
  vehicleId: string | "all";
  purpose: Purpose | "all";
  driver: string | "all";
  /** อัตราเบิกต่อกิโลเมตร (0 = ไม่คำนวณ) */
  ratePerKm: number;
  electricityRate: number;
}

interface PurposeTotals {
  count: number;
  km: number;
  kwh: number;
  cost: number;
  reimb: number;
}

export interface ExpenseReport {
  periodLabel: string;
  vehicleLabel: string;
  purposeLabel: string;
  driverLabel: string;
  ratePerKm: number;
  trips: (ExpenseRow & { cost: number; reimb: number; whKm: number | null })[];
  charges: (ExpenseRow & { type: "AC" | "DC"; station: string })[];
  totals: {
    business: PurposeTotals;
    personal: PurposeTotals;
    all: PurposeTotals;
    chargeCount: number;
    chargeKwh: number;
    chargeCost: number;
  };
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export const PURPOSE_LABEL: Record<Purpose, string> = { business: "งาน (Business)", personal: "ส่วนตัว (Personal)" };

function round(n: number, d = 2): number {
  const p = Math.pow(10, d);
  return Math.round(n * p) / p;
}

function emptyTotals(): PurposeTotals {
  return { count: 0, km: 0, kwh: 0, cost: 0, reimb: 0 };
}

function stationOf(note: string): string {
  const m = note.match(/@\s*([^(\[]+)/);
  return (m ? m[1] : note).replace(/\[Drive\]/g, "").trim() || "-";
}

export function buildExpenseReport(rows: ExpenseRow[], vehicles: Vehicle[], f: ExpenseFilter): ExpenseReport {
  const inScope = rows.filter(
    (r) =>
      (!f.month || r.iso.startsWith(f.month)) &&
      (f.vehicleId === "all" || r.vehicle === f.vehicleId) &&
      (f.driver === "all" || (r.driver || "") === f.driver) &&
      (f.purpose === "all" || r.purpose === f.purpose)
  );

  const totals = {
    business: emptyTotals(),
    personal: emptyTotals(),
    all: emptyTotals(),
    chargeCount: 0,
    chargeKwh: 0,
    chargeCost: 0,
  };

  const trips = inScope
    .filter((r) => r.kind === "trip" && r.km > 0)
    .map((r) => {
      // ค่าไฟของทริป = Cost_Net ในชีต ถ้าว่างคำนวณจากพลังงาน × อัตราค่าไฟ
      const cost = r.net > 0 ? r.net : r.kwh * f.electricityRate;
      const reimb = f.ratePerKm > 0 ? r.km * f.ratePerKm : 0;
      const whKm = r.cons > 0 ? (r.cons > 50 ? r.cons : r.cons * 10) : null;
      for (const t of [totals[r.purpose], totals.all]) {
        t.count++;
        t.km += r.km;
        t.kwh += r.kwh;
        t.cost += cost;
        t.reimb += reimb;
      }
      return { ...r, cost: round(cost), reimb: round(reimb), whKm };
    });

  const charges = inScope
    .filter((r) => r.kind === "charge" && r.kwh > 0)
    .map((r) => {
      totals.chargeCount++;
      totals.chargeKwh += r.kwh;
      totals.chargeCost += r.net;
      return { ...r, type: (isDcCharge(r) ? "DC" : "AC") as "AC" | "DC", station: stationOf(r.note) };
    });

  for (const t of [totals.business, totals.personal, totals.all]) {
    t.km = round(t.km, 1);
    t.kwh = round(t.kwh);
    t.cost = round(t.cost);
    t.reimb = round(t.reimb);
  }
  totals.chargeKwh = round(totals.chargeKwh);
  totals.chargeCost = round(totals.chargeCost);

  let periodLabel = "ทุกช่วงเวลา";
  if (f.month) {
    const [y, m] = f.month.split("-").map((x) => parseInt(x, 10));
    periodLabel = `${THAI_MONTHS[m - 1] || f.month} ${y + 543}`;
  }
  const v = vehicles.find((x) => x.id === f.vehicleId);
  const vehicleLabel = f.vehicleId === "all" ? "ทุกคัน" : v ? `${v.name}${v.plate ? ` (${v.plate})` : ""}` : f.vehicleId;

  return {
    periodLabel,
    vehicleLabel,
    purposeLabel: f.purpose === "all" ? "ทั้งหมด (งาน + ส่วนตัว)" : PURPOSE_LABEL[f.purpose],
    driverLabel: f.driver === "all" ? "ทุกคน" : f.driver || "ไม่ระบุ",
    ratePerKm: f.ratePerKm,
    trips,
    charges,
    totals,
  };
}

// ---------------- Excel ----------------

export function expenseReportToXlsx(rep: ExpenseReport): Uint8Array {
  const H = (v: string): XlsxCell => ({ v, s: XS.header });
  const T = (v: string): XlsxCell => ({ v, s: XS.totalText });
  const TN = (v: number): XlsxCell => ({ v, s: XS.totalNum2 });
  const withReimb = rep.ratePerKm > 0;

  const summaryRows: XlsxCell[][] = [
    [{ v: "รายงานค่าใช้จ่ายการเดินทางด้วยรถยนต์ไฟฟ้า", s: XS.title }],
    ["ช่วงเวลา", rep.periodLabel],
    ["รถยนต์", rep.vehicleLabel],
    ["ผู้ขับ", rep.driverLabel],
    ["ประเภท", rep.purposeLabel],
    withReimb ? ["อัตราเบิกต่อกิโลเมตร (฿)", rep.ratePerKm] : [],
    [],
    [H("ประเภทการเดินทาง"), H("จำนวนทริป"), H("ระยะทาง (km)"), H("พลังงาน (kWh)"), H("ค่าไฟ (฿)"), ...(withReimb ? [H("ยอดเบิกตามระยะทาง (฿)")] : [])],
  ];
  for (const [label, t] of [
    [PURPOSE_LABEL.business, rep.totals.business],
    [PURPOSE_LABEL.personal, rep.totals.personal],
  ] as const) {
    summaryRows.push([label, t.count, t.km, t.kwh, t.cost, ...(withReimb ? [t.reimb] : [])]);
  }
  const a = rep.totals.all;
  summaryRows.push([T("รวม"), TN(a.count), TN(a.km), TN(a.kwh), TN(a.cost), ...(withReimb ? [TN(a.reimb)] : [])]);
  summaryRows.push([]);
  summaryRows.push([H("การชาร์จไฟ"), H("จำนวนครั้ง"), H("พลังงาน (kWh)"), H("ค่าชาร์จ (฿)")]);
  summaryRows.push(["รวมทั้งหมด", rep.totals.chargeCount, rep.totals.chargeKwh, rep.totals.chargeCost]);

  const tripRows: XlsxCell[][] = [
    [H("วันที่"), H("เวลา"), H("ผู้ขับ"), H("ประเภท"), H("เลขไมล์เริ่ม"), H("เลขไมล์สิ้นสุด"), H("ระยะทาง (km)"), H("เวลา (นาที)"), H("Wh/km"), H("พลังงาน (kWh)"), H("ค่าไฟ (฿)"), ...(withReimb ? [H("ยอดเบิก (฿)")] : []), H("หมายเหตุ")],
    ...rep.trips.map((t) => [
      t.iso, t.time, t.driver || "-", t.purpose === "business" ? "งาน" : "ส่วนตัว",
      t.odoStart || null, t.odoEnd || null, t.km, t.min || null, t.whKm !== null ? Math.round(t.whKm) : null,
      t.kwh, t.cost, ...(withReimb ? [t.reimb] : []), t.note.replace(/\[Drive\]/g, "").trim(),
    ] as XlsxCell[]),
    [T("รวม"), null, null, null, null, null, TN(a.km), null, null, TN(a.kwh), TN(a.cost), ...(withReimb ? [TN(a.reimb)] : []), null],
  ];

  const chargeRows: XlsxCell[][] = [
    [H("วันที่"), H("เวลา"), H("ผู้ขับ"), H("ประเภท"), H("AC/DC"), H("สถานี"), H("พลังงาน (kWh)"), H("ค่าชาร์จ (฿)"), H("฿/kWh")],
    ...rep.charges.map((c) => [
      c.iso, c.time, c.driver || "-", c.purpose === "business" ? "งาน" : "ส่วนตัว", c.type, c.station,
      c.kwh, c.net, c.kwh > 0 && c.net > 0 ? round(c.net / c.kwh) : null,
    ] as XlsxCell[]),
    [T("รวม"), null, null, null, null, null, TN(rep.totals.chargeKwh), TN(rep.totals.chargeCost), null],
  ];

  return buildXlsx([
    { name: "สรุป", widths: [30, 16, 16, 16, 16, 22], rows: summaryRows },
    { name: "การเดินทาง", widths: [12, 8, 16, 10, 12, 12, 13, 11, 9, 13, 11, ...(withReimb ? [12] : []), 40], rows: tripRows },
    { name: "การชาร์จ", widths: [12, 8, 16, 10, 8, 32, 14, 13, 9], rows: chargeRows },
  ]);
}

// ---------------- หน้าพิมพ์ / บันทึกเป็น PDF ----------------

function h(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function n(v: number, d = 2): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function renderExpenseReportHtml(rep: ExpenseReport, xlsxUrl: string): string {
  const withReimb = rep.ratePerKm > 0;
  const a = rep.totals.all;
  const nowBkk = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

  const purposeRow = (label: string, t: PurposeTotals, total = false) =>
    `<tr${total ? ' class="total"' : ""}><td>${h(label)}</td><td class="num">${t.count}</td><td class="num">${n(t.km, 1)}</td><td class="num">${n(t.kwh)}</td><td class="num">${n(t.cost)}</td>${withReimb ? `<td class="num">${n(t.reimb)}</td>` : ""}</tr>`;

  const tripRows = rep.trips
    .map(
      (t) =>
        `<tr><td>${h(formatThaiDate(t.iso))}</td><td>${h(t.time)}</td><td>${h(t.driver || "-")}</td>` +
        `<td><span class="tag ${t.purpose}">${t.purpose === "business" ? "งาน" : "ส่วนตัว"}</span></td>` +
        `<td class="num">${t.odoStart ? n(t.odoStart, 0) : "-"} → ${t.odoEnd ? n(t.odoEnd, 0) : "-"}</td>` +
        `<td class="num">${n(t.km, 1)}</td><td class="num">${n(t.kwh)}</td><td class="num">${n(t.cost)}</td>` +
        `${withReimb ? `<td class="num">${n(t.reimb)}</td>` : ""}<td class="note">${h(t.note.replace(/\[Drive\]/g, "").trim())}</td></tr>`
    )
    .join("");

  const chargeRows = rep.charges
    .map(
      (c) =>
        `<tr><td>${h(formatThaiDate(c.iso))}</td><td>${h(c.time)}</td><td>${c.type}</td><td class="note">${h(c.station)}</td>` +
        `<td><span class="tag ${c.purpose}">${c.purpose === "business" ? "งาน" : "ส่วนตัว"}</span></td>` +
        `<td class="num">${n(c.kwh)}</td><td class="num">${n(c.net)}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>รายงานค่าใช้จ่าย EV - ${h(rep.periodLabel)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root { --ink:#0F172A; --muted:#64748B; --line:#CBD5E1; --soft:#F1F5F9; --accent:#0284C7; }
  * { box-sizing:border-box; }
  body { margin:0; background:#E2E8F0; color:var(--ink); font-family:"Sarabun",Tahoma,sans-serif; font-size:13px; }
  .toolbar { position:sticky; top:0; display:flex; gap:8px; justify-content:center; flex-wrap:wrap; padding:12px 16px; background:#0F172A; }
  .toolbar a, .toolbar button { font:inherit; font-weight:600; border:0; border-radius:8px; padding:8px 14px; cursor:pointer; text-decoration:none; }
  .btn-print { background:var(--accent); color:#fff; }
  .btn-alt { background:#fff; color:var(--ink); }
  .page { background:#fff; max-width:210mm; margin:16px auto; padding:14mm 12mm; box-shadow:0 4px 20px rgba(0,0,0,.12); }
  h1 { font-size:20px; margin:0 0 4px; }
  .sub { color:var(--muted); margin:0 0 14px; }
  .meta { display:grid; grid-template-columns:repeat(2,1fr); gap:4px 24px; padding:10px 12px; background:var(--soft); border-radius:6px; margin-bottom:16px; }
  .meta b { display:inline-block; min-width:92px; color:var(--muted); font-weight:600; }
  h2 { font-size:15px; margin:18px 0 8px; padding-bottom:4px; border-bottom:2px solid var(--accent); }
  table { width:100%; border-collapse:collapse; }
  th, td { border:1px solid var(--line); padding:5px 6px; text-align:left; vertical-align:top; }
  th { background:var(--soft); font-weight:600; white-space:nowrap; }
  .num { text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .note { font-size:12px; color:#334155; }
  tr.total td { font-weight:700; background:#F8FAFC; }
  .tag { display:inline-block; padding:0 6px; border-radius:4px; font-size:11.5px; font-weight:600; }
  .tag.business { background:#DBEAFE; color:#1D4ED8; }
  .tag.personal { background:#F1F5F9; color:#475569; }
  .empty { color:var(--muted); text-align:center; padding:14px; }
  .sign { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:40px; text-align:center; }
  .sign div { padding-top:36px; border-top:1px dotted var(--ink); }
  .foot { margin-top:18px; color:var(--muted); font-size:11px; }
  .table-scroll { overflow-x:auto; }
  @media (max-width:640px) { .meta { grid-template-columns:1fr; } .page { padding:16px; margin:0; } }
  @media print {
    @page { size:A4; margin:12mm; }
    body { background:#fff; }
    .toolbar { display:none; }
    .page { box-shadow:none; margin:0; padding:0; max-width:none; }
    .table-scroll { overflow:visible; }
    tr { break-inside:avoid; }
  }
</style>
</head>
<body>
<div class="toolbar">
  <button class="btn-print" onclick="window.print()">พิมพ์ / บันทึกเป็น PDF</button>
  <a class="btn-alt" href="${h(xlsxUrl)}">ดาวน์โหลด Excel (.xlsx)</a>
  <a class="btn-alt" href="/reports">กลับแดชบอร์ด</a>
</div>
<div class="page">
  <h1>รายงานค่าใช้จ่ายการเดินทางด้วยรถยนต์ไฟฟ้า</h1>
  <p class="sub">EV Trip &amp; Charging Expense Report</p>
  <div class="meta">
    <div><b>ช่วงเวลา</b> ${h(rep.periodLabel)}</div>
    <div><b>รถยนต์</b> ${h(rep.vehicleLabel)}</div>
    <div><b>ผู้ขับ</b> ${h(rep.driverLabel)}</div>
    <div><b>ประเภท</b> ${h(rep.purposeLabel)}</div>
    ${withReimb ? `<div><b>อัตราเบิก</b> ${n(rep.ratePerKm)} ฿/km</div>` : ""}
    <div><b>วันที่ออกรายงาน</b> ${h(formatThaiDate(nowBkk))}</div>
  </div>

  <h2>สรุปตามประเภทการเดินทาง</h2>
  <div class="table-scroll"><table>
    <thead><tr><th>ประเภท</th><th class="num">ทริป</th><th class="num">ระยะทาง (km)</th><th class="num">พลังงาน (kWh)</th><th class="num">ค่าไฟ (฿)</th>${withReimb ? '<th class="num">ยอดเบิก (฿)</th>' : ""}</tr></thead>
    <tbody>
      ${purposeRow(PURPOSE_LABEL.business, rep.totals.business)}
      ${purposeRow(PURPOSE_LABEL.personal, rep.totals.personal)}
      ${purposeRow("รวม", a, true)}
    </tbody>
  </table></div>

  <h2>รายการเดินทาง (${rep.trips.length} ทริป)</h2>
  <div class="table-scroll"><table>
    <thead><tr><th>วันที่</th><th>เวลา</th><th>ผู้ขับ</th><th>ประเภท</th><th class="num">เลขไมล์</th><th class="num">km</th><th class="num">kWh</th><th class="num">ค่าไฟ (฿)</th>${withReimb ? '<th class="num">เบิก (฿)</th>' : ""}<th>หมายเหตุ</th></tr></thead>
    <tbody>${tripRows || `<tr><td colspan="${withReimb ? 10 : 9}" class="empty">ไม่มีรายการเดินทางในช่วงนี้</td></tr>`}
      <tr class="total"><td colspan="5">รวม</td><td class="num">${n(a.km, 1)}</td><td class="num">${n(a.kwh)}</td><td class="num">${n(a.cost)}</td>${withReimb ? `<td class="num">${n(a.reimb)}</td>` : ""}<td></td></tr>
    </tbody>
  </table></div>

  <h2>รายการชาร์จไฟ (${rep.totals.chargeCount} ครั้ง)</h2>
  <div class="table-scroll"><table>
    <thead><tr><th>วันที่</th><th>เวลา</th><th>AC/DC</th><th>สถานี</th><th>ประเภท</th><th class="num">kWh</th><th class="num">ค่าชาร์จ (฿)</th></tr></thead>
    <tbody>${chargeRows || '<tr><td colspan="7" class="empty">ไม่มีรายการชาร์จในช่วงนี้</td></tr>'}
      <tr class="total"><td colspan="5">รวม</td><td class="num">${n(rep.totals.chargeKwh)}</td><td class="num">${n(rep.totals.chargeCost)}</td></tr>
    </tbody>
  </table></div>

  <div class="sign">
    <div>ผู้เบิก<br>(............................................)</div>
    <div>ผู้อนุมัติ<br>(............................................)</div>
  </div>
  <p class="foot">ค่าไฟของทริปคำนวณจากพลังงานที่ใช้ (ระยะทาง × อัตรากินไฟจากหน้าจอรถ) × อัตราค่าไฟที่บันทึก · สร้างจากระบบ EV Log Hub</p>
</div>
</body>
</html>`;
}
