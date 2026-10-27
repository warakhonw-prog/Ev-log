/**
 * การ์ดสรุปค่าชาร์จ / ค่าเดินทาง สำหรับคำถามใน LINE เช่น "ค่าชาร์จ ตุลาคม AC เท่าไร", "เดือนนี้ค่าเดินทางเท่าไหร่"
 * ตัวเลขคำนวณจากชีตโดยตรง (ไม่ผ่าน AI) แล้วแสดงเป็น Flex card หน้าตาเดียวกับการ์ดบันทึกการชาร์จ/เดินทาง
 * คำถามที่ซับซ้อนกว่านี้ (ทริปไหนกินไฟที่สุด, ค่า Ft ฯลฯ) ยังส่งให้ผู้ช่วย AI ตอบตามเดิม
 */

import { DashboardRow, isDcCharge } from "./battery";
import { formatThaiDate, formatThaiMonthFull } from "./reports";

export type StatTopic = "charge" | "trip";
export type ChargeType = "all" | "ac" | "dc";

export interface StatQuery {
  topics: StatTopic[];
  chargeType: ChargeType;
  /** YYYY-MM-DD (รวมวันนั้น) ว่าง = ไม่จำกัด */
  from: string;
  to: string;
  /** เช่น "ตุลาคม 2026", "สัปดาห์นี้" */
  label: string;
  /** เช่น "1 - 27 ต.ค. 2026" */
  rangeText: string;
}

type Row = DashboardRow & { purpose?: string; vehicle?: string; driver?: string };

const DASHBOARD_URL = "https://ev-log-bot.eb-book.workers.dev/";
// เทียบรถน้ำมัน: ค่าเดียวกับรายงานประจำสัปดาห์/เดือน (reports.ts)
const GAS_KM_PER_L = 14;
const GAS_THB_PER_L = 38;

const COLOR = {
  ac: "#0d9488",
  dc: "#0284c7",
  allCharge: "#4f46e5",
  trip: "#16a34a",
  muted: "#64748b",
  text: "#1e293b",
  strong: "#0f172a",
  faint: "#94a3b8",
  track: "#e2e8f0",
};

// ---------- แยกคำถาม ----------

const MONTH_PATTERNS: RegExp[] = [
  /มกรา|ม\.ค|(?:^|[^฀-๿])มค(?![฀-๿])|\bjan/i,
  /กุมภา|ก\.พ|(?:^|[^฀-๿])กพ(?![฀-๿])|\bfeb/i,
  /มีนา|มี\.ค|(?:^|[^฀-๿])มีค(?![฀-๿])|\bmar/i,
  /เมษา|เม\.ย|(?:^|[^฀-๿])เมย(?![฀-๿])|\bapr/i,
  /พฤษภา|พ\.ค|(?:^|[^฀-๿])พค(?![฀-๿])|\bmay\b/i,
  /มิถุนา|มิ\.ย|(?:^|[^฀-๿])มิย(?![฀-๿])|\bjun/i,
  /กรกฎา|กรกฏา|ก\.ค|(?:^|[^฀-๿])กค(?![฀-๿])|\bjul/i,
  /สิงหา|ส\.ค|(?:^|[^฀-๿])สค(?![฀-๿])|\baug/i,
  /กันยา|ก\.ย|(?:^|[^฀-๿])กย(?![฀-๿])|\bsep/i,
  /ตุลา|ต\.ค|(?:^|[^฀-๿])ตค(?![฀-๿])|\boct/i,
  /พฤศจิ|พ\.ย|(?:^|[^฀-๿])พย(?![฀-๿])|\bnov/i,
  /ธันวา|ธ\.ค|(?:^|[^฀-๿])ธค(?![฀-๿])|\bdec/i,
];

const CHARGE_WORDS = /ชาร์จ|ชาร์ท|ชาจ|ค่าไฟ|kwh|charg/i;
const TRIP_WORDS = /เดินทาง|ทริป|trip|วิ่ง|ขับ|ระยะทาง/i;
const AMOUNT_WORDS = /เท่า(?:ไร|ไหร่|ไร่|ใด)|กี่|สรุป|ยอด|รวม|ทั้งหมด|ใช้ไป|จ่าย|เสีย|how much|total|summary/i;
// คำถามที่ต้องให้ AI คิด/ค้นเว็บ ไม่ใช่แค่ยอดรวม
const COMPLEX_WORDS = /ไหน|ที่สุด|สูงสุด|ต่ำสุด|มากสุด|น้อยสุด|ทำไม|เพราะ|ยังไง|อย่างไร|เทียบ|เปรียบ|แนะนำ|ควร|ft|หน่วยละ|งวด|คาดการณ์|ทำนาย|ต่อวัน|ต่อเดือน|ต่อครั้ง|ต่อทริป/i;

const pad = (n: number) => n.toString().padStart(2, "0");
const isoOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

function monthRange(year: number, monthIdx: number, todayIso: string): Pick<StatQuery, "from" | "to" | "label"> {
  const from = `${year}-${pad(monthIdx + 1)}-01`;
  const last = new Date(Date.UTC(year, monthIdx + 1, 0));
  const endIso = isoOf(last);
  return { from, to: endIso < todayIso ? endIso : todayIso, label: formatThaiMonthFull(monthIdx, year) };
}

function rangeText(from: string, to: string): string {
  if (!from) return to ? `ถึง ${formatThaiDate(to)}` : "ทั้งหมด";
  if (from === to) return formatThaiDate(from);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${formatThaiDate(from, !sameYear)} - ${formatThaiDate(to)}`;
}

/** แยกคำถามยอดค่าชาร์จ/ค่าเดินทาง คืน null ถ้าไม่ใช่คำถามแบบนี้ (ให้ AI ตอบแทน) */
export function parseStatQuery(question: string, now: Date = new Date()): StatQuery | null {
  const q = question.trim();
  if (!q || q.length > 120 || COMPLEX_WORDS.test(q)) return null;

  const topics: StatTopic[] = [];
  const charge = CHARGE_WORDS.test(q);
  const trip = TRIP_WORDS.test(q);
  if (charge) topics.push("charge");
  if (trip) topics.push("trip");
  if (!topics.length || !AMOUNT_WORDS.test(q)) return null;

  const isAc = /\bac\b|บ้าน|ชาร์จช้า/i.test(q);
  const isDc = /\bdc\b|ด่วน|นอกบ้าน|สถานี|ตู้/i.test(q);
  const chargeType: ChargeType = isAc && !isDc ? "ac" : isDc && !isAc ? "dc" : "all";

  // เวลาไทย (UTC+7) ใช้ getUTC* กับวันที่ที่เลื่อนแล้ว
  const today = new Date(now.getTime() + 7 * 3600 * 1000);
  const todayIso = isoOf(today);
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();

  let period: Pick<StatQuery, "from" | "to" | "label"> | null = null;

  const monthIdx = MONTH_PATTERNS.findIndex((re) => re.test(q));
  if (monthIdx >= 0) {
    const yearMatch = q.match(/(25\d\d|20\d\d)/);
    let year = yearMatch ? parseInt(yearMatch[1], 10) : y;
    if (year >= 2500) year -= 543; // พ.ศ. → ค.ศ.
    // ไม่ระบุปีและเดือนยังมาไม่ถึง = ปีที่แล้ว (เช่นถาม "ธันวา" ในเดือนตุลาคม)
    if (!yearMatch && monthIdx > m) year -= 1;
    period = monthRange(year, monthIdx, todayIso);
  } else if (/เดือน(?:ที่แล้ว|ก่อน|ที่ผ่านมา)/.test(q)) {
    period = monthRange(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1, todayIso);
  } else if (/(?:สัปดาห์|อาทิตย์|วีค)(?:ที่แล้ว|ก่อน|ที่ผ่านมา)/.test(q)) {
    const monday = addDays(today, -((today.getUTCDay() + 6) % 7));
    period = { from: isoOf(addDays(monday, -7)), to: isoOf(addDays(monday, -1)), label: "สัปดาห์ที่แล้ว" };
  } else if (/(?:สัปดาห์|อาทิตย์|วีค)นี้/.test(q)) {
    const monday = addDays(today, -((today.getUTCDay() + 6) % 7));
    period = { from: isoOf(monday), to: todayIso, label: "สัปดาห์นี้" };
  } else if (/7\s*วัน/.test(q)) {
    period = { from: isoOf(addDays(today, -6)), to: todayIso, label: "7 วันล่าสุด" };
  } else if (/เมื่อวาน/.test(q)) {
    const d = isoOf(addDays(today, -1));
    period = { from: d, to: d, label: "เมื่อวาน" };
  } else if (/วันนี้/.test(q)) {
    period = { from: todayIso, to: todayIso, label: "วันนี้" };
  } else if (/ปี(?:ที่แล้ว|ก่อน)/.test(q)) {
    period = { from: `${y - 1}-01-01`, to: `${y - 1}-12-31`, label: `ปี ${y - 1}` };
  } else if (/ปีนี้/.test(q)) {
    period = { from: `${y}-01-01`, to: todayIso, label: `ปี ${y}` };
  } else if (/ทั้งหมด|ตั้งแต่เริ่ม|ตั้งแต่แรก/.test(q)) {
    period = { from: "", to: todayIso, label: "ทั้งหมด" };
  } else {
    period = { ...monthRange(y, m, todayIso), label: "เดือนนี้" };
  }

  return { topics, chargeType, ...period, rangeText: rangeText(period.from, period.to) };
}

// ---------- ตัวช่วยจัดรูปแบบ ----------

function num(n: number, digits = 2): string {
  const [i, d] = n.toFixed(digits).split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (d ? "." + d : "");
}
const baht = (n: number) => `฿${num(n)}`;

function duration(min: number): string {
  const h = Math.floor(min / 60);
  const mm = Math.round(min % 60);
  return h ? `${h} ชม. ${mm} นาที` : `${mm} นาที`;
}

function inRange(r: Row, q: StatQuery): boolean {
  if (!r.iso) return false;
  return (!q.from || r.iso >= q.from) && (!q.to || r.iso <= q.to);
}

function placeOf(r: Row): string {
  let s = (r.note || "").replace(/\[Drive\]/g, "").replace(/\([\d.]+\s*THB\/kWh\)/i, "").trim();
  const at = s.indexOf("@");
  if (at >= 0) s = s.slice(at + 1).trim();
  // ไม่มีชื่อ หรือเป็นแค่เลขมิเตอร์/รหัสตู้ที่เป็นตัวเลขล้วน
  if (!s || /^\d+$/.test(s)) s = isDcCharge(r) ? "ตู้ชาร์จ DC" : "ชาร์จบ้าน";
  return s.length > 24 ? s.slice(0, 23) + "…" : s;
}

function infoRow(name: string, val: string): any {
  return {
    type: "box",
    layout: "baseline",
    spacing: "sm",
    contents: [
      { type: "text", text: name, color: COLOR.muted, size: "xs", flex: 5 },
      { type: "text", text: val, color: COLOR.text, size: "xs", flex: 7, weight: "bold", align: "end", wrap: true },
    ],
  };
}

function hero(leftLabel: string, leftVal: string, rightLabel: string, rightVal: string, color: string): any {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: leftLabel, size: "xxs", color: COLOR.muted },
          { type: "text", text: leftVal, size: "xl", weight: "bold", color, wrap: true },
        ],
      },
      {
        type: "box",
        layout: "vertical",
        alignItems: "flex-end",
        contents: [
          { type: "text", text: rightLabel, size: "xxs", color: COLOR.muted },
          { type: "text", text: rightVal, size: "xl", weight: "bold", color: COLOR.strong },
        ],
      },
    ],
  };
}

/** แถบสัดส่วน 2 สี (เช่น AC vs DC) */
function splitBar(a: number, b: number, colorA: string, colorB: string): any {
  const total = a + b;
  const pa = total > 0 ? Math.round((a / total) * 100) : 0;
  const seg = (flex: number, color: string) => ({ type: "box", layout: "vertical", contents: [], backgroundColor: color, flex, height: "6px" });
  const parts = [] as any[];
  if (pa > 0) parts.push(seg(pa, colorA));
  if (100 - pa > 0) parts.push(seg(100 - pa, colorB));
  if (!parts.length) parts.push(seg(1, COLOR.track));
  return { type: "box", layout: "horizontal", margin: "md", cornerRadius: "3px", contents: parts };
}

function listItem(left: string, sub: string, right: string, rightSub: string, rightColor: string = COLOR.strong): any {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    contents: [
      {
        type: "box",
        layout: "vertical",
        flex: 7,
        contents: [
          { type: "text", text: left, size: "xs", color: COLOR.text, weight: "bold" },
          { type: "text", text: sub, size: "xxs", color: COLOR.muted, wrap: true },
        ],
      },
      {
        type: "box",
        layout: "vertical",
        flex: 4,
        alignItems: "flex-end",
        contents: [
          { type: "text", text: right, size: "xs", color: rightColor, weight: "bold" },
          { type: "text", text: rightSub, size: "xxs", color: COLOR.muted },
        ],
      },
    ],
  };
}

function bubble(title: string, subtitle: string, color: string, body: any[], button: { label: string; path: string }): any {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: color,
      paddingAll: "lg",
      contents: [
        { type: "text", text: title, weight: "bold", size: "md", color: "#ffffff", wrap: true },
        { type: "text", text: subtitle, size: "xs", color: "#f0fdfa", margin: "xs", wrap: true },
      ],
    },
    body: { type: "box", layout: "vertical", paddingAll: "lg", contents: body },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "md",
      contents: [
        { type: "button", style: "primary", height: "sm", color, action: { type: "uri", label: button.label, uri: DASHBOARD_URL + button.path } },
        { type: "text", text: "EV Log Bot • คำนวณจาก Google Sheets", size: "xxs", color: COLOR.faint, align: "center", margin: "xs" },
      ],
    },
  };
}

const MAX_LIST = 6;

function listSection(title: string, items: any[], total: number): any[] {
  const out: any[] = [
    { type: "separator", margin: "lg" },
    { type: "text", text: title, size: "xs", color: COLOR.muted, weight: "bold", margin: "md" },
    { type: "box", layout: "vertical", spacing: "md", margin: "sm", contents: items },
  ];
  if (total > items.length) {
    out.push({ type: "text", text: `และอีก ${total - items.length} รายการ ดูทั้งหมดในแดชบอร์ด`, size: "xxs", color: COLOR.faint, margin: "sm" });
  }
  return out;
}

// ---------- การ์ดค่าชาร์จ ----------

export function buildChargeStatBubble(rows: Row[], q: StatQuery): { bubble: any; summary: string } {
  const all = rows.filter((r) => r.kind === "charge" && inRange(r, q));
  const ac = all.filter((r) => !isDcCharge(r));
  const dc = all.filter((r) => isDcCharge(r));
  const shown = q.chargeType === "ac" ? ac : q.chargeType === "dc" ? dc : all;
  const sum = (a: Row[]) => a.reduce((s, r) => ({ kwh: s.kwh + (r.kwh || 0), thb: s.thb + (r.net || 0) }), { kwh: 0, thb: 0 });
  const t = sum(shown);
  const tAc = sum(ac);
  const tDc = sum(dc);

  const meta =
    q.chargeType === "ac"
      ? { title: "🏠 ค่าชาร์จบ้าน (AC)", color: COLOR.ac }
      : q.chargeType === "dc"
        ? { title: "⚡ ค่าชาร์จด่วน (DC)", color: COLOR.dc }
        : { title: "🔌 สรุปค่าชาร์จไฟฟ้า", color: COLOR.allCharge };
  const subtitle = `${q.label} · ${q.rangeText}`;
  const summary = `${meta.title} ${q.label}: ${baht(t.thb)} (${shown.length} ครั้ง, ${num(t.kwh)} kWh)`;

  if (!shown.length) {
    return {
      summary,
      bubble: bubble(meta.title, subtitle, meta.color, [
        { type: "text", text: "ไม่มีรายการชาร์จในช่วงนี้", size: "sm", color: COLOR.muted, wrap: true },
      ], { label: "⚡ ดูประวัติการชาร์จ", path: "charging-history" }),
    };
  }

  const body: any[] = [
    hero("ยอดค่าไฟ", baht(t.thb), "พลังงาน", `${num(t.kwh, 1)} kWh`, meta.color),
    { type: "separator", margin: "md" },
    {
      type: "box",
      layout: "vertical",
      margin: "md",
      spacing: "sm",
      contents: [
        infoRow("🔁 จำนวนครั้ง", `${shown.length} ครั้ง`),
        infoRow("💱 เฉลี่ยต่อหน่วย", t.kwh > 0 ? `${baht(t.thb / t.kwh)}/kWh` : "-"),
        infoRow("🧾 เฉลี่ยต่อครั้ง", baht(t.thb / shown.length)),
      ],
    },
  ];

  if (q.chargeType === "all") {
    const share = (x: number) => (t.thb > 0 ? `${Math.round((x / t.thb) * 100)}%` : "-");
    body.push({ type: "separator", margin: "lg" });
    body.push({ type: "text", text: "สัดส่วนค่าชาร์จ AC / DC", size: "xs", color: COLOR.muted, weight: "bold", margin: "md" });
    body.push(splitBar(tAc.thb, tDc.thb, COLOR.ac, COLOR.dc));
    body.push({
      type: "box",
      layout: "vertical",
      margin: "md",
      spacing: "md",
      contents: [
        listItem("🏠 AC ชาร์จบ้าน", `${ac.length} ครั้ง · ${num(tAc.kwh, 1)} kWh`, baht(tAc.thb), share(tAc.thb), COLOR.ac),
        listItem("⚡ DC ชาร์จด่วน", `${dc.length} ครั้ง · ${num(tDc.kwh, 1)} kWh`, baht(tDc.thb), share(tDc.thb), COLOR.dc),
      ],
    });
  } else {
    const other = q.chargeType === "ac" ? { name: "⚡ DC ช่วงเดียวกัน", t: tDc, n: dc.length } : { name: "🏠 AC ช่วงเดียวกัน", t: tAc, n: ac.length };
    body.push({
      type: "box",
      layout: "vertical",
      margin: "sm",
      contents: [infoRow(other.name, `${other.n} ครั้ง · ${baht(other.t.thb)}`), infoRow("🔌 รวมทุกแบบ", baht(tAc.thb + tDc.thb))],
    });
  }

  const latest = shown.slice().sort((a, b) => (b.iso + b.time).localeCompare(a.iso + a.time));
  const items = latest.slice(0, MAX_LIST).map((r) =>
    listItem(`${isDcCharge(r) ? "⚡" : "🏠"} ${formatThaiDate(r.iso, false)}${r.time ? " " + r.time : ""}`, placeOf(r), baht(r.net || 0), `${num(r.kwh || 0, 1)} kWh`)
  );
  body.push(...listSection("รายการล่าสุด", items, latest.length));

  return { summary, bubble: bubble(meta.title, subtitle, meta.color, body, { label: "⚡ ดูประวัติการชาร์จ", path: "charging-history" }) };
}

// ---------- การ์ดค่าเดินทาง ----------

export function buildTripStatBubble(rows: Row[], q: StatQuery): { bubble: any; summary: string } {
  const trips = rows.filter((r) => r.kind === "trip" && inRange(r, q));
  const title = "🚗 สรุปค่าเดินทาง";
  const subtitle = `${q.label} · ${q.rangeText}`;

  let km = 0, min = 0, kwh = 0, thb = 0, whSum = 0, whKm = 0, bizKm = 0, bizThb = 0;
  for (const r of trips) {
    km += r.km || 0;
    min += r.min || 0;
    kwh += r.kwh || 0;
    thb += r.net || 0;
    const cons = r.cons || 0;
    const wh = cons > 50 ? cons : cons * 10;
    if (wh > 0 && r.km > 0) {
      whSum += wh * r.km;
      whKm += r.km;
    }
    if (r.purpose === "business") {
      bizKm += r.km || 0;
      bizThb += r.net || 0;
    }
  }
  const summary = `${title} ${q.label}: ${baht(thb)} (${trips.length} ทริป, ${num(km, 1)} km)`;

  if (!trips.length) {
    return {
      summary,
      bubble: bubble(title, subtitle, COLOR.trip, [
        { type: "text", text: "ไม่มีรายการเดินทางในช่วงนี้", size: "sm", color: COLOR.muted, wrap: true },
      ], { label: "🛣️ ดูประวัติการเดินทาง", path: "trips" }),
    };
  }

  const gasThb = (km / GAS_KM_PER_L) * GAS_THB_PER_L;
  const info = [
    infoRow("🛣️ จำนวนทริป", `${trips.length} ทริป`),
    infoRow("⏱️ เวลาขับรวม", min > 0 ? duration(min) : "-"),
    infoRow("⚡ อัตรากินไฟเฉลี่ย", whKm > 0 ? `${Math.round(whSum / whKm)} Wh/km` : "-"),
    infoRow("🔌 พลังงานที่ใช้", `${num(kwh, 1)} kWh`),
    infoRow("💰 ต้นทุนต่อ km", km > 0 ? `${baht(thb / km)}/km` : "-"),
    infoRow("⛽ ถ้าเป็นรถน้ำมัน", `≈ ${baht(gasThb)}`),
    infoRow("💚 ประหยัดไป", `≈ ${baht(Math.max(0, gasThb - thb))}`),
  ];
  if (bizKm > 0) info.push(infoRow("💼 เดินทางงาน", `${num(bizKm, 1)} km · ${baht(bizThb)}`));

  const body: any[] = [
    hero("ค่าไฟที่ใช้เดินทาง", baht(thb), "ระยะทาง", `${num(km, 1)} km`, COLOR.trip),
    { type: "separator", margin: "md" },
    { type: "box", layout: "vertical", margin: "md", spacing: "sm", contents: info },
  ];

  const latest = trips.slice().sort((a, b) => (b.iso + b.time).localeCompare(a.iso + a.time));
  const items = latest.slice(0, MAX_LIST).map((r) => {
    const cons = r.cons || 0;
    const wh = cons > 50 ? cons : cons * 10;
    const sub = [r.min ? duration(r.min) : "", wh > 0 ? `${Math.round(wh)} Wh/km` : "", r.purpose === "business" ? "💼 งาน" : ""].filter(Boolean).join(" · ");
    return listItem(`🚗 ${formatThaiDate(r.iso, false)}${r.time ? " " + r.time : ""}`, sub || "-", `${num(r.km || 0, 1)} km`, baht(r.net || 0));
  });
  body.push(...listSection("ทริปล่าสุด", items, latest.length));

  return { summary, bubble: bubble(title, subtitle, COLOR.trip, body, { label: "🛣️ ดูประวัติการเดินทาง", path: "trips" }) };
}

/** สร้างข้อความ Flex (การ์ดเดียว หรือ carousel ถ้าถามทั้งค่าชาร์จและค่าเดินทาง) */
export function buildStatFlexMessage(rows: Row[], q: StatQuery): any {
  const parts = q.topics.map((t) => (t === "charge" ? buildChargeStatBubble(rows, q) : buildTripStatBubble(rows, q)));
  const altText = parts.map((p) => p.summary).join(" | ").slice(0, 390);
  return {
    type: "flex",
    altText,
    contents: parts.length === 1 ? parts[0].bubble : { type: "carousel", contents: parts.map((p) => p.bubble) },
  };
}
