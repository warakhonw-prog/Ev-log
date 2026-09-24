import { Env } from "./types";
import { AdminRecord, passwordVersion, readAdmins } from "./admins";

// Auth แบบเบาสำหรับโปรเจกต์ส่วนตัว (DASHBOARD_TOKEN เป็นกุญแจหลัก)
// - สคริปต์/เครื่องมือ: ส่ง "Authorization: Bearer <DASHBOARD_TOKEN>"
// - เบราว์เซอร์: login ที่ /login ด้วยบัญชีแอดมิน (แท็บ Admins) หรือ token แล้วได้ cookie HttpOnly ที่เซ็นด้วย HMAC-SHA256
//   cookie แบบ token: "<exp>.<sig>" · แบบบัญชี: "<exp>.<username b64url>.<รุ่นรหัสผ่าน>.<sig>"
// เปลี่ยน DASHBOARD_TOKEN = session เดิมทั้งหมดใช้ไม่ได้ทันที · เปลี่ยนรหัสของบัญชีใด = session ของบัญชีนั้นใช้ไม่ได้

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

function encodeUser(u: string): string {
  return toBase64Url(encoder.encode(u).buffer as ArrayBuffer);
}

function decodeUser(b64: string): string | null {
  try {
    const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

async function signSession(exp: number, env: Env, user?: { username: string; ver: string }): Promise<string> {
  const msg = user ? `evlog-session:${exp}:${user.username}:${user.ver}` : `evlog-session:${exp}`;
  return hmac(env.DASHBOARD_TOKEN!, msg);
}

type Session = { kind: "token" } | { kind: "user"; username: string; ver: string };

/** ตรวจลายเซ็นและวันหมดอายุของ cookie (ยังไม่เช็กว่าบัญชียังอยู่ ดู resolveSession) */
async function readSessionCookie(request: Request, env: Env): Promise<Session | null> {
  const raw = getCookie(request, COOKIE_NAME);
  if (!raw) return null;
  const parts = raw.split(".");
  const exp = parseInt(parts[0], 10);
  if (!exp || exp < Math.floor(Date.now() / 1000)) return null;
  if (parts.length === 2) {
    return (await safeEqual(parts[1], await signSession(exp, env))) ? { kind: "token" } : null;
  }
  if (parts.length === 4) {
    const username = decodeUser(parts[1]);
    const ver = parts[2];
    if (!username || !ver) return null;
    return (await safeEqual(parts[3], await signSession(exp, env, { username, ver }))) ? { kind: "user", username, ver } : null;
  }
  return null;
}

/** session ที่ยังใช้ได้จริง: บัญชีต้องยังอยู่ในแท็บ Admins และรุ่นรหัสผ่านตรงกัน */
async function resolveSession(request: Request, env: Env): Promise<Session | null> {
  const session = await readSessionCookie(request, env);
  if (!session || session.kind === "token") return session;
  try {
    const admin = (await readAdmins(env)).find((a) => a.username === session.username);
    return admin && passwordVersion(admin) === session.ver ? session : null;
  } catch (e) {
    console.error("resolveSession: cannot read Admins:", e);
    return null;
  }
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

  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  return (await resolveSession(request, env)) !== null;
}

/** ผู้ที่ login อยู่: ชื่อบัญชี, "token" (login ด้วย DASHBOARD_TOKEN) หรือ null */
export async function currentUser(request: Request, env: Env): Promise<string | null> {
  if (!isAuthConfigured(env)) return null;
  const m = (request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (m) return (await checkToken(m[1].trim(), env)) ? "token" : null;
  const session = await resolveSession(request, env);
  return session ? (session.kind === "user" ? session.username : "token") : null;
}

export async function buildSessionCookie(env: Env, admin?: AdminRecord): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const value = admin
    ? `${exp}.${encodeUser(admin.username)}.${passwordVersion(admin)}.${await signSession(exp, env, { username: admin.username, ver: passwordVersion(admin) })}`
    : `${exp}.${await signSession(exp, env)}`;
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
    input[type=password], input[type=text] { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f8fafc; font-size: 15px; }
    button { margin-top: 16px; width: 100%; padding: 10px; border: 0; border-radius: 8px; background: #0284c7; color: #fff; font-weight: bold; font-size: 15px; cursor: pointer; }
    .err { background: #7f1d1d; color: #fecaca; padding: 8px 10px; border-radius: 6px; font-size: 13px; margin-bottom: 14px; }
    .hint { font-size: 12px; color: #94a3b8; margin: 6px 0 14px; }
  </style>
</head>
<body>
  <form method="POST" action="/login">
    <h2>⚡ EV Log</h2>
    <p>ต้องเข้าสู่ระบบก่อนเพิ่ม แก้ไข หรือลบข้อมูล</p>
    ${error ? `<div class="err">${escapeHtml(error)}</div>` : ""}
    <label for="username">ชื่อผู้ใช้</label>
    <input id="username" name="username" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" autofocus>
    <div class="hint">เว้นว่างถ้าจะเข้าด้วย Dashboard token (ใช้ตั้งบัญชีครั้งแรกหรือกู้คืนเมื่อลืมรหัส)</div>
    <label for="token">รหัสผ่าน</label>
    <input id="token" name="token" type="password" autocomplete="current-password" required>
    <input type="hidden" name="next" value="${escapeHtml(next)}">
    <button type="submit">เข้าสู่ระบบ</button>
  </form>
</body>
</html>`;
}
