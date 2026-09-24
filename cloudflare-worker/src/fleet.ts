/**
 * Multi-Car Fleet (แผนที่ 4): โปรไฟล์รถหลายคัน + คอลัมน์ต่อท้ายของแถวข้อมูล
 *
 * ชีตหลัก (A:M เดิม) เพิ่ม 3 คอลัมน์ต่อท้าย: N = Vehicle, O = Driver, P = Purpose
 *   แถวเก่าที่ว่าง = รถคันหลัก / ไม่ระบุผู้ขับ / ส่วนตัว
 * แท็บ "Vehicles" เก็บโปรไฟล์รถ: A = Vehicle_ID, B = Name, C = Plate, D = Battery_kWh, E = Default
 *   ถ้ายังไม่มีแท็บ จะใช้รถจาก env (BATTERY_CAPACITY_KWH) เป็นคันหลัก และสร้างแท็บตอนบันทึกรถครั้งแรก
 */

import { Env } from "./types";
import { getGoogleAccessToken } from "./sheets";

export const EXT_HEADERS = ["Vehicle", "Driver", "Purpose"];
export const VEHICLES_TAB = "Vehicles";
const VEHICLE_HEADERS = ["Vehicle_ID", "Name", "Plate", "Battery_kWh", "Default"];
const FALLBACK_VEHICLE_ID = "V1";

export type Purpose = "business" | "personal";

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  batteryKwh: number;
  isDefault: boolean;
}

export interface RowExt {
  vehicle: string;
  driver: string;
  purpose: Purpose;
}

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

export function normalizePurpose(val: any): Purpose {
  const s = (val ?? "").toString().trim().toLowerCase();
  return s === "business" || s === "งาน" || s === "ธุรกิจ" || s === "work" ? "business" : "personal";
}

export function extToCells(ext: Partial<RowExt>): string[] {
  return [
    (ext.vehicle || "").toString().trim(),
    (ext.driver || "").toString().trim(),
    ext.purpose === "business" ? "business" : ext.purpose === "personal" ? "personal" : "",
  ];
}

export function fallbackVehicle(env: Env): Vehicle {
  return {
    id: FALLBACK_VEHICLE_ID,
    name: "XPENG G6 STD",
    plate: "",
    batteryKwh: parseFloat(env.BATTERY_CAPACITY_KWH || "68.5"),
    isDefault: true,
  };
}

async function sheetTitles(env: Env, token: string): Promise<{ title: string; sheetId: number }[]> {
  const res = await fetch(`${SHEETS_API}/${env.SPREADSHEET_ID}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Cannot inspect spreadsheet: ${await res.text()}`);
  const meta: any = await res.json();
  return (meta.sheets || []).map((s: any) => ({ title: s.properties.title, sheetId: s.properties.sheetId }));
}

async function getValues(env: Env, token: string, range: string): Promise<any[][]> {
  const res = await fetch(`${SHEETS_API}/${env.SPREADSHEET_ID}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Cannot read ${range}: ${await res.text()}`);
  const data: any = await res.json();
  return data.values || [];
}

async function putValues(env: Env, token: string, range: string, values: any[][]): Promise<void> {
  const res = await fetch(
    `${SHEETS_API}/${env.SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    }
  );
  if (!res.ok) throw new Error(`Cannot write ${range}: ${await res.text()}`);
}

/** เขียนหัวคอลัมน์ N1:P1 ถ้ายังไม่มี (เรียกก่อนเขียนแถวที่มีคอลัมน์ต่อท้าย) */
export async function ensureExtHeaders(env: Env, token: string, title: string): Promise<void> {
  const current = (await getValues(env, token, `${title}!N1:P1`))[0] || [];
  if (EXT_HEADERS.every((h, i) => (current[i] || "") === h)) return;
  await putValues(env, token, `${title}!N1:P1`, [EXT_HEADERS]);
}

/** อ่านโปรไฟล์รถจากแท็บ Vehicles (ไม่มีแท็บ = คืนรถสำรองจาก env) */
export async function readVehicles(env: Env, token: string, titles?: string[]): Promise<Vehicle[]> {
  const names = titles ?? (await sheetTitles(env, token)).map((s) => s.title);
  if (!names.includes(VEHICLES_TAB)) return [fallbackVehicle(env)];

  const rows = await getValues(env, token, `${VEHICLES_TAB}!A2:E`);
  const vehicles: Vehicle[] = rows
    .filter((r) => r && (r[0] || "").toString().trim())
    .map((r) => ({
      id: r[0].toString().trim(),
      name: (r[1] || r[0]).toString().trim(),
      plate: (r[2] || "").toString().trim(),
      batteryKwh: parseFloat((r[3] || "").toString()) || parseFloat(env.BATTERY_CAPACITY_KWH || "68.5"),
      isDefault: ["true", "yes", "1", "y"].includes((r[4] || "").toString().trim().toLowerCase()),
    }));
  if (vehicles.length === 0) return [fallbackVehicle(env)];
  if (!vehicles.some((v) => v.isDefault)) vehicles[0].isDefault = true;
  return vehicles;
}

export function defaultVehicleId(vehicles: Vehicle[]): string {
  return (vehicles.find((v) => v.isDefault) || vehicles[0]).id;
}

async function ensureVehiclesTab(env: Env, token: string, env0: Vehicle): Promise<void> {
  const titles = (await sheetTitles(env, token)).map((s) => s.title);
  if (titles.includes(VEHICLES_TAB)) return;
  const res = await fetch(`${SHEETS_API}/${env.SPREADSHEET_ID}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: VEHICLES_TAB } } }] }),
  });
  if (!res.ok) throw new Error(`Cannot create ${VEHICLES_TAB} tab: ${await res.text()}`);
  // ย้ายรถสำรองจาก env ลงแท็บ เพื่อให้แถวเก่า (คอลัมน์ Vehicle ว่าง) ยังผูกกับรถคันนี้
  await putValues(env, token, `${VEHICLES_TAB}!A1:E2`, [
    VEHICLE_HEADERS,
    [env0.id, env0.name, env0.plate, env0.batteryKwh, "TRUE"],
  ]);
}

/** เพิ่มหรือแก้ไขรถ (id ซ้ำ = แก้ไข) ถ้า isDefault จะยกเลิกค่าเริ่มต้นของคันอื่น */
export async function saveVehicle(input: Partial<Vehicle>, env: Env): Promise<Vehicle[]> {
  const token = await getGoogleAccessToken(env.GOOGLE_CLIENT_EMAIL, env.GOOGLE_PRIVATE_KEY);
  await ensureVehiclesTab(env, token, fallbackVehicle(env));
  const vehicles = await readVehicles(env, token);

  const name = (input.name || "").toString().trim();
  if (!name) throw new Error("ต้องระบุชื่อรถ");
  const batteryKwh = Number(input.batteryKwh);
  if (!(batteryKwh > 5 && batteryKwh < 250)) throw new Error("ความจุแบตเตอรี่ไม่ถูกต้อง (5-250 kWh)");

  let id = (input.id || "").toString().trim();
  const existing = id ? vehicles.find((v) => v.id === id) : undefined;
  if (!existing) {
    let n = vehicles.length + 1;
    while (vehicles.some((v) => v.id === `V${n}`)) n++;
    id = `V${n}`;
  }
  const saved: Vehicle = {
    id,
    name,
    plate: (input.plate || "").toString().trim(),
    batteryKwh,
    isDefault: input.isDefault === true || (existing?.isDefault ?? false),
  };

  const next = existing ? vehicles.map((v) => (v.id === id ? saved : v)) : [...vehicles, saved];
  if (saved.isDefault) next.forEach((v) => (v.isDefault = v.id === id));

  await putValues(
    env,
    token,
    `${VEHICLES_TAB}!A2:E${next.length + 1}`,
    next.map((v) => [v.id, v.name, v.plate, v.batteryKwh, v.isDefault ? "TRUE" : "FALSE"])
  );
  return next;
}

/** แก้เฉพาะคอลัมน์ Purpose (P) ของแถวที่ระบุ ใช้กับคำสั่ง "งาน"/"ส่วนตัว" จาก LINE */
export async function setRowPurpose(rowIndex: number, purpose: Purpose, env: Env, title: string): Promise<void> {
  if (!rowIndex || rowIndex < 2) throw new Error("Invalid rowIndex");
  const token = await getGoogleAccessToken(env.GOOGLE_CLIENT_EMAIL, env.GOOGLE_PRIVATE_KEY);
  await ensureExtHeaders(env, token, title);
  await putValues(env, token, `${title}!P${rowIndex}`, [[purpose]]);
}
