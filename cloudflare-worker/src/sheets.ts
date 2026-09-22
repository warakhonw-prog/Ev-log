import { Env, TripRecord, ChargingRecord } from "./types";

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

/**
 * สร้าง Google OAuth2 Access Token โดยใช้ Service Account RSA Private Key
 */
export async function getGoogleAccessToken(
  clientEmail: string,
  privateKeyPem: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive",
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

interface TargetSheetInfo {
  title: string;
  sheetId: number;
  hasIdColumn: boolean;
}

/**
 * ตรวจสอบชื่อแท็บและโครงสร้างคอลัมน์ของ Google Sheet อัตโนมัติ
 */
async function inspectTargetSheet(
  spreadsheetId: string,
  preferredName: "Trips" | "Charging",
  accessToken: string
): Promise<TargetSheetInfo> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!metaRes.ok) {
    const err = await metaRes.text();
    throw new Error(`Cannot inspect spreadsheet: ${err}`);
  }

  const meta: any = await metaRes.json();
  const sheets: any[] = meta.sheets || [];

  // ค้นหาแท็บตามชื่อที่ต้องการ ถ้าไม่พบให้ใช้แท็บแรกสุด (Sheet1 / แผ่นงานเดิม)
  const matched = sheets.find((s) => s.properties?.title === preferredName);
  const targetSheet = matched || sheets[0];
  const title = targetSheet.properties.title;
  const sheetId = targetSheet.properties.sheetId ?? 0;

  // ตรวจสอบหัวตารางช่อง A1 ว่ามีคอลัมน์ ID หรือเริ่มด้วย Date
  let hasIdColumn = false;
  try {
    const headerRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        title + "!A1:B1"
      )}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (headerRes.ok) {
      const hData: any = await headerRes.json();
      const firstCell = (hData.values?.[0]?.[0] || "").toString().toLowerCase();
      if (firstCell.includes("id")) {
        hasIdColumn = true;
      }
    }
  } catch (e) {
    console.warn("Could not check header row:", e);
  }

  return { title, sheetId, hasIdColumn };
}

/**
 * บันทึกข้อมูล Trip อัตโนมัติ (ปรับให้ตรงกับโครงสร้างตารางเดิมของผู้ใช้)
 */
export async function appendTripToGoogleSheet(
  record: TripRecord,
  env: Env
): Promise<any> {
  const accessToken = await getGoogleAccessToken(
    env.GOOGLE_CLIENT_EMAIL,
    env.GOOGLE_PRIVATE_KEY
  );

  const { title, hasIdColumn } = await inspectTargetSheet(
    env.SPREADSHEET_ID,
    "Trips",
    accessToken
  );

  // ปรับแถวข้อมูลตามว่าชีทมีคอลัมน์ ID นำหน้าหรือไม่
  const rowValues = hasIdColumn
    ? [
        record.trip_id,
        record.date,
        record.time,
        record.odo_start,
        record.odo_end,
        record.distance_km,
        record.duration_min,
        record.avg_consumption,
        record.soc_start,
        record.soc_end,
        record.energy_kwh,
        record.cost_net_thb,
        record.cost_grid_thb,
        record.note,
      ]
    : [
        record.date,
        record.time,
        record.odo_start,
        record.odo_end,
        record.distance_km,
        record.duration_min,
        record.avg_consumption,
        record.soc_start,
        record.soc_end,
        record.energy_kwh,
        record.cost_net_thb,
        record.cost_grid_thb,
        record.note,
      ];

  const range = `${title}!A:A`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const sheetRes = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [rowValues] }),
  });

  if (!sheetRes.ok) {
    const errorText = await sheetRes.text();
    console.error(`Google Sheets API Error: ${errorText}`);
    throw new Error(`Google Sheets Append Failed: ${errorText}`);
  }

  return { result: await sheetRes.json(), sheetName: title };
}

/**
 * บันทึกข้อมูล Charging อัตโนมัติ (ปรับให้ตรงกับโครงสร้างตารางเดิมของผู้ใช้)
 */
export async function appendChargingToGoogleSheet(
  record: ChargingRecord,
  env: Env
): Promise<any> {
  const accessToken = await getGoogleAccessToken(
    env.GOOGLE_CLIENT_EMAIL,
    env.GOOGLE_PRIVATE_KEY
  );

  const { title, hasIdColumn } = await inspectTargetSheet(
    env.SPREADSHEET_ID,
    "Charging",
    accessToken
  );

  // ถ้าเป็นชีทรวมแบบของเดิม (มีคอลัมน์เหมือน Trips: A=Date, B=Time, C=Odo_Start, D=Odo_End, E=Distance, F=Duration, G=Avg_Cons, H=SoC_Start, I=SoC_End, J=Energy, K=Cost_Net, L=Cost_Grid, M=Note)
  const isCombinedSheet = !hasIdColumn;
  let lastOdo: number | "" = "";
  if (isCombinedSheet) {
    try {
      const lastRowRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/${encodeURIComponent(
          title + "!C:D"
        )}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (lastRowRes.ok) {
        const d: any = await lastRowRes.json();
        const rows: any[][] = d.values || [];
        for (let i = rows.length - 1; i >= 1; i--) {
          const odoEndVal = rows[i]?.[1] || rows[i]?.[0];
          if (odoEndVal) {
            const num = parseFloat(odoEndVal.toString().replace(/,/g, ""));
            if (!isNaN(num) && num > 0) {
              lastOdo = num;
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to fetch last odometer reading:", e);
    }
  }

  const rowValues = isCombinedSheet
    ? [
        record.start_datetime.split(" ")[0] || "",
        record.start_datetime.split(" ")[1] || "",
        lastOdo, // odo_start
        lastOdo, // odo_end
        0, // distance_km
        record.duration_min, // duration_min
        0, // avg_consumption
        record.soc_start,
        record.soc_end,
        record.net_kwh,
        record.cost_net_thb,
        record.cost_grid_thb,
        record.note,
      ]
    : hasIdColumn
    ? [
        record.charge_id,
        record.start_datetime,
        record.end_datetime,
        record.soc_start,
        record.soc_end,
        record.net_kwh,
        record.grid_kwh,
        record.cost_net_thb,
        record.cost_grid_thb,
        record.location,
      ]
    : [
        record.start_datetime,
        record.end_datetime,
        record.soc_start,
        record.soc_end,
        record.net_kwh,
        record.grid_kwh,
        record.cost_net_thb,
        record.cost_grid_thb,
        record.location,
      ];

  const range = `${title}!A:A`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const sheetRes = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [rowValues] }),
  });

  if (!sheetRes.ok) {
    const errorText = await sheetRes.text();
    console.error(`Google Sheets API Error: ${errorText}`);
    throw new Error(`Google Sheets Append Failed: ${errorText}`);
  }

  return { result: await sheetRes.json(), sheetName: title };
}

/**
 * อัปเดตแถวข้อมูลใน Google Sheets ตามหมายเลขแถว (1-indexed เช่น A2:M2)
 */
export async function updateSheetRow(
  rowIndex: number,
  rowValues: any[],
  env: Env
): Promise<any> {
  if (!rowIndex || rowIndex < 2) {
    throw new Error("Invalid rowIndex: cannot update header or non-positive row");
  }
  const accessToken = await getGoogleAccessToken(
    env.GOOGLE_CLIENT_EMAIL,
    env.GOOGLE_PRIVATE_KEY
  );
  const { title } = await inspectTargetSheet(env.SPREADSHEET_ID, "Trips", accessToken);

  const range = `${title}!A${rowIndex}:M${rowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [rowValues] }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Google Sheets API Update Error: ${errorText}`);
    throw new Error(`Google Sheets Update Failed: ${errorText}`);
  }

  return await res.json();
}

/**
 * ลบแถวข้อมูลออกจาก Google Sheets ตามหมายเลขแถว (1-indexed)
 */
export async function deleteSheetRow(
  rowIndex: number,
  env: Env
): Promise<any> {
  if (!rowIndex || rowIndex < 2) {
    throw new Error("Invalid rowIndex: cannot delete header or non-positive row");
  }
  const accessToken = await getGoogleAccessToken(
    env.GOOGLE_CLIENT_EMAIL,
    env.GOOGLE_PRIVATE_KEY
  );
  const { sheetId } = await inspectTargetSheet(env.SPREADSHEET_ID, "Trips", accessToken);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}:batchUpdate`;
  const body = {
    requests: [
      {
        deleteDimension: {
          range: {
            sheetId: sheetId,
            dimension: "ROWS",
            startIndex: rowIndex - 1, // 0-indexed, inclusive
            endIndex: rowIndex,       // 0-indexed, exclusive
          },
        },
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Google Sheets API Delete Error: ${errorText}`);
    throw new Error(`Google Sheets Delete Failed: ${errorText}`);
  }

  return await res.json();
}

/**
 * เพิ่มแถวข้อมูลดิบ A:M เข้า Google Sheet
 */
export async function appendRawRowToGoogleSheet(
  rowValues: any[],
  env: Env
): Promise<any> {
  const accessToken = await getGoogleAccessToken(
    env.GOOGLE_CLIENT_EMAIL,
    env.GOOGLE_PRIVATE_KEY
  );
  const { title } = await inspectTargetSheet(env.SPREADSHEET_ID, "Trips", accessToken);

  const range = `${title}!A:A`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [rowValues] }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Google Sheets API Append Error: ${errorText}`);
    throw new Error(`Google Sheets Append Failed: ${errorText}`);
  }

  return await res.json();
}

