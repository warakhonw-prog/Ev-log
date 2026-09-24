/**
 * Battery Health & Telemetry Pro (แผนที่ 2)
 *
 * วิเคราะห์จากแถวข้อมูลที่ normalize แล้วใน dashboardData.ts (pure function ไม่เรียก API ภายนอก)
 *
 * 1. ความจุใช้งานจริง (Usable Capacity) — วิธีหลักใช้ "ฝั่งการขับ":
 *      capacity = Σ พลังงานทริป (km × kWh/100km จากหน้าจอรถ) / Σ SOC ที่ลดลง
 *    ทั้งสองค่ามาจาก BMS/หน้าจอรถเอง จึงไม่ขึ้นกับการสูญเสียของเครื่องชาร์จ
 *    ส่วน "ฝั่งการชาร์จ" (kWh มิเตอร์ × efficiency / ΔSOC) ใช้เป็นค่าตรวจสอบไขว้เท่านั้น
 *    และตัดแถวที่ kWh ถูกคำนวณย้อนจาก ΔSOC × ความจุ (ค่าวนกลับ ไม่ใช่ค่าวัดจริง) ออก
 * 2. Degradation Trend — แบ่งทริปเป็นช่วงละ ~60% SOC แล้วประเมินความจุของแต่ละช่วง
 * 3. Dynamic Range Predictor — ระยะทางตามสถานการณ์ขับขี่ อิงอัตรากินไฟจริงของผู้ใช้
 * 4. DC Fast Charge Profiler — ความเร็วชาร์จเฉลี่ยแต่ละครั้ง และจุดตัด SOC ที่แนะนำ
 */

export interface DashboardRow {
  iso: string;
  time: string;
  odoStart: number;
  odoEnd: number;
  kind: "charge" | "trip";
  km: number;
  min: number;
  cons: number;
  s0: number;
  s1: number;
  kwh: number;
  net: number;
  grid: number;
  note: string;
}

export interface BatteryOptions {
  nominalKwh: number;
  acEfficiency: number;
  dcEfficiency?: number;
}

export type Confidence = "none" | "low" | "medium" | "high";

export interface CapacityWindow {
  index: number;
  fromIso: string;
  toIso: string;
  odo: number | null;
  efc: number;
  capacityKwh: number;
  uncertaintyKwh: number;
  socPct: number;
  energyKwh: number;
  trips: number;
}

export interface ChargeSample {
  iso: string;
  type: "AC" | "DC";
  s0: number;
  s1: number;
  kwh: number;
  capacityKwh: number;
}

export interface RangeScenario {
  key: "highway" | "city" | "eco";
  label: string;
  desc: string;
  whKm: number;
  source: "observed" | "model";
  observedTrips: number;
  observedKm: number;
  fullKm: number;
  dailyKm: number;
  fromCurrentKm: number;
}

export interface DcSession {
  iso: string;
  time: string;
  station: string;
  kwh: number;
  min: number;
  avgKw: number | null;
  s0: number | null;
  s1: number | null;
  minPer10Pct: number | null;
  thbPerKwh: number | null;
}

export interface BatteryAnalysis {
  nominalKwh: number;
  capacity: {
    estimateKwh: number | null;
    uncertaintyKwh: number | null;
    confidence: Confidence;
    drive: { kwh: number | null; trips: number; energyKwh: number; socPct: number };
    charge: {
      medianKwh: number | null;
      samples: ChargeSample[];
      excludedDerived: number;
    };
  };
  trend: {
    windows: CapacityWindow[];
    /** ส่วนเบี่ยงเบนมาตรฐานของความจุรายช่วง (สะท้อน noise จริงของข้อมูล) */
    windowSdKwh: number | null;
    /** เฉลี่ย 3 ช่วงแรก vs 3 ช่วงล่าสุด (มีเมื่อ ≥ 6 ช่วง) */
    earlyKwh: number | null;
    recentKwh: number | null;
    slopeKwhPer10kKm: number | null;
    note: string;
  };
  cycles: { efc: number; throughputKwh: number };
  range: {
    baselineWhKm: number | null;
    usableKwh: number;
    currentSoc: number | null;
    scenarios: RangeScenario[];
  };
  dcProfile: {
    sessions: DcSession[];
    avgKw: number | null;
    maxKw: number | null;
    avgThbPerKwh: number | null;
    recommendation: { cutoffSoc: number; basis: "data" | "general"; text: string };
  };
  acProfile: { sessions: number; avgKw: number | null };
  dataTips: string[];
}

// ช่วง SOC ที่สะสมต่อ 1 จุดในกราฟแนวโน้ม
const WINDOW_SOC_PCT = 60;
const WINDOW_MIN_TRIPS = 5;
// ส่วนเบี่ยงเบนของ ΔSOC ต่อทริปจากการปัดเศษจอแสดงผลทีละ 1% (ต้น+ปลาย, uniform ±0.5) = √(2/12)
const SOC_ROUNDING_SD = Math.sqrt(2 / 12);

const SCENARIO_DEFS: {
  key: RangeScenario["key"];
  label: string;
  desc: string;
  factor: number;
  minKmh: number;
  maxKmh: number;
}[] = [
  { key: "highway", label: "ทางด่วน 110-120 km/h", desc: "วิ่งทางไกลความเร็วสูงต่อเนื่อง แรงต้านอากาศสูง", factor: 1.35, minKmh: 85, maxKmh: Infinity },
  { key: "city", label: "ในเมืองรถติด แอร์เย็นฉ่ำ", desc: "หยุด-ออกตัวบ่อย แอร์ทำงานหนักตลอด", factor: 1.2, minKmh: 0, maxKmh: 25 },
  { key: "eco", label: "ชานเมือง ความเร็วคงที่ (Eco Cruise)", desc: "60-80 km/h สม่ำเสมอ ใช้ ECO mode", factor: 0.92, minKmh: 40, maxKmh: 80 },
];

function round(n: number, d: number): number {
  const p = Math.pow(10, d);
  return Math.round(n * p) / p;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** kWh/100km หรือ Wh/km → kWh/km (ดู CONTEXT.md: ค่า > 50 ถือเป็น Wh/km) */
function consKwhPerKm(cons: number): number {
  return cons > 50 ? cons / 1000 : cons / 100;
}

export function isDcCharge(r: Pick<DashboardRow, "note" | "kind">): boolean {
  const text = ((r.note || "") + " " + (r.kind || "")).toLowerCase();
  return (
    text.includes("dc") ||
    text.includes("เร็ว") ||
    text.includes("fast") ||
    text.includes("pea") ||
    text.includes("ptt") ||
    text.includes("ea ") ||
    text.includes("station") ||
    text.includes("charge+")
  );
}

function stationName(note: string): string {
  const m = note.match(/@\s*([^(]+)/);
  const name = (m ? m[1] : note).trim();
  return name || "-";
}

/** ทริปที่ใช้คำนวณความจุได้: มีระยะทาง อัตรากินไฟสมเหตุสมผล และ SOC ต้น/ปลายครบ */
function isCapacityTrip(r: DashboardRow): boolean {
  if (r.kind !== "trip" || !(r.km > 0) || r.km >= 600) return false;
  const whKm = consKwhPerKm(r.cons) * 1000;
  if (!(whKm >= 50 && whKm <= 400)) return false;
  return r.s0 > 0 && r.s1 > 0 && r.s0 <= 100 && r.s0 >= r.s1;
}

function confidenceFor(socPct: number, trips: number): Confidence {
  if (socPct < 60 || trips < 5) return "none";
  if (socPct < 150) return "low";
  if (socPct < 400) return "medium";
  return "high";
}

function sampleSd(values: number[]): number {
  const n = values.length;
  const m = values.reduce((a, b) => a + b, 0) / n;
  return Math.sqrt(values.reduce((a, v) => a + (v - m) * (v - m), 0) / (n - 1));
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function linearSlope(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) * (xs[i] - mx);
  }
  return den === 0 ? 0 : num / den;
}

export function analyzeBattery(rows: DashboardRow[], opts: BatteryOptions): BatteryAnalysis {
  const nominal = opts.nominalKwh;
  const etaAc = opts.acEfficiency;
  const etaDc = opts.dcEfficiency ?? 0.95;
  const charges = rows.filter((r) => r.kind === "charge");
  const trips = rows.filter((r) => r.kind === "trip");

  // ---------- Equivalent Full Cycles (พลังงานเข้าแบต ÷ ความจุสเปก) ----------
  // สะสมตามลำดับเวลาเพื่อใช้ระบุ EFC ของแต่ละช่วงในกราฟแนวโน้ม
  const efcAtIndex = new Map<DashboardRow, number>();
  let throughput = 0;
  for (const r of rows) {
    if (r.kind === "charge" && r.kwh > 0) {
      throughput += r.kwh * (isDcCharge(r) ? etaDc : etaAc);
    }
    efcAtIndex.set(r, throughput / nominal);
  }

  // ---------- 1. ความจุฝั่งการขับ + หน้าต่างแนวโน้ม ----------
  const capTrips = rows.filter(isCapacityTrip);
  let driveEnergy = 0;
  let driveSoc = 0;
  const windows: CapacityWindow[] = [];
  let wEnergy = 0;
  let wSoc = 0;
  let wTrips = 0;
  let wFrom = "";
  let maxOdo = 0;

  for (const r of capTrips) {
    const energy = r.km * consKwhPerKm(r.cons);
    const dSoc = r.s0 - r.s1;
    driveEnergy += energy;
    driveSoc += dSoc;
    if (wTrips === 0) wFrom = r.iso;
    wEnergy += energy;
    wSoc += dSoc;
    wTrips++;
    // เลขไมล์บางแถวผิด (เช่น odoEnd ย้อนกลับ) ใช้ค่าสูงสุดสะสมแทน
    if (r.odoEnd > maxOdo && r.odoEnd < 1_000_000) maxOdo = r.odoEnd;

    if (wSoc >= WINDOW_SOC_PCT && wTrips >= WINDOW_MIN_TRIPS) {
      const cap = wEnergy / (wSoc / 100);
      windows.push({
        index: windows.length,
        fromIso: wFrom,
        toIso: r.iso,
        odo: maxOdo || null,
        efc: round(efcAtIndex.get(r) ?? 0, 2),
        capacityKwh: round(cap, 2),
        uncertaintyKwh: round((cap * SOC_ROUNDING_SD * Math.sqrt(wTrips)) / wSoc, 2),
        socPct: wSoc,
        energyKwh: round(wEnergy, 2),
        trips: wTrips,
      });
      wEnergy = 0;
      wSoc = 0;
      wTrips = 0;
    }
  }

  const confidence = confidenceFor(driveSoc, capTrips.length);
  const driveKwh = driveSoc > 0 ? driveEnergy / (driveSoc / 100) : null;
  const estimateKwh = confidence !== "none" && driveKwh !== null ? round(driveKwh, 2) : null;

  // noise จริงมากกว่าการปัดเศษ SOC (แบตลดขณะจอด, จอรถปัดค่าพลังงาน) จึงใช้ค่าที่มากกว่า
  // ระหว่าง error จากการปัดเศษ กับ standard error จากการกระจายของค่ารายช่วง
  const windowCaps = windows.map((w) => w.capacityKwh);
  const windowSd = windowCaps.length >= 3 ? sampleSd(windowCaps) : null;
  let uncertaintyKwh: number | null = null;
  if (estimateKwh !== null) {
    const roundingErr = (estimateKwh * SOC_ROUNDING_SD * Math.sqrt(capTrips.length)) / driveSoc;
    const empiricalErr = windowSd !== null ? windowSd / Math.sqrt(windowCaps.length) : 0;
    uncertaintyKwh = round(Math.max(roundingErr, empiricalErr), 2);
  }

  // ---------- ความจุฝั่งการชาร์จ (ตรวจสอบไขว้) ----------
  // kWh ที่ได้จาก ΔSOC × ความจุ (หรือ ÷ efficiency) ไม่ใช่ค่าวัดจริง ต้องตัดออก
  const derivedCaps = [68.8, 68.5, nominal].flatMap((c) => [c, c / etaAc]);
  const samples: ChargeSample[] = [];
  let excludedDerived = 0;
  for (const r of charges) {
    const dSoc = r.s1 - r.s0;
    if (!(r.kwh > 0) || !(r.s0 > 0) || dSoc < 15 || r.s1 > 100) continue;
    const kwhPerSoc = r.kwh / (dSoc / 100);
    if (derivedCaps.some((c) => Math.abs(kwhPerSoc - c) < 0.25)) {
      excludedDerived++;
      continue;
    }
    const dc = isDcCharge(r);
    const cap = kwhPerSoc * (dc ? etaDc : etaAc);
    // ค่าที่หลุดจากช่วงสมเหตุสมผลมาก มักเป็นสลิปที่อ่าน SOC/kWh ผิด
    if (cap < nominal * 0.7 || cap > nominal * 1.2) continue;
    samples.push({ iso: r.iso, type: dc ? "DC" : "AC", s0: r.s0, s1: r.s1, kwh: r.kwh, capacityKwh: round(cap, 2) });
  }
  const chargeMedian = median(samples.map((s) => s.capacityKwh));

  // ---------- 2. แนวโน้มการเสื่อม ----------
  let slope: number | null = null;
  let trendNote: string;
  const odoPoints = windows.filter((w) => w.odo !== null);
  const odoSpan = odoPoints.length > 1 ? odoPoints[odoPoints.length - 1].odo! - odoPoints[0].odo! : 0;
  if (odoPoints.length >= 4 && odoSpan >= 3000) {
    slope = round(
      linearSlope(
        odoPoints.map((w) => w.odo!),
        odoPoints.map((w) => w.capacityKwh)
      ) * 10000,
      2
    );
    trendNote = `คำนวณจาก ${odoPoints.length} ช่วง ครอบคลุม ${Math.round(odoSpan).toLocaleString("en-US")} km`;
  } else {
    trendNote = `ต้องมีอย่างน้อย 4 ช่วงและระยะทางครอบคลุม 3,000 km ขึ้นไปจึงจะประเมินอัตราการเสื่อมได้ (ตอนนี้ ${windows.length} ช่วง, ${Math.round(odoSpan).toLocaleString("en-US")} km)`;
  }

  // ---------- 3. Dynamic Range Predictor ----------
  let rangeEnergy = 0;
  let rangeKm = 0;
  for (const r of trips) {
    if (!(r.km > 0) || r.km >= 600) continue;
    const whKm = consKwhPerKm(r.cons) * 1000;
    if (!(whKm >= 50 && whKm <= 400)) continue;
    rangeEnergy += r.km * consKwhPerKm(r.cons);
    rangeKm += r.km;
  }
  const baselineWhKm = rangeKm > 0 ? round((rangeEnergy / rangeKm) * 1000, 1) : null;
  const usableKwh = estimateKwh ?? nominal;

  let currentSoc: number | null = null;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].s1 > 0 && rows[i].s1 <= 100) {
      currentSoc = rows[i].s1;
      break;
    }
  }

  const scenarios: RangeScenario[] = [];
  if (baselineWhKm !== null) {
    for (const def of SCENARIO_DEFS) {
      let bandEnergy = 0;
      let bandKm = 0;
      let bandTrips = 0;
      for (const r of trips) {
        if (!(r.km > 0) || r.km >= 600 || !(r.min > 0)) continue;
        const whKm = consKwhPerKm(r.cons) * 1000;
        if (!(whKm >= 50 && whKm <= 400)) continue;
        const kmh = r.km / (r.min / 60);
        if (kmh < def.minKmh || kmh >= def.maxKmh) continue;
        bandEnergy += r.km * consKwhPerKm(r.cons);
        bandKm += r.km;
        bandTrips++;
      }
      const observed = bandKm >= 60 && bandTrips >= 3;
      const whKm = observed ? (bandEnergy / bandKm) * 1000 : baselineWhKm * def.factor;
      const kmPerPct = usableKwh / 100 / (whKm / 1000);
      scenarios.push({
        key: def.key,
        label: def.label,
        desc: def.desc,
        whKm: round(whKm, 0),
        source: observed ? "observed" : "model",
        observedTrips: bandTrips,
        observedKm: round(bandKm, 1),
        fullKm: Math.round(kmPerPct * 100),
        dailyKm: Math.round(kmPerPct * 80),
        fromCurrentKm: currentSoc !== null ? Math.max(0, Math.round(kmPerPct * (currentSoc - 10))) : 0,
      });
    }
  }

  // ---------- 4. DC Fast Charge Profiler ----------
  const dcSessions: DcSession[] = charges
    .filter((r) => isDcCharge(r) && r.kwh > 0)
    .map((r) => {
      const avgKw = r.min >= 3 ? r.kwh / (r.min / 60) : null;
      const hasSoc = r.s0 > 0 && r.s1 > r.s0 && r.s1 <= 100;
      return {
        iso: r.iso,
        time: r.time,
        station: stationName(r.note),
        kwh: r.kwh,
        min: r.min,
        avgKw: avgKw !== null && avgKw <= 400 ? round(avgKw, 1) : null,
        s0: hasSoc ? r.s0 : null,
        s1: hasSoc ? r.s1 : null,
        minPer10Pct: hasSoc && r.min > 0 ? round(r.min / ((r.s1 - r.s0) / 10), 1) : null,
        thbPerKwh: r.net > 0 ? round(r.net / r.kwh, 2) : null,
      };
    });
  const kwValues = dcSessions.map((s) => s.avgKw).filter((v): v is number => v !== null);
  const priced = dcSessions.filter((s) => s.thbPerKwh !== null);
  const pricedKwh = priced.reduce((a, s) => a + s.kwh, 0);

  // แบ่งครั้งที่จบก่อน/หลัง 85% เพื่อดูว่าความเร็วตกลงช่วงท้ายมากแค่ไหน
  const withCurve = dcSessions.filter((s) => s.avgKw !== null && s.s1 !== null);
  const early = withCurve.filter((s) => s.s1! <= 85);
  const late = withCurve.filter((s) => s.s1! > 85);
  let recommendation: BatteryAnalysis["dcProfile"]["recommendation"];
  if (early.length >= 2 && late.length >= 2) {
    const earlyKw = early.reduce((a, s) => a + s.avgKw!, 0) / early.length;
    const lateKw = late.reduce((a, s) => a + s.avgKw!, 0) / late.length;
    const ratio = lateKw / earlyKw;
    recommendation =
      ratio < 0.75
        ? {
            cutoffSoc: 80,
            basis: "data",
            text: `ครั้งที่ชาร์จเกิน 85% ได้ความเร็วเฉลี่ย ${round(lateKw, 0)} kW ต่ำกว่าครั้งที่หยุดก่อน 85% (${round(earlyKw, 0)} kW) ถึง ${Math.round((1 - ratio) * 100)}% แนะนำตัดที่ 80% แล้วไปชาร์จต่อที่ปลายทาง`,
          }
        : {
            cutoffSoc: 90,
            basis: "data",
            text: `ความเร็วเฉลี่ยช่วงเกิน 85% (${round(lateKw, 0)} kW) ยังใกล้เคียงช่วงก่อน 85% (${round(earlyKw, 0)} kW) ชาร์จถึง 90% ได้โดยไม่เสียเวลามาก`,
          };
  } else {
    recommendation = {
      cutoffSoc: 80,
      basis: "general",
      text: "แบต LFP มักรับไฟ DC ได้เร็วช่วง 10-80% แล้วชะลอลงชัดเจนหลังจากนั้น แนะนำตัดที่ 80% เมื่อต้องเดินทางต่อ (ยังมีข้อมูลที่ระบุ SOC ต้น/ปลายไม่พอสำหรับวิเคราะห์จากรถคันนี้)",
    };
  }

  // ---------- AC (ชาร์จบ้าน) ----------
  const acKw = charges
    .filter((r) => !isDcCharge(r) && r.kwh > 0 && r.min >= 30)
    .map((r) => r.kwh / (r.min / 60))
    .filter((kw) => kw > 0 && kw <= 22);

  // ---------- คำแนะนำการบันทึกข้อมูล ----------
  const dataTips: string[] = [];
  const dcNoSoc = dcSessions.filter((s) => s.s1 === null).length;
  if (dcNoSoc > 0) {
    dataTips.push(`ชาร์จ DC ${dcNoSoc} ครั้งยังไม่มี SOC ต้น/ปลาย ให้แคปหน้าจอรถที่แสดง % แบตคู่กับสลิปด้วย เพื่อใช้วิเคราะห์ความเร็วการชาร์จ`);
  }
  if (excludedDerived > 0) {
    dataTips.push(`การชาร์จ ${excludedDerived} ครั้งมี kWh ที่คำนวณจาก % แบต (ไม่ใช่ค่ามิเตอร์) จึงไม่นำมาตรวจสอบความจุ ถ้ามีเลขมิเตอร์จริงให้บันทึกแทน`);
  }
  const tripsNoMin = trips.filter((r) => r.km > 0 && !(r.min > 0)).length;
  if (tripsNoMin > 0) {
    dataTips.push(`ทริป ${tripsNoMin} รายการไม่มีระยะเวลาเดินทาง จึงจัดกลุ่มตามความเร็วไม่ได้`);
  }
  if (confidence === "none" || confidence === "low") {
    dataTips.push("บันทึก % แบตต้น/ปลายทุกทริปต่อเนื่อง ยิ่งสะสมมาก ค่าความจุจะยิ่งแม่นยำ");
  }

  return {
    nominalKwh: nominal,
    capacity: {
      estimateKwh,
      uncertaintyKwh,
      confidence,
      drive: {
        kwh: driveKwh !== null ? round(driveKwh, 2) : null,
        trips: capTrips.length,
        energyKwh: round(driveEnergy, 2),
        socPct: driveSoc,
      },
      charge: { medianKwh: chargeMedian !== null ? round(chargeMedian, 2) : null, samples, excludedDerived },
    },
    trend: {
      windows,
      windowSdKwh: windowSd !== null ? round(windowSd, 2) : null,
      earlyKwh: windows.length >= 6 ? round(mean(windowCaps.slice(0, 3)), 2) : null,
      recentKwh: windows.length >= 6 ? round(mean(windowCaps.slice(-3)), 2) : null,
      slopeKwhPer10kKm: slope,
      note: trendNote,
    },
    cycles: { efc: round(throughput / nominal, 2), throughputKwh: round(throughput, 1) },
    range: { baselineWhKm, usableKwh, currentSoc, scenarios },
    dcProfile: {
      sessions: dcSessions,
      avgKw: kwValues.length ? round(kwValues.reduce((a, b) => a + b, 0) / kwValues.length, 1) : null,
      maxKw: kwValues.length ? Math.max(...kwValues) : null,
      avgThbPerKwh: pricedKwh > 0 ? round(priced.reduce((a, s) => a + s.thbPerKwh! * s.kwh, 0) / pricedKwh, 2) : null,
      recommendation,
    },
    acProfile: {
      sessions: acKw.length,
      avgKw: acKw.length ? round(acKw.reduce((a, b) => a + b, 0) / acKw.length, 2) : null,
    },
    dataTips,
  };
}
