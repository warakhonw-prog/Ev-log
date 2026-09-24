/**
 * TOU What-If (แผนที่ 3 บางส่วน): ถ้าเปลี่ยนเป็นมิเตอร์ TOU จะคุ้มไหม
 *
 * แยก kWh ของการชาร์จบ้าน (AC) แต่ละครั้งเป็นช่วง On-Peak / Off-Peak ตามช่วงเวลาที่ชาร์จจริง
 * ส่วนการคิดเงินทำฝั่ง client เพราะอัตราค่าไฟและการใช้ไฟของบ้านผู้ใช้ปรับเองได้
 *
 * ช่วงเวลา TOU (กฟภ./กฟน.): On-Peak = จันทร์-ศุกร์ 09:00-22:00
 * Off-Peak = 22:00-09:00 ของวันธรรมดา และทั้งวันเสาร์-อาทิตย์
 * (ไม่ได้นับวันหยุดราชการ ผลจึงประเมินส่วน On-Peak สูงกว่าจริงเล็กน้อย = ฝั่งระมัดระวัง)
 */

import { DashboardRow, isDcCharge } from "./battery";

export interface TouSession {
  iso: string;
  time: string;
  start: string;
  end: string;
  kwh: number;
  onPeakKwh: number;
  offPeakKwh: number;
  timeBasis: "range" | "end" | "start";
  durationSource: "recorded" | "estimated";
}

export interface TouAnalysis {
  chargerKw: number;
  chargerKwSource: "observed" | "default";
  sessions: TouSession[];
  totals: { kwh: number; onPeakKwh: number; offPeakKwh: number };
  spanDays: number;
  months: number;
}

const DEFAULT_CHARGER_KW = 2.2;
const MAX_SESSION_MIN = 24 * 60;

function round(n: number, d: number): number {
  const p = Math.pow(10, d);
  return Math.round(n * p) / p;
}

/** วันเวลาท้องถิ่น (ไม่มี timezone) แทนด้วย Date ใน UTC เพื่อให้คำนวณวัน/ชั่วโมงตรงตัว */
function localDate(iso: string, hhmm: string): Date | null {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})/);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !m) return null;
  return new Date(`${iso}T${m[1].padStart(2, "0")}:${m[2]}:00Z`);
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export function isOnPeak(d: Date): boolean {
  const day = d.getUTCDay();
  const hour = d.getUTCHours();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 22;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function analyzeTou(rows: DashboardRow[]): TouAnalysis {
  const home = rows.filter((r) => r.kind === "charge" && !isDcCharge(r) && r.kwh > 0);

  // กำลังชาร์จบ้านจากครั้งที่บันทึกระยะเวลาไว้ ใช้ประมาณเวลาของครั้งที่ไม่มีระยะเวลา
  const observedKw = median(
    home
      .filter((r) => r.min >= 30)
      .map((r) => r.kwh / (r.min / 60))
      .filter((kw) => kw > 0.5 && kw <= 22)
  );
  const chargerKw = observedKw !== null ? round(observedKw, 2) : DEFAULT_CHARGER_KW;

  const sessions: TouSession[] = [];
  for (const r of home) {
    const stamp = localDate(r.iso, r.time);
    if (!stamp) continue;

    let start: Date;
    let end: Date;
    let timeBasis: TouSession["timeBasis"];
    let durationSource: TouSession["durationSource"] = r.min > 0 ? "recorded" : "estimated";
    const durationMin = Math.min(MAX_SESSION_MIN, r.min > 0 ? r.min : (r.kwh / chargerKw) * 60);

    // โน้ตระบุช่วงเวลาไว้ เช่น "Overnight Charging (22:00 - 02:42 Aug 31)"
    const range = r.note.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    const rangeStart = range ? localDate(r.iso, range[1]) : null;
    const rangeEnd = range ? localDate(r.iso, range[2]) : null;
    if (rangeStart && rangeEnd) {
      start = rangeStart;
      end = rangeEnd;
      if (end <= start) end = new Date(end.getTime() + 24 * 3600 * 1000);
      timeBasis = "range";
      durationSource = "recorded";
    } else if (stamp.getUTCHours() >= 4 && stamp.getUTCHours() < 12) {
      // บันทึกตอนเช้า = ชาร์จข้ามคืนแล้วเสร็จ (เวลาที่บันทึกคือเวลาจบ)
      end = stamp;
      start = new Date(end.getTime() - durationMin * 60000);
      timeBasis = "end";
    } else {
      start = stamp;
      end = new Date(start.getTime() + durationMin * 60000);
      timeBasis = "start";
    }

    // กระจาย kWh เท่าๆ กันทุกนาทีในช่วงชาร์จ
    const totalMin = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
    let onMin = 0;
    for (let i = 0; i < totalMin; i++) {
      if (isOnPeak(new Date(start.getTime() + i * 60000))) onMin++;
    }
    const onPeakKwh = (r.kwh * onMin) / totalMin;
    sessions.push({
      iso: r.iso,
      time: r.time,
      start: fmt(start),
      end: fmt(end),
      kwh: r.kwh,
      onPeakKwh: round(onPeakKwh, 2),
      offPeakKwh: round(r.kwh - onPeakKwh, 2),
      timeBasis,
      durationSource,
    });
  }

  const kwh = sessions.reduce((a, s) => a + s.kwh, 0);
  const onPeakKwh = sessions.reduce((a, s) => a + s.onPeakKwh, 0);

  // ช่วงเวลาข้อมูล: ตั้งแต่ชาร์จบ้านครั้งแรกถึงวันล่าสุดที่มีบันทึก ใช้แปลงเป็นค่าต่อเดือน
  let spanDays = 0;
  if (sessions.length > 0) {
    const lastIso = rows.reduce((a, r) => (r.iso > a ? r.iso : a), sessions[sessions.length - 1].iso);
    const first = Date.parse(sessions[0].iso + "T00:00:00Z");
    const last = Date.parse(lastIso + "T00:00:00Z");
    spanDays = Math.round((last - first) / 86400000) + 1;
  }

  return {
    chargerKw,
    chargerKwSource: observedKw !== null ? "observed" : "default",
    sessions,
    totals: { kwh: round(kwh, 2), onPeakKwh: round(onPeakKwh, 2), offPeakKwh: round(kwh - onPeakKwh, 2) },
    spanDays,
    // ข้อมูลน้อยกว่า 1 สัปดาห์ถือเป็น 7 วัน กันค่าต่อเดือนพุ่งผิดปกติ
    months: round(Math.max(7, spanDays) / 30.44, 2),
  };
}
