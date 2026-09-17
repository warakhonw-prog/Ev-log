import {
  TripExtractionResult,
  ChargingExtractionResult,
  TripRecord,
  ChargingRecord,
  Env,
} from "./types";

function getNowParts(): { date: string; time: string; timestamp: string; hour: number } {
  const now = new Date();
  // แปลงเป็นเวลาประเทศไทย (UTC+7)
  const bkkOffset = 7 * 60;
  const localTime = new Date(now.getTime() + (bkkOffset + now.getTimezoneOffset()) * 60000);

  const yyyy = localTime.getFullYear();
  const mm = String(localTime.getMonth() + 1).padStart(2, "0");
  const dd = String(localTime.getDate()).padStart(2, "0");
  const hh = String(localTime.getHours()).padStart(2, "0");
  const min = String(localTime.getMinutes()).padStart(2, "0");
  const ss = String(localTime.getSeconds()).padStart(2, "0");

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`,
    timestamp: `${yyyy}${mm}${dd}${hh}${min}${ss}`,
    hour: localTime.getHours(),
  };
}

function normalizeSoc(soc: number | null): number | null {
  if (soc === null || soc === undefined) return null;
  if (soc > 1.0) return Number((soc / 100.0).toFixed(4));
  return Number(soc.toFixed(4));
}

export function buildTripRecord(data: TripExtractionResult, env: Env): TripRecord {
  const rate = parseFloat(env.ELECTRICITY_RATE_THB || "4.90");
  const efficiency = parseFloat(env.CHARGING_EFFICIENCY || "0.90");
  const batteryCap = parseFloat(env.BATTERY_CAPACITY_KWH || "68.5");
  const { date, time, timestamp, hour } = getNowParts();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const trip_id = `TRIP-${timestamp}-${randomSuffix}`;

  // 1. จัดการเลขไมล์ (Odometer)
  let dist = data.distance_km;
  let odo_start = data.odo_start;
  let odo_end = data.odo_end;

  if (dist != null && odo_end != null && odo_start == null) {
    odo_start = Math.round(odo_end - dist);
  } else if (dist != null && odo_start != null && odo_end == null) {
    odo_end = Math.round(odo_start + dist);
  } else if (dist == null && odo_start != null && odo_end != null) {
    dist = Number(Math.max(0, odo_end - odo_start).toFixed(1));
  }

  // 2. จัดการพลังงาน (kWh) และค่าไฟ (THB)
  let energy: number | "" = "";
  let cost_net: number | "" = "";
  let cost_grid: number | "" = "";

  if (dist != null && data.avg_consumption != null) {
    const rawEnergy = (dist * data.avg_consumption) / 100.0;
    energy = Number(rawEnergy.toFixed(2));
    cost_net = Number((rawEnergy * rate).toFixed(2));
    cost_grid = Number(((rawEnergy / efficiency) * rate).toFixed(2));
  }

  // 3. จัดการแบตเตอรี่ (SoC)
  let soc_s = normalizeSoc(data.soc_start);
  let soc_e = normalizeSoc(data.soc_end);

  // ถ้าหน้าจอแสดงเฉพาะแบตเตอรี่ปัจจุบัน (soc_e) ให้คำนวณย้อนหา soc_s จากพลังงานที่ใช้
  if (soc_s == null && soc_e != null && energy !== "") {
    const socUsed = Number(energy) / batteryCap;
    soc_s = Number(Math.min(1.0, soc_e + socUsed).toFixed(4));
  }

  // 4. สังเคราะห์ Note ตามช่วงเวลา (เลียนแบบตารางเดิมของผู้ใช้)
  let note = data.note;
  if (!note || note.includes("Auto-extracted") || note.includes("Cloudflare")) {
    if (hour >= 5 && hour < 11) {
      note = "Morning trip";
    } else if (hour >= 11 && hour < 14) {
      note = "Midday trip";
    } else if (hour >= 14 && hour < 18) {
      note = "Afternoon trip";
    } else {
      note = "Evening trip";
    }
  }

  return {
    trip_id,
    date,
    time,
    odo_start: odo_start ?? "",
    odo_end: odo_end ?? "",
    distance_km: dist ?? "",
    duration_min: data.duration_min ?? "",
    avg_consumption: data.avg_consumption ?? "",
    soc_start: soc_s !== null ? `${Math.round(soc_s * 100)}%` : "",
    soc_end: soc_e !== null ? `${Math.round(soc_e * 100)}%` : "",
    energy_kwh: energy,
    cost_net_thb: cost_net,
    cost_grid_thb: cost_grid,
    note: note || "Trip",
  };
}

export function buildChargingRecord(data: ChargingExtractionResult, env: Env): ChargingRecord {
  const batteryCap = parseFloat(env.BATTERY_CAPACITY_KWH || "68.5");
  const defaultRate = parseFloat(env.ELECTRICITY_RATE_THB || "4.90");
  const efficiency = parseFloat(env.CHARGING_EFFICIENCY || "0.90");
  const { date: nowDate, time: nowTime, timestamp } = getNowParts();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const charge_id = `CHG-${timestamp}-${randomSuffix}`;

  const isStationReceipt = data.energy_kwh != null && data.energy_kwh > 0;

  let soc_e = normalizeSoc(data.soc_end);
  let soc_s = normalizeSoc(data.soc_start);

  if (soc_s === null && soc_e !== null && data.range_added_km && data.current_range_km && data.current_range_km > 0) {
    const fullRange = data.current_range_km / soc_e;
    const socAdded = data.range_added_km / fullRange;
    soc_s = Number(Math.max(0, soc_e - socAdded).toFixed(4));
  }

  let net_kwh: number | "" = "";
  let grid_kwh: number | "" = "";
  let cost_net: number | "" = "";
  let cost_grid: number | "" = "";
  const rateUsed = data.unit_rate_thb || defaultRate;

  if (isStationReceipt) {
    net_kwh = Number(data.energy_kwh!.toFixed(2));
    grid_kwh = net_kwh; // DC public charger billed = delivered
    if (data.total_cost_thb != null && data.total_cost_thb > 0) {
      cost_net = Number(data.total_cost_thb.toFixed(2));
      cost_grid = cost_net;
    } else {
      cost_net = Number((net_kwh * rateUsed).toFixed(2));
      cost_grid = cost_net;
    }
  } else if (soc_s !== null && soc_e !== null && soc_e >= soc_s) {
    const diff = soc_e - soc_s;
    const rawNet = batteryCap * diff;
    const rawGrid = rawNet / efficiency;
    net_kwh = Number(rawNet.toFixed(2));
    grid_kwh = Number(rawGrid.toFixed(2));
    cost_net = Number((rawNet * defaultRate).toFixed(2));
    cost_grid = Number((rawGrid * defaultRate).toFixed(2));
  }

  // Parse date and time
  let recDate = nowDate;
  let recTime = nowTime;
  if (data.start_datetime) {
    const parts = data.start_datetime.split(" ");
    if (parts[0]) recDate = parts[0];
    if (parts[1]) recTime = parts[1].substring(0, 5);
  } else if (data.time_str) {
    recTime = data.time_str;
  }

  const start_dt = data.start_datetime || `${recDate} ${recTime}`;
  const end_dt = data.end_datetime || `${recDate} ${recTime}`;

  const locationStr = data.station_name || data.location || (isStationReceipt ? "DC Station" : "Home AC (2.4 kW)");
  let note = "";

  if (isStationReceipt) {
    const rStr = rateUsed.toFixed(2);
    note = `DC Charging @ ${locationStr} (${rStr} THB/kWh)`;
  } else {
    let durationNote = "";
    if (data.duration_min && data.duration_min > 0) {
      const h = Math.floor(data.duration_min / 60);
      const m = data.duration_min % 60;
      if (h > 0 && m > 0) {
        durationNote = ` in ${h}h ${m}m`;
      } else if (h > 0) {
        durationNote = ` in ${h}h`;
      } else {
        durationNote = ` in ${m}m`;
      }
    }
    const sPct = soc_s !== null ? `${Math.round(soc_s * 100)}%` : "-";
    const ePct = soc_e !== null ? `${Math.round(soc_e * 100)}%` : "-";
    note = `Finished Charging (${sPct} to ${ePct}${durationNote}) ${locationStr}`;
  }

  return {
    charge_id,
    start_datetime: start_dt,
    end_datetime: end_dt,
    duration_min: data.duration_min ?? "",
    soc_start: soc_s !== null ? `${Math.round(soc_s * 100)}%` : "",
    soc_end: soc_e !== null ? `${Math.round(soc_e * 100)}%` : "",
    net_kwh,
    grid_kwh,
    cost_net_thb: cost_net,
    cost_grid_thb: cost_grid,
    location: locationStr,
    note,
  };
}

export function tripToSheetRow(r: TripRecord): (string | number)[] {
  return [
    r.trip_id,
    r.date,
    r.time,
    r.odo_start,
    r.odo_end,
    r.distance_km,
    r.duration_min,
    r.avg_consumption,
    r.soc_start,
    r.soc_end,
    r.energy_kwh,
    r.cost_net_thb,
    r.cost_grid_thb,
    r.note,
  ];
}

export function chargingToSheetRow(r: ChargingRecord): (string | number)[] {
  return [
    r.charge_id,
    r.start_datetime,
    r.end_datetime,
    r.soc_start,
    r.soc_end,
    r.net_kwh,
    r.grid_kwh,
    r.cost_net_thb,
    r.cost_grid_thb,
    r.location,
  ];
}
