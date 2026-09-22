import { PeriodSummary } from "./types";

/**
 * แปลงวันที่ YYYY-MM-DD เป็นรูปแบบภาษาไทย (เช่น 22 ก.ย. 2026)
 */
export function formatThaiDate(dateStr: string, includeYear: boolean = true): string {
  if (!dateStr) return "";
  const [yStr, mStr, dStr] = dateStr.split("-");
  const d = parseInt(dStr, 10);
  const m = parseInt(mStr, 10);
  const y = parseInt(yStr, 10);

  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  const thaiMonth = months[m - 1] || "";
  const thaiYear = y; // ใช้ปี ค.ศ. เช่น 2026 ให้เข้าใจง่ายและตรงกับแดชบอร์ด

  if (!includeYear) {
    return `${d} ${thaiMonth}`;
  }
  return `${d} ${thaiMonth} ${thaiYear}`;
}

/**
 * ชื่อเดือนเต็มภาษาไทย
 */
export function formatThaiMonthFull(monthIndex: number, yearCe: number): string {
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const thaiMonth = months[monthIndex] || "";
  const thaiYear = yearCe;
  return `${thaiMonth} ${thaiYear}`;
}

/**
 * ฟังก์ชันช่วยคำนวณและสรุปสถิติรอบสัปดาห์ หรือรอบเดือน จากข้อมูล Google Sheets
 */
export function generatePeriodSummary(
  rows: any[],
  periodType: "weekly" | "monthly",
  refDateInput?: Date
): PeriodSummary {
  // ใช้วันที่อ้างอิงตามเวลาไทย (UTC+7)
  const now = refDateInput || new Date();
  const thaiTimeMs = now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60 * 1000;
  const thaiDate = new Date(thaiTimeMs);

  let startDateStr = "";
  let endDateStr = "";
  let title = "";
  let dateRangeStr = "";

  if (periodType === "weekly") {
    // รอบสัปดาห์: ย้อนหลัง 7 วันจนถึงวันนี้
    const endD = new Date(thaiDate);
    const startD = new Date(thaiDate);
    startD.setDate(endD.getDate() - 6);

    const pad = (n: number) => n.toString().padStart(2, "0");
    startDateStr = `${startD.getFullYear()}-${pad(startD.getMonth() + 1)}-${pad(startD.getDate())}`;
    endDateStr = `${endD.getFullYear()}-${pad(endD.getMonth() + 1)}-${pad(endD.getDate())}`;

    title = "📊 สรุปการใช้รถประจำสัปดาห์ (Weekly EV Digest)";
    dateRangeStr = `${formatThaiDate(startDateStr, false)} - ${formatThaiDate(endDateStr, true)}`;
  } else {
    // รอบเดือน:
    // หากเป็นวันที่ 1 ของเดือน -> สรุปเดือนที่เพิ่งผ่านมา
    // หากเป็นวันอื่น (เช่น การสั่งทดสอบแบบ manual) -> สรุปเดือนปัจจุบันตั้งแต่วันที่ 1 ถึงวันนี้
    const pad = (n: number) => n.toString().padStart(2, "0");

    if (thaiDate.getDate() === 1) {
      // เดือนที่แล้ว
      const prevMonthLastDay = new Date(thaiDate.getFullYear(), thaiDate.getMonth(), 0);
      const prevMonthYear = prevMonthLastDay.getFullYear();
      const prevMonthIdx = prevMonthLastDay.getMonth();

      startDateStr = `${prevMonthYear}-${pad(prevMonthIdx + 1)}-01`;
      endDateStr = `${prevMonthYear}-${pad(prevMonthIdx + 1)}-${pad(prevMonthLastDay.getDate())}`;

      title = "🏆 สรุปการใช้รถประจำเดือน (Monthly EV Digest)";
      dateRangeStr = formatThaiMonthFull(prevMonthIdx, prevMonthYear);
    } else {
      // เดือนปัจจุบันถึงวันนี้
      const curYear = thaiDate.getFullYear();
      const curMonthIdx = thaiDate.getMonth();
      startDateStr = `${curYear}-${pad(curMonthIdx + 1)}-01`;
      endDateStr = `${curYear}-${pad(curMonthIdx + 1)}-${pad(thaiDate.getDate())}`;

      title = "🏆 สรุปการใช้รถประจำเดือน (Monthly EV Digest)";
      dateRangeStr = `${formatThaiMonthFull(curMonthIdx, curYear)} (1 - ${thaiDate.getDate()} ${formatThaiDate(endDateStr, true).split(" ")[1]})`;
    }
  }

  // ฟิลเตอร์ข้อมูลตามช่วงวันที่
  const filteredRows = rows.filter((r) => {
    const rDate = r.iso;
    if (!rDate) return false;
    return rDate >= startDateStr && rDate <= endDateStr;
  });

  let totalTrips = 0;
  let totalKm = 0;
  let totalDurationMin = 0;
  let weightedWhSum = 0;

  let totalChargedKwh = 0;
  let totalCostThb = 0;
  let homeKwh = 0;
  let homeCostThb = 0;
  let dcKwh = 0;
  let dcCostThb = 0;

  let odoStart: number | null = null;
  let odoEnd: number | null = null;

  for (const r of filteredRows) {
    // บันทึก ODO
    if (r.odoStart && r.odoStart > 0) {
      if (odoStart === null || r.odoStart < odoStart) odoStart = r.odoStart;
    }
    if (r.odoEnd && r.odoEnd > 0) {
      if (odoEnd === null || r.odoEnd > odoEnd) odoEnd = r.odoEnd;
    }

    if (r.kind === "trip" || r.km > 0) {
      totalTrips += 1;
      const km = r.km || 0;
      totalKm += km;
      totalDurationMin += r.min || 0;

      // ตรวจสอบอัตราสิ้นเปลือง Wh/km (ถ้าเก็บเป็น kWh/100km เช่น 13.2 ให้คูณ 10 จะได้ 132 Wh/km)
      const rawCons = r.cons || 0;
      const whKm = rawCons > 50 ? rawCons : (rawCons > 0 ? rawCons * 10 : 0);
      if (whKm > 0 && km > 0) {
        weightedWhSum += km * whKm;
      }
    }

    if (r.kind === "charge" || (r.kwh > 0 || r.net > 0)) {
      const kwh = r.kwh || 0;
      const cost = r.net || 0;

      totalChargedKwh += kwh;
      totalCostThb += cost;

      const noteLower = (r.note || "").toLowerCase();
      const isDc =
        noteLower.includes("dc") ||
        noteLower.includes("pea") ||
        noteLower.includes("ptt") ||
        noteLower.includes("charge+") ||
        noteLower.includes("station") ||
        noteLower.includes("ea") ||
        noteLower.includes("evolt") ||
        noteLower.includes("ตู้");

      if (isDc) {
        dcKwh += kwh;
        dcCostThb += cost;
      } else {
        homeKwh += kwh;
        homeCostThb += cost;
      }
    }
  }

  // คำนวณอัตราสิ้นเปลืองเฉลี่ยถ่วงน้ำหนัก
  const avgConsumptionWhKm = totalKm > 0 && weightedWhSum > 0
    ? Math.round(weightedWhSum / totalKm)
    : 0;

  // อัตราค่าเดินทาง ฿/กม.
  const costPerKmThb = totalKm > 0
    ? Math.round((totalCostThb / totalKm) * 100) / 100
    : 0;

  // คำนวณเทียบราคาน้ำมันเบนซิน (อ้างอิงรถยนต์ 14 กม./ลิตร, น้ำมัน 38 บาท/ลิตร)
  const gasolineEquivCostThb = totalKm > 0
    ? Math.round((totalKm / 14) * 38)
    : 0;

  const savingsThb = Math.max(0, gasolineEquivCostThb - Math.round(totalCostThb));

  return {
    periodType,
    title,
    dateRangeStr,
    totalTrips,
    totalKm: Math.round(totalKm * 10) / 10,
    totalDurationMin: Math.round(totalDurationMin),
    avgConsumptionWhKm,
    totalChargedKwh: Math.round(totalChargedKwh * 10) / 10,
    totalCostThb: Math.round(totalCostThb),
    homeKwh: Math.round(homeKwh * 10) / 10,
    homeCostThb: Math.round(homeCostThb),
    dcKwh: Math.round(dcKwh * 10) / 10,
    dcCostThb: Math.round(dcCostThb),
    costPerKmThb,
    gasolineEquivCostThb,
    savingsThb,
    odoStart,
    odoEnd,
  };
}
