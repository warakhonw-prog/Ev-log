export interface Env {
  BATTERY_CAPACITY_KWH: string;
  ELECTRICITY_RATE_THB: string;
  CHARGING_EFFICIENCY: string;
  GEMINI_MODEL: string;

  // Secrets
  GEMINI_API_KEY: string;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  SPREADSHEET_ID: string;
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_APPS_SCRIPT_URL?: string; // ทางเลือกเสริม
  GOOGLE_DRIVE_FOLDER_ID?: string; // Google Drive Folder ID สำหรับเก็บรูปสลิป
  LINE_USER_ID?: string; // เจาะจงส่งเฉพาะบุคคล (หากไม่ใส่จะ broadcast)
  LINE_ALLOWED_USER_IDS?: string; // บัญชี LINE ที่ถามข้อมูลกับผู้ช่วย AI ได้ (คั่นด้วย ,) — ไม่ตั้ง = ปิด
  DASHBOARD_TOKEN?: string; // secret สำหรับ API ที่แก้ข้อมูล (Bearer หรือ login /login) ยาว >= 16 ตัวอักษร
}

export interface TripExtractionResult {
  odo_start: number | null;
  odo_end: number | null;
  distance_km: number | null;
  duration_min: number | null;
  avg_consumption: number | null;
  soc_start: number | null;
  soc_end: number | null;
  note: string | null;
}

export interface ChargingExtractionResult {
  start_datetime: string | null;
  end_datetime: string | null;
  soc_start: number | null;
  soc_end: number | null;
  duration_min: number | null;
  range_added_km: number | null;
  current_range_km: number | null;
  location: string | null;
  time_str: string | null;
  energy_kwh?: number | null;
  total_cost_thb?: number | null;
  unit_rate_thb?: number | null;
  station_name?: string | null;
}

export interface ScreenClassification {
  screen_type: "trip" | "charging" | "unknown";
  confidence: number;
  reason: string;
}

export interface TripRecord {
  trip_id: string;
  date: string;
  time: string;
  odo_start: number | "";
  odo_end: number | "";
  distance_km: number | "";
  duration_min: number | "";
  avg_consumption: number | "";
  soc_start: string;
  soc_end: string;
  energy_kwh: number | "";
  cost_net_thb: number | "";
  cost_grid_thb: number | "";
  note: string;
}

export interface ChargingRecord {
  charge_id: string;
  start_datetime: string;
  end_datetime: string;
  duration_min: number | "";
  soc_start: string;
  soc_end: string;
  net_kwh: number | "";
  grid_kwh: number | "";
  cost_net_thb: number | "";
  cost_grid_thb: number | "";
  location: string;
  note: string;
}

export interface PeriodSummary {
  periodType: "weekly" | "monthly";
  title: string;
  dateRangeStr: string;
  totalTrips: number;
  totalKm: number;
  totalDurationMin: number;
  avgConsumptionWhKm: number;
  totalChargedKwh: number;
  totalCostThb: number;
  totalCharges: number;
  acCharges: number;
  dcCharges: number;
  homeKwh: number;
  homeCostThb: number;
  dcKwh: number;
  dcCostThb: number;
  costPerKmThb: number;
  gasolineEquivCostThb: number;
  savingsThb: number;
  odoStart: number | null;
  odoEnd: number | null;
}
