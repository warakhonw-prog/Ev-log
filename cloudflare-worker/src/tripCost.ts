/**
 * ค่าเดินทางตามราคาไฟจริงที่อยู่ในแบต
 *
 * ในชีต ค่าไฟของทริป (คอลัมน์ K) คิดที่อัตราค่าไฟบ้านอัตราเดียว (ELECTRICITY_RATE_THB) แต่ไฟในแบต
 * มาจากทั้งชาร์จบ้าน (~4.90 ฿/kWh) และ DC (~7-8 ฿/kWh) ไฟล์นี้คำนวณราคาใหม่ตอนแสดงผล ไม่เขียนกลับลงชีต:
 *   ราคาต่อ kWh ของทริป = ราคาเฉลี่ยถ่วงน้ำหนักของการชาร์จล่าสุดก่อนทริปนั้น (คันเดียวกัน) รวมประมาณ 1 แบต
 *   ค่าเดินทาง = พลังงานที่ใช้ (kWh) × ราคานั้น
 * การชาร์จครั้งที่เก่าที่สุดในช่วง 1 แบตนับเฉพาะส่วนที่ทำให้ครบความจุ
 * ไม่มีการชาร์จก่อนทริปเลย = ใช้ค่าในชีตตามเดิม
 */

export interface TripCostRow {
  iso: string;
  time: string;
  kind: "charge" | "trip";
  kwh: number;
  net: number;
  vehicle?: string;
  /** ค่าไฟของทริปตามชีต (อัตราเดียว) เก็บไว้ให้หน้าแก้ไขเขียนกลับค่าเดิม */
  netSheet?: number;
  /** ราคาไฟเฉลี่ยในแบตที่ใช้คิดทริปนี้ (฿/kWh) */
  rateActual?: number;
  /** "battery" = คิดจากการชาร์จจริง, "sheet" = ใช้ค่าในชีต (ไม่มีข้อมูลชาร์จก่อนหน้า) */
  costBasis?: "battery" | "sheet";
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * แก้ `net` ของแถว trip ให้เป็นค่าไฟตามราคาจริง (แก้ในที่เดิม) และเก็บค่าเดิมไว้ที่ `netSheet`
 * @param rows ลำดับใดก็ได้ (ไม่เปลี่ยนลำดับของ array เดิม)
 * @param capacityOf ความจุแบตของแต่ละคัน (kWh)
 */
export function applyActualTripCost<T extends TripCostRow>(rows: T[], capacityOf: (vehicleId: string) => number): void {
  // การชาร์จที่ผ่านมาของแต่ละคัน (เก่า → ใหม่)
  const history: Record<string, { kwh: number; thb: number; iso: string; time: string }[]> = {};

  // เรียงตามวันที่+เวลาเอง (แถวที่ส่งมาเรียงตามเลขไมล์ การชาร์จเช้าวันเดียวกันอาจอยู่หลังทริปบ่าย) · sort แบบ stable
  const ordered = rows.slice().sort((a, b) => (a.iso + " " + (a.time || "")).localeCompare(b.iso + " " + (b.time || "")));

  for (const r of ordered) {
    const vid = r.vehicle || "";
    const past = (history[vid] ||= []);

    if (r.kind === "charge") {
      if (r.kwh > 0 && r.net > 0) past.push({ kwh: r.kwh, thb: r.net, iso: r.iso, time: r.time });
      continue;
    }

    r.netSheet = r.net;
    r.costBasis = "sheet";

    // การชาร์จวันเดียวกันที่เวลาหลังทริป ไม่นับ (แถวในชีตบางทีลงไม่ตรงลำดับเวลา)
    const before = past.filter((c) => !(c.iso === r.iso && c.time && r.time && c.time > r.time));
    if (!before.length) continue;

    const capacity = capacityOf(vid) || 68.5;
    let kwh = 0;
    let thb = 0;
    for (let i = before.length - 1; i >= 0 && kwh < capacity; i--) {
      const c = before[i];
      const take = Math.min(c.kwh, capacity - kwh);
      kwh += take;
      thb += (c.thb / c.kwh) * take;
    }
    if (kwh <= 0) continue;

    const rate = thb / kwh;
    r.rateActual = round2(rate);
    r.costBasis = "battery";
    if (r.kwh > 0) r.net = round2(r.kwh * rate);
  }
}
