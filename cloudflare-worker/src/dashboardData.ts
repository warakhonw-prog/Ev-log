import { Env } from "./types";

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\\n/g, "")
    .replace(/\s+/g, "");

  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function getGoogleAccessToken(
  clientEmail: string,
  privateKeyPem: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const keyBuffer = pemToArrayBuffer(privateKeyPem);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(dataToSign)
  );

  const encodedSignature = arrayBufferToBase64Url(signatureBuffer);
  const jwt = `${dataToSign}.${encodedSignature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error(`Google OAuth2 Error: ${err}`);
    throw new Error(`Failed to obtain Google access token: ${err}`);
  }

  const tokenData: any = await tokenRes.json();
  return tokenData.access_token;
}

export interface DashboardPayload {
  ok: boolean;
  data?: {
    rows: any[];
    meta: {
      vehicle: string;
      odoStart: number | null;
      odoEnd: number | null;
      rate: number;
      batteryCapacity?: number;
      from: string;
      to: string;
      fetched: string;
      sheetUrl: string;
      sheetTitle?: string;
      sheetId?: number;
    };
  };
  error?: string;
}

function parseNum(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  const s = val.toString().replace(/,/g, "").trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parsePct(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  const s = val.toString().replace(/%/g, "").trim();
  let n = parseFloat(s);
  if (isNaN(n)) return 0;
  // If stored as 0.39 in Sheets unformatted
  if (n > 0 && n <= 1.0 && val.toString().includes(".")) {
    n = n * 100;
  }
  // If Sheets percentage format multiplied pure number 39 -> 3900%
  if (n > 100 && n <= 10000) {
    n = n / 100;
  }
  return Math.round(n);
}

function normDate(val: any): string {
  if (!val) return "";
  const s = val.toString().trim();
  // If format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // If DD/MM/YYYY
  const parts = s.split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    } else {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }
  return s;
}

function normTime(val: any): string {
  if (!val) return "";
  const s = val.toString().trim();
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) {
    return `${m[1].padStart(2, "0")}:${m[2]}`;
  }
  return s;
}

export async function fetchDashboardDataFromSheets(env: Env): Promise<DashboardPayload> {
  try {
    const accessToken = await getGoogleAccessToken(
      env.GOOGLE_CLIENT_EMAIL,
      env.GOOGLE_PRIVATE_KEY
    );

    // ดึง metadata แผ่นงาน
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}?fields=sheets.properties`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!metaRes.ok) {
      throw new Error(`Cannot inspect spreadsheet: ${await metaRes.text()}`);
    }
    const metaJson: any = await metaRes.json();
    const sheetProps = metaJson.sheets?.[0]?.properties;
    const sheetTitle = sheetProps?.title || "Sheet1";
    const sheetId = sheetProps?.sheetId ?? 0;

    // ดึงข้อมูลแถวทั้งหมดจากคอลัมน์ A ถึง M
    const valuesRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/${encodeURIComponent(
        sheetTitle + "!A:M"
      )}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!valuesRes.ok) {
      throw new Error(`Cannot fetch spreadsheet values: ${await valuesRes.text()}`);
    }

    const valuesData: any = await valuesRes.json();
    const rawRows: any[][] = valuesData.values || [];

    if (rawRows.length <= 1) {
      return {
        ok: true,
        data: {
          rows: [],
          meta: {
            vehicle: "XPENG G6 STD",
            odoStart: null,
            odoEnd: null,
            rate: parseFloat(env.ELECTRICITY_RATE_THB || "4.90"),
            from: "",
            to: "",
            sheetTitle,
            sheetId,
            fetched: new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
            sheetUrl: `https://docs.google.com/spreadsheets/d/${env.SPREADSHEET_ID}/edit`,
          },
        },
      };
    }

    // Header อยู่ที่แถว 0:
    // A: Date, B: Time, C: Odo_Start, D: Odo_End, E: Distance_km, F: Duration_min, G: Avg_Consumption,
    // H: SoC_Start, I: SoC_End, J: Energy_kWh, K: Cost_Net_THB, L: Cost_Grid_THB, M: Note
    // (หากมี ID คอลัมน์แรก ค่าจะเยื้องไป 1 ช่อง ตรวจสอบ header)
    const headerRow = rawRows[0].map((h: any) => (h || "").toString().toLowerCase());
    const offset = headerRow[0].includes("id") ? 1 : 0;

    const rows: any[] = [];
    let odoMin: number | null = null;
    let odoMax: number | null = null;

    for (let i = 1; i < rawRows.length; i++) {
      const r = rawRows[i];
      if (!r || r.length === 0 || !r[offset]) continue;

      const dateStr = normDate(r[offset]);
      if (!dateStr) continue;

      const timeStr = normTime(r[offset + 1]);
      const odoS = parseNum(r[offset + 2]);
      const odoE = parseNum(r[offset + 3]);
      const km = parseNum(r[offset + 4]);
      const min = parseNum(r[offset + 5]);
      const cons = parseNum(r[offset + 6]);
      const s0 = parsePct(r[offset + 7]);
      const s1 = parsePct(r[offset + 8]);
      const kwh = parseNum(r[offset + 9]);
      const net = parseNum(r[offset + 10]);
      const grid = parseNum(r[offset + 11]);
      const note = (r[offset + 12] || "").toString().trim();

      if (odoS > 0) {
        if (odoMin === null || odoS < odoMin) odoMin = odoS;
      }
      if (odoE > 0) {
        if (odoMax === null || odoE > odoMax) odoMax = odoE;
      }

      // ตรวจสอบ kind ว่าเป็นการชาร์จหรือขับ
      const isCharge =
        km === 0 ||
        cons === 0 ||
        note.toLowerCase().includes("charg") ||
        note.includes("ชาร์จ");

      rows.push({
        sheetRowIndex: i + 1,
        iso: dateStr,
        time: timeStr,
        odoStart: odoS,
        odoEnd: odoE,
        kind: isCharge ? "charge" : "trip",
        span: "",
        km,
        min,
        cons,
        s0,
        s1,
        kwh,
        net,
        grid,
        note,
      });
    }

    // เรียงลำดับข้อมูลตามวันและเวลา (เก่าสุดไปใหม่สุด)
    rows.sort((a, b) => (a.iso + " " + (a.time || "00:00")).localeCompare(b.iso + " " + (b.time || "00:00")));

    const defaultRate = parseFloat(env.ELECTRICITY_RATE_THB || "4.90");
    const batteryCap = parseFloat(env.BATTERY_CAPACITY_KWH || "68.5");
    const fromDate = rows.length > 0 ? rows[0].iso : "";
    const toDate = rows.length > 0 ? rows[rows.length - 1].iso : "";

    // จัดรูปแบบเวลาที่ fetch (เช่น "10 Sep 2026 21:52")
    const nowBkk = new Date(Date.now() + 7 * 3600 * 1000);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const fetchedStr = `${nowBkk.getUTCDate()} ${months[nowBkk.getUTCMonth()]} ${nowBkk.getUTCFullYear()} ${String(nowBkk.getUTCHours()).padStart(2, "0")}:${String(nowBkk.getUTCMinutes()).padStart(2, "0")}`;

    return {
      ok: true,
      data: {
        rows,
        meta: {
          vehicle: "XPENG G6 STD",
          odoStart: odoMin,
          odoEnd: odoMax,
          rate: defaultRate,
          batteryCapacity: batteryCap,
          sheetTitle,
          sheetId,
          from: fromDate,
          to: toDate,
          fetched: fetchedStr,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${env.SPREADSHEET_ID}/edit`,
        },
      },
    };
  } catch (err: any) {
    console.error("fetchDashboardDataFromSheets error:", err);
    return {
      ok: false,
      error: err.message || String(err),
    };
  }
}
