import { Env } from "./types";

// Auth แบบเบาสำหรับโปรเจกต์ผู้ใช้คนเดียว: secret เดียว (DASHBOARD_TOKEN)
// - สคริปต์/เครื่องมือ: ส่ง "Authorization: Bearer <DASHBOARD_TOKEN>"
// - เบราว์เซอร์: login ที่ /login แล้วได้ cookie HttpOnly ที่เซ็นด้วย HMAC-SHA256 (Web Crypto)
// เปลี่ยน DASHBOARD_TOKEN = session เดิมทั้งหมดใช้ไม่ได้ทันที

const COOKIE_NAME = "evlog_session";
const SESSION_TTL_SEC = 30 * 24 * 60 * 60; // 30 วัน

const encoder = new TextEncoder();

function toBase64Url(buf: ArrayBuffer): string {
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

// เทียบแบบ constant-time โดย hash ทั้งสองฝั่งก่อน (ความยาวเท่ากันเสมอ ไม่รั่วความยาว)
async function safeEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  const x = new Uint8Array(da);
  const y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

export function isAuthConfigured(env: Env): boolean {
  return !!(env.DASHBOARD_TOKEN && env.DASHBOARD_TOKEN.length >= 16);
}

async function signSession(exp: number, env: Env): Promise<string> {
  return hmac(env.DASHBOARD_TOKEN!, `evlog-session:${exp}`);
}

async function hasValidSessionCookie(request: Request, env: Env): Promise<boolean> {
  const raw = getCookie(request, COOKIE_NAME);
  if (!raw) return false;
  const [expStr, sig] = raw.split(".");
  const exp = parseInt(expStr, 10);
  if (!exp || !sig || exp < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(sig, await signSession(exp, env));
}

export async function checkToken(candidate: string, env: Env): Promise<boolean> {
  if (!isAuthConfigured(env) || !candidate) return false;
  return safeEqual(candidate, env.DASHBOARD_TOKEN!);
}

/**
 * true เมื่อ request ยืนยันตัวตนได้
 * - Bearer token: ผ่านเลย (ไม่มี ambient credential จึงไม่เสี่ยง CSRF)
 * - Session cookie: ต้องไม่มี Origin จากเว็บอื่น (กัน CSRF ซ้อนกับ SameSite=Strict)
 */
export async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  if (!isAuthConfigured(env)) return false;

  const authHeader = request.headers.get("Authorization") || "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (m) return checkToken(m[1].trim(), env);

  if (!(await hasValidSessionCookie(request, env))) return false;
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  return true;
}

export async function buildSessionCookie(env: Env): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const value = `${exp}.${await signSession(exp, env)}`;
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${SESSION_TTL_SEC}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

// รับเฉพาะ path ภายในเว็บเดียวกัน กัน open redirect
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function renderLoginHtml(next: string, error?: string): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>EV Log – เข้าสู่ระบบ</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0f172a; color: #f8fafc; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; }
    form { width: 100%; max-width: 360px; background: #1e293b; padding: 28px 24px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    h2 { margin: 0 0 6px; color: #38bdf8; font-size: 20px; }
    p { margin: 0 0 18px; color: #94a3b8; font-size: 13px; }
    label { display: block; font-size: 13px; margin-bottom: 6px; color: #cbd5e1; }
    input[type=password] { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f8fafc; font-size: 15px; }
    button { margin-top: 16px; width: 100%; padding: 10px; border: 0; border-radius: 8px; background: #0284c7; color: #fff; font-weight: bold; font-size: 15px; cursor: pointer; }
    .err { background: #7f1d1d; color: #fecaca; padding: 8px 10px; border-radius: 6px; font-size: 13px; margin-bottom: 14px; }
  </style>
</head>
<body>
  <form method="POST" action="/login">
    <h2>⚡ EV Log</h2>
    <p>ต้องเข้าสู่ระบบก่อนเพิ่ม แก้ไข หรือลบข้อมูล</p>
    ${error ? `<div class="err">${escapeHtml(error)}</div>` : ""}
    <label for="token">Dashboard token</label>
    <input id="token" name="token" type="password" autocomplete="current-password" required autofocus>
    <input type="hidden" name="next" value="${escapeHtml(next)}">
    <button type="submit">เข้าสู่ระบบ</button>
  </form>
</body>
</html>`;
}
