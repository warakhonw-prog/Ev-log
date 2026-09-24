/**
 * ผู้ช่วยตอบคำถาม (Ask EV Log): ตอบจากข้อมูลในชีตเป็นหลัก และค้นเว็บผ่าน Gemini Google Search เมื่อจำเป็น
 * ใช้ได้ทั้ง LINE (เฉพาะบัญชีที่อนุญาต) และ Dashboard (POST /api/ask ต้อง login)
 */

import { Env } from "./types";
import { DashboardPayload } from "./dashboardData";
import { isDcCharge } from "./battery";

export interface AskTurn {
  role: "user" | "model";
  text: string;
}

export interface AskSource {
  title: string;
  uri: string;
}

export interface AskResult {
  answer: string;
  sources: AskSource[];
  model: string;
}

const CANDIDATE_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"];
// จำนวนแถวล่าสุดที่ส่งให้โมเดล (กันบริบทยาวเกินเมื่อข้อมูลสะสมหลายปี)
const MAX_ROWS = 400;
const MAX_HISTORY_TURNS = 8;
const MAX_QUESTION_CHARS = 1000;

function nowBangkok(): string {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  return `${d.toISOString().slice(0, 16).replace("T", " ")} (วัน${days[d.getUTCDay()]}) เวลาประเทศไทย`;
}

function csvCell(v: any): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** สรุปข้อมูลชีตเป็นข้อความกระชับสำหรับโมเดล */
export function buildDataContext(payload: DashboardPayload): string {
  const data = payload.data;
  if (!data) return "ไม่มีข้อมูลในชีต";
  const meta = data.meta;
  const rows = data.rows.slice(-MAX_ROWS);
  const vehicles = meta.vehicles || [];

  const lines: string[] = [];
  lines.push(`อัตราค่าไฟบ้านปกติ: ${meta.rate} บาท/kWh`);
  lines.push(
    `รถ: ${vehicles.map((v) => `${v.id}=${v.name}${v.plate ? ` (${v.plate})` : ""} แบต ${v.batteryKwh} kWh${v.isDefault ? " [คันหลัก]" : ""}`).join("; ") || "-"}`
  );
  lines.push(`ช่วงข้อมูล: ${meta.from} ถึง ${meta.to} (${data.rows.length} แถว${data.rows.length > rows.length ? `, ส่งเฉพาะ ${rows.length} แถวล่าสุด` : ""})`);

  // สรุปรายเดือน (คำนวณให้ก่อน เพื่อให้ตัวเลขรวมแม่นยำกว่าการให้โมเดลบวกเอง)
  const months: Record<string, { km: number; tripKwh: number; trips: number; charges: number; chargeKwh: number; chargeThb: number; dcThb: number; bizKm: number }> = {};
  for (const r of data.rows) {
    const m = (r.iso || "").slice(0, 7);
    if (!m) continue;
    const t = (months[m] ||= { km: 0, tripKwh: 0, trips: 0, charges: 0, chargeKwh: 0, chargeThb: 0, dcThb: 0, bizKm: 0 });
    if (r.kind === "trip") {
      t.trips++;
      t.km += r.km || 0;
      t.tripKwh += r.kwh || 0;
      if (r.purpose === "business") t.bizKm += r.km || 0;
    } else {
      t.charges++;
      t.chargeKwh += r.kwh || 0;
      t.chargeThb += r.net || 0;
      if (isDcCharge(r)) t.dcThb += r.net || 0;
    }
  }
  lines.push("");
  lines.push("สรุปรายเดือน (ทุกคัน): month,trips,km,trip_kWh,business_km,charges,charge_kWh,charge_THB,dc_THB");
  for (const m of Object.keys(months).sort()) {
    const t = months[m];
    lines.push([m, t.trips, t.km.toFixed(1), t.tripKwh.toFixed(2), t.bizKm.toFixed(1), t.charges, t.chargeKwh.toFixed(2), t.chargeThb.toFixed(2), t.dcThb.toFixed(2)].join(","));
  }

  // สุขภาพแบต (ย่อ)
  const byVehicle = data.batteryByVehicle || {};
  for (const [vid, b] of Object.entries(byVehicle)) {
    lines.push("");
    lines.push(
      `สุขภาพแบต ${vid}: ความจุใช้งานจริงประเมิน ${b.capacity.estimateKwh ?? "-"} ±${b.capacity.uncertaintyKwh ?? "-"} kWh ` +
        `(ความเชื่อมั่น ${b.capacity.confidence}), ตรวจสอบไขว้จากการชาร์จ ${b.capacity.charge.medianKwh ?? "-"} kWh, EFC ${b.cycles.efc} รอบ, ` +
        `อัตรากินไฟเฉลี่ย ${b.range.baselineWhKm ?? "-"} Wh/km, % แบตล่าสุด ${b.range.currentSoc ?? "-"}%`
    );
    lines.push(
      `ระยะทางคาดการณ์ ${vid} (90→10%): ${b.range.scenarios.map((s) => `${s.label} ${s.dailyKm} km (${s.whKm} Wh/km)`).join("; ")}`
    );
    lines.push(`ชาร์จ DC ${vid}: เฉลี่ย ${b.dcProfile.avgKw ?? "-"} kW, สูงสุด ${b.dcProfile.maxKw ?? "-"} kW, ราคาเฉลี่ย ${b.dcProfile.avgThbPerKwh ?? "-"} บาท/kWh`);
  }
  if (data.tou) {
    const t = data.tou.totals;
    lines.push("");
    lines.push(`ชาร์จบ้าน (AC) ${data.tou.spanDays} วัน: ${t.kwh} kWh, ช่วง On-Peak ${t.onPeakKwh} kWh, Off-Peak ${t.offPeakKwh} kWh (ที่บ้านยังไม่มีมิเตอร์ TOU)`);
  }

  lines.push("");
  lines.push("รายการ (kind=trip คือการเดินทาง, charge คือการชาร์จ; cons = kWh/100km ถ้า ≤ 50 หรือ Wh/km ถ้า > 50; kwh ของ trip = พลังงานที่ใช้, ของ charge = พลังงานที่ชาร์จ; thb = ค่าไฟ):");
  lines.push("date,time,kind,vehicle,driver,purpose,odo_start,odo_end,km,min,cons,soc_start,soc_end,kwh,thb,note");
  for (const r of rows) {
    lines.push(
      [r.iso, r.time, r.kind, r.vehicle, r.driver, r.purpose, r.odoStart || "", r.odoEnd || "", r.km || "", r.min || "", r.cons || "", r.s0 || "", r.s1 || "", r.kwh || "", r.net || "", (r.note || "").replace(/\[Drive\]/g, "").trim()]
        .map(csvCell)
        .join(",")
    );
  }
  return lines.join("\n");
}

function systemPrompt(context: string, channel: "line" | "web"): string {
  return [
    "คุณคือผู้ช่วยของระบบ EV Log Hub สำหรับบันทึกการเดินทางและการชาร์จรถยนต์ไฟฟ้า (หลักคือ XPENG G6 Standard Range แบต LFP) ของผู้ใช้ในประเทศไทย",
    `เวลาปัจจุบัน: ${nowBangkok()}`,
    "",
    "กติกา:",
    "1. คำถามเกี่ยวกับการเดินทาง การชาร์จ ค่าใช้จ่าย แบตเตอรี่ หรือรถของผู้ใช้ ให้ตอบจาก \"ข้อมูลของผู้ใช้\" ด้านล่างเท่านั้น ห้ามเดาตัวเลข ถ้าข้อมูลไม่พอให้บอกตรงๆ ว่าไม่มีข้อมูล",
    "2. ตัวเลขรวมรายเดือนให้ใช้ตาราง \"สรุปรายเดือน\" ก่อน ถ้าต้องคำนวณเองให้คำนวณจากรายการอย่างระมัดระวัง และบอกช่วงวันที่ที่ใช้",
    "3. คำถามเรื่องภายนอก (ราคาค่าไฟ/ค่า Ft ปัจจุบัน, สถานีชาร์จ, สเปกรถ, ข่าว) ให้ค้นเว็บด้วย Google Search และบอกว่าเป็นข้อมูลจากเว็บ",
    "4. ตอบเป็นภาษาไทย กระชับ ตรงคำถาม ใส่หน่วย (km, kWh, บาท) และปัดทศนิยมให้อ่านง่าย",
    channel === "line"
      ? "5. ตอบเป็นข้อความธรรมดาสำหรับแชท LINE ห้ามใช้ markdown (ไม่มี **, #, ตาราง) ใช้การขึ้นบรรทัดใหม่และขีด - แทน ความยาวไม่เกินประมาณ 1,200 ตัวอักษร"
      : "5. ตอบเป็นข้อความธรรมดา ใช้การขึ้นบรรทัดใหม่และขีด - สำหรับรายการ ไม่ใช้ markdown ตาราง",
    "6. ถ้าคำถามไม่เกี่ยวกับรถ EV หรือข้อมูลของผู้ใช้ ตอบสั้นๆ ได้ตามปกติ",
    "",
    "=== ข้อมูลของผู้ใช้ ===",
    context,
    "=== จบข้อมูล ===",
  ].join("\n");
}

async function callGemini(body: any, env: Env): Promise<{ data: any; model: string }> {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  const models = Array.from(new Set([env.GEMINI_MODEL, ...CANDIDATE_MODELS].filter((m): m is string => Boolean(m))));
  let lastError = "";
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) return { data: await res.json(), model };
      lastError = `${model} ${res.status}: ${(await res.text()).slice(0, 300)}`;
      // 401/403 = API key ผิดหรือไม่มีสิทธิ์ ลองรุ่นอื่นก็ไม่ช่วย (400 อาจเป็นรุ่นที่ไม่รองรับ google_search จึงลองต่อ)
      if (res.status === 401 || res.status === 403) break;
    } catch (e: any) {
      lastError = `${model}: ${e?.message || e}`;
    }
  }
  throw new Error(`Gemini ไม่ตอบ: ${lastError}`);
}

export async function askEvAssistant(
  question: string,
  payload: DashboardPayload,
  env: Env,
  opts: { channel: "line" | "web"; history?: AskTurn[] }
): Promise<AskResult> {
  const q = question.trim().slice(0, MAX_QUESTION_CHARS);
  if (!q) throw new Error("คำถามว่าง");

  const history = (opts.history || [])
    .filter((t) => (t.role === "user" || t.role === "model") && typeof t.text === "string" && t.text.trim())
    .slice(-MAX_HISTORY_TURNS)
    .map((t) => ({ role: t.role, parts: [{ text: t.text.slice(0, 4000) }] }));

  const { data, model } = await callGemini(
    {
      systemInstruction: { parts: [{ text: systemPrompt(buildDataContext(payload), opts.channel) }] },
      contents: [...history, { role: "user", parts: [{ text: q }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.3 },
    },
    env
  );

  const cand = data?.candidates?.[0];
  const answer = (cand?.content?.parts || [])
    .map((p: any) => p.text || "")
    .join("")
    .trim();
  if (!answer) throw new Error(`Gemini ไม่มีคำตอบ (${cand?.finishReason || "unknown"})`);

  const seen = new Set<string>();
  const sources: AskSource[] = [];
  for (const chunk of cand?.groundingMetadata?.groundingChunks || []) {
    const uri = chunk?.web?.uri;
    if (!uri || seen.has(uri) || !/^https?:\/\//.test(uri)) continue;
    seen.add(uri);
    sources.push({ title: (chunk.web.title || uri).toString(), uri });
    if (sources.length >= 5) break;
  }
  return { answer, sources, model };
}

/** บัญชี LINE ที่อนุญาตให้ถามข้อมูล: LINE_ALLOWED_USER_IDS (คั่นด้วย ,) และ LINE_USER_ID */
export function isLineUserAllowed(userId: string | undefined, env: Env): boolean {
  if (!userId) return false;
  const allowed = [env.LINE_ALLOWED_USER_IDS || "", env.LINE_USER_ID || ""]
    .join(",")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(userId);
}

export function formatAnswerForLine(result: AskResult): string {
  let text = result.answer;
  if (result.sources.length) {
    text += "\n\nแหล่งข้อมูลจากเว็บ:\n" + result.sources.map((s) => `- ${s.title}\n  ${s.uri}`).join("\n");
  }
  // LINE จำกัดข้อความละ 5,000 ตัวอักษร
  return text.length > 4900 ? text.slice(0, 4890) + "…" : text;
}
