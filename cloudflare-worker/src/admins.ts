/**
 * บัญชีแอดมิน (ชื่อผู้ใช้ + รหัสผ่าน) เก็บในแท็บ "Admins" ของ Google Sheets
 * A = Username, B = PasswordHash, C = Salt, D = Iterations, E = UpdatedAt, F = FailedCount, G = LockedUntil
 *
 * - รหัสผ่านเก็บเป็น PBKDF2-SHA256 (มี salt ต่อบัญชี) ไม่มีรหัสจริงในชีต
 * - ใส่ผิด 5 ครั้งติด ล็อกบัญชี 15 นาที (กันการเดารหัส)
 * - DASHBOARD_TOKEN ยังใช้ได้เสมอ: ใช้สร้างบัญชีแรกและกู้คืนเมื่อลืมรหัส
 */

import { Env } from "./types";
import { getGoogleAccessToken } from "./sheets";

export const ADMINS_TAB = "Admins";
const HEADERS = ["Username", "PasswordHash", "Salt", "Iterations", "UpdatedAt", "FailedCount", "LockedUntil"];
// ~5 ms CPU ต่อครั้ง (อยู่ในงบ CPU ของ Workers แพ็กเกจฟรี) · เก็บต่อบัญชี จึงเพิ่มภายหลังได้
const PBKDF2_ITERATIONS = 40000;
const MAX_FAILED = 5;
const LOCK_SEC = 15 * 60;
export const MIN_PASSWORD_LENGTH = 8;

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const encoder = new TextEncoder();

export interface AdminRecord {
  row: number;
  username: string;
  hash: string;
  salt: string;
  iterations: number;
  updatedAt: string;
  failed: number;
  lockedUntil: number;
}

export interface AdminSummary {
  username: string;
  updatedAt: string;
  locked: boolean;
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pbkdf2(password: string, salt: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations },
    key,
    256
  );
  return b64url(new Uint8Array(bits));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** รุ่นของรหัสผ่าน ใช้ผูกกับ session — เปลี่ยนรหัสแล้ว session เก่าของบัญชีนั้นใช้ไม่ได้ */
export function passwordVersion(rec: Pick<AdminRecord, "hash">): string {
  return rec.hash.slice(0, 12);
}

export function normalizeUsername(u: any): string {
  return (u ?? "").toString().trim().toLowerCase();
}

export function validateUsername(u: string): string | null {
  if (!/^[a-z0-9ก-๙._-]{2,32}$/.test(u)) return "ชื่อผู้ใช้ต้องยาว 2-32 ตัว ใช้ตัวอักษร ตัวเลข . _ - ได้";
  return null;
}

async function token(env: Env): Promise<string> {
  return getGoogleAccessToken(env.GOOGLE_CLIENT_EMAIL, env.GOOGLE_PRIVATE_KEY);
}

async function sheetTitles(env: Env, t: string): Promise<string[]> {
  const res = await fetch(`${SHEETS_API}/${env.SPREADSHEET_ID}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!res.ok) throw new Error(`Cannot inspect spreadsheet: ${await res.text()}`);
  const meta: any = await res.json();
  return (meta.sheets || []).map((s: any) => s.properties.title);
}

async function putValues(env: Env, t: string, range: string, values: any[][]): Promise<void> {
  const res = await fetch(
    `${SHEETS_API}/${env.SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    }
  );
  if (!res.ok) throw new Error(`Cannot write ${range}: ${await res.text()}`);
}

export async function readAdmins(env: Env, t?: string): Promise<AdminRecord[]> {
  const tk = t || (await token(env));
  if (!(await sheetTitles(env, tk)).includes(ADMINS_TAB)) return [];
  const res = await fetch(`${SHEETS_API}/${env.SPREADSHEET_ID}/values/${encodeURIComponent(`${ADMINS_TAB}!A2:G`)}`, {
    headers: { Authorization: `Bearer ${tk}` },
  });
  if (!res.ok) throw new Error(`Cannot read ${ADMINS_TAB}: ${await res.text()}`);
  const data: any = await res.json();
  const rows: any[][] = data.values || [];
  const out: AdminRecord[] = [];
  rows.forEach((r, i) => {
    const username = normalizeUsername(r[0]);
    if (!username || !r[1]) return;
    out.push({
      row: i + 2,
      username,
      hash: String(r[1]),
      salt: String(r[2] || ""),
      iterations: parseInt(r[3], 10) || PBKDF2_ITERATIONS,
      updatedAt: String(r[4] || ""),
      failed: parseInt(r[5], 10) || 0,
      lockedUntil: parseInt(r[6], 10) || 0,
    });
  });
  return out;
}

export function summarize(admins: AdminRecord[]): AdminSummary[] {
  const now = Math.floor(Date.now() / 1000);
  return admins.map((a) => ({ username: a.username, updatedAt: a.updatedAt, locked: a.lockedUntil > now }));
}

async function ensureTab(env: Env, t: string): Promise<void> {
  if ((await sheetTitles(env, t)).includes(ADMINS_TAB)) return;
  const res = await fetch(`${SHEETS_API}/${env.SPREADSHEET_ID}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: ADMINS_TAB } } }] }),
  });
  if (!res.ok) throw new Error(`Cannot create ${ADMINS_TAB} tab: ${await res.text()}`);
  await putValues(env, t, `${ADMINS_TAB}!A1:G1`, [HEADERS]);
}

/** สร้างบัญชีใหม่หรือเปลี่ยนรหัสผ่าน (ปลดล็อกและล้างจำนวนครั้งที่ผิดด้วย) */
export async function setAdminPassword(usernameRaw: string, password: string, env: Env): Promise<AdminRecord> {
  const username = normalizeUsername(usernameRaw);
  const err = validateUsername(username);
  if (err) throw new Error(err);
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);
  }
  if (password.length > 200) throw new Error("รหัสผ่านยาวเกินไป");

  const t = await token(env);
  await ensureTab(env, t);
  const admins = await readAdmins(env, t);
  const existing = admins.find((a) => a.username === username);
  const row = existing ? existing.row : Math.max(1, ...admins.map((a) => a.row)) + 1;

  const salt = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  const updatedAt = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ");
  await putValues(env, t, `${ADMINS_TAB}!A${row}:G${row}`, [[username, hash, salt, PBKDF2_ITERATIONS, updatedAt, 0, 0]]);
  return { row, username, hash, salt, iterations: PBKDF2_ITERATIONS, updatedAt, failed: 0, lockedUntil: 0 };
}

export async function deleteAdmin(usernameRaw: string, env: Env): Promise<boolean> {
  const username = normalizeUsername(usernameRaw);
  const t = await token(env);
  const admins = await readAdmins(env, t);
  const target = admins.find((a) => a.username === username);
  if (!target) return false;
  // ล้างแถว (ไม่ลบแถวทิ้ง เพื่อไม่ต้องหา sheetId และไม่กระทบลำดับแถวอื่น)
  await putValues(env, t, `${ADMINS_TAB}!A${target.row}:G${target.row}`, [["", "", "", "", "", "", ""]]);
  return true;
}

export type LoginResult =
  | { ok: true; admin: AdminRecord }
  | { ok: false; reason: "invalid" | "locked"; lockedUntil?: number };

export async function verifyAdminLogin(usernameRaw: string, password: string, env: Env): Promise<LoginResult> {
  const username = normalizeUsername(usernameRaw);
  const t = await token(env);
  const admins = await readAdmins(env, t);
  const admin = admins.find((a) => a.username === username);
  const now = Math.floor(Date.now() / 1000);

  if (!admin) {
    // คำนวณ hash หลอกเพื่อให้เวลาตอบใกล้เคียงกรณีมีบัญชี (ไม่บอกว่าชื่อผู้ใช้มีอยู่หรือไม่)
    await pbkdf2(password || "x", "no-such-user-salt", PBKDF2_ITERATIONS);
    return { ok: false, reason: "invalid" };
  }
  if (admin.lockedUntil > now) return { ok: false, reason: "locked", lockedUntil: admin.lockedUntil };

  const candidate = await pbkdf2(password || "", admin.salt, admin.iterations);
  if (constantTimeEqual(candidate, admin.hash)) {
    if (admin.failed || admin.lockedUntil) {
      await putValues(env, t, `${ADMINS_TAB}!F${admin.row}:G${admin.row}`, [[0, 0]]);
    }
    return { ok: true, admin };
  }

  const failed = admin.failed + 1;
  const lockedUntil = failed >= MAX_FAILED ? now + LOCK_SEC : 0;
  await putValues(env, t, `${ADMINS_TAB}!F${admin.row}:G${admin.row}`, [[lockedUntil ? 0 : failed, lockedUntil]]);
  return lockedUntil ? { ok: false, reason: "locked", lockedUntil } : { ok: false, reason: "invalid" };
}
