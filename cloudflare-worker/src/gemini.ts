import {
  TripExtractionResult,
  ChargingExtractionResult,
  Env,
} from "./types";

export interface UnifiedExtractionResponse {
  type: "trip" | "charging" | "unknown";
  trip_data?: TripExtractionResult;
  charging_data?: ChargingExtractionResult;
  confidence: number;
}

/**
 * ดึงรายชื่อโมเดลที่ใช้ได้จริงสำหรับ API Key นี้
 */
async function fetchSupportedModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m: any) => m.name.replace(/^models\//, ""));
  } catch (e) {
    return [];
  }
}

/**
 * เรียกใช้ Gemini Vision REST API เพื่อจำแนกและสกัดข้อมูล (พร้อมระบบ Auto-Fallback สำหรับ Model Name)
 */
export async function analyzeEVImageWithGemini(
  imageBase64: string,
  env: Env,
  mimeType: string = "image/jpeg",
  // เวลาสิ้นสุด (epoch ms) ของการลองทุกโมเดล กัน waitUntil ของ Worker (~30 วินาที) ตัดงานทิ้งก่อนได้ตอบ LINE
  deadline: number = Date.now() + 25000
): Promise<UnifiedExtractionResponse> {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment");
  }

  // โมเดลที่ Google แนะนำสำหรับ API Key นี้ (gemini-3.6-flash, gemini-3.1-flash-lite)
  const candidateModels: string[] = [
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest",
  ].filter((m): m is string => Boolean(m));

  // กำจัดตัวซ้ำ
  const uniqueModels = Array.from(new Set(candidateModels));

  const prompt = `
You are an expert EV dashboard, trip computer, and EV charging telemetry & receipt extraction AI.
Analyze this screenshot or photo (which is one of:
1. EV digital instrument cluster or dashboard
2. Car center screen trip computer or energy screen
3. EV companion smartphone app (like XPENG app charging status)
4. EV charging station receipt, tax invoice, or charging history screen from mobile apps such as PEA Volta, PTT EV Station Pluz / blueplus+, Sharge, EleXA, EA Anywhere, MEA EV, Altervim, Evolt, etc.).

Tasks:
1. Identify the screen type: "trip", "charging", or "unknown".
   - If the image displays charging information, an EV charging receipt ("รายละเอียดใบเสร็จรับเงิน"), charging history ("ข้อมูลประวัติการชาร์จ"), charging progress, battery percentage charging, or station transaction summary, classify as "charging".
   - If the screen displays driving trip statistics, trip meters, odometer, or driving computer, classify as "trip".

2. If "trip":
   - "odo_start": Total accumulated mileage of car at start (km) or null
   - "odo_end": Total accumulated mileage of car at end (km) or null
   - "distance_km": Distance of this trip (km) or null
   - "duration_min": Elapsed driving duration converted to total integer minutes or null
   - "avg_consumption": Average energy consumption normalized to kWh/100km (number) or null. (If given in km/kWh, convert to kWh/100km = 100/val)
   - "soc_start": Battery State of Charge at start (0-100 or 0.0-1.0) or null
   - "soc_end": Battery State of Charge at end (0-100 or 0.0-1.0) or null
   - "note": Driving mode, trip title, or temperature if visible, else null

3. If "charging":
   - "start_datetime": Start date & time 'YYYY-MM-DD HH:MM:SS'. IMPORTANT for Thai dates: If year is Buddhist Era like '69' or '2569', convert to Christian Era '2026' (e.g. '21 ส.ค. 69' -> '2026-08-21', '30/7/2026, 11:36:27' -> '2026-07-30 11:36:27').
   - "end_datetime": End date & time 'YYYY-MM-DD HH:MM:SS' if visible, else null.
   - "time_str": Time string (e.g. '11:36', '17:27') or null.
   - "soc_start": Battery % before charging (0-100 or 0.0-1.0) or null.
   - "soc_end": Battery % after charging (0-100 or 0.0-1.0) or null.
   - "duration_min": Total charging duration in integer minutes. E.g. '00:32:09' -> 32, '00:15:43' -> 16, or calculate from end_time - start_time.
   - "range_added_km": Range added in km if shown, else null.
   - "current_range_km": Current range shown in km if shown, else null.
   - "energy_kwh": Total energy charged in kWh (e.g. '19.34 kWh' -> 19.34, '45.800 kWh' -> 45.8, '19.700 kWh' -> 19.7) or null.
   - "total_cost_thb": Total payment amount in THB including VAT (e.g. '฿152.78' -> 152.78, '฿361.82' -> 361.82, '฿155.63' -> 155.63) or null.
   - "unit_rate_thb": Unit rate per kWh in THB (e.g. '฿7.90' -> 7.90) or null.
   - "station_name": Name, provider, or location of charging station (e.g. 'ต.คลองใหญ่ อ.องครักษ์ จ.นครนายก', 'EV Station Pluz', 'PEA Ongkharak', etc.) or null.
   - "location": Descriptive location/charger string or null.

Return strictly a JSON object with this structure:
{
  "type": "trip" | "charging" | "unknown",
  "confidence": 0.0 to 1.0,
  "trip_data": {
    "odo_start": null,
    "odo_end": null,
    "distance_km": null,
    "duration_min": null,
    "avg_consumption": null,
    "soc_start": null,
    "soc_end": null,
    "note": null
  },
  "charging_data": {
    "start_datetime": null,
    "end_datetime": null,
    "time_str": null,
    "soc_start": null,
    "soc_end": null,
    "duration_min": null,
    "range_added_km": null,
    "current_range_km": null,
    "location": null,
    "energy_kwh": null,
    "total_cost_thb": null,
    "unit_rate_thb": null,
    "station_name": null
  }
}
`;

  const payload = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.1,
    },
  };

  let lastErrorText = "";
  let successRawText = "";

  // ลองยิงแต่ละโมเดล ถ้าเจอ 404 ให้สลับไปโมเดลถัดไปทันที
  for (const model of uniqueModels) {
    const remaining = deadline - Date.now();
    if (remaining < 2000) {
      lastErrorText = `หมดเวลาระหว่างรอ Gemini (ลองถึงก่อน ${model})`;
      break;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(Math.min(8000, remaining)),
      });

      if (res.ok) {
        const data: any = await res.json();
        successRawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (successRawText) {
          console.log(`Successfully extracted using model: ${model}`);
          break;
        }
      } else {
        lastErrorText = await res.text();
        console.warn(`Model ${model} failed (${res.status}): ${lastErrorText}`);
        // ถ้าเป็น 404, 503 (High Demand), 429 (Rate Limit) หรือ 500/502 ให้ลูปต่อไปลองตัวอื่นทันที
        if (
          res.status === 404 ||
          res.status === 503 ||
          res.status === 429 ||
          res.status === 500 ||
          res.status === 502
        ) {
          continue;
        } else {
          // ถ้าเป็น error อื่นที่ไม่ใช่ (เช่น 400, 403 API Key ผิด) ให้หยุดทันที
          throw new Error(`Gemini API Error (${res.status}): ${lastErrorText}`);
        }
      }
    } catch (e: any) {
      lastErrorText = e.message;
      const isRetryable =
        e.name === "TimeoutError" ||
        e.name === "AbortError" ||
        e.message.includes("timeout") ||
        e.message.includes("aborted") ||
        e.message.includes("404") ||
        e.message.includes("503") ||
        e.message.includes("429") ||
        e.message.includes("500") ||
        e.message.includes("502");
      if (!isRetryable) {
        throw e;
      }
    }
  }

  // หากลองทุกโมเดลแล้วยังไม่สำเร็จ ให้ลองดึงโมเดลที่มีในบัญชีจริงแล้วเรียกทันที
  // เวลาไม่พอสำหรับการค้นหารุ่นอื่น ให้แจ้ง error เลย (ดีกว่าถูกตัดเงียบๆ)
  if (!successRawText && deadline - Date.now() < 6000) {
    throw new Error(`Gemini ตอบไม่ทันเวลา: ${lastErrorText}`);
  }
  if (!successRawText) {
    const available = await fetchSupportedModels(apiKey);
    const fallbackModel =
      available.find(
        (m) =>
          m === "gemini-2.5-flash" ||
          m === "gemini-flash-latest" ||
          m.includes("flash")
      ) || available[0];

    if (fallbackModel) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(Math.max(1000, deadline - Date.now())),
      });
      if (res.ok) {
        const data: any = await res.json();
        successRawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      }
    }

    if (!successRawText) {
      throw new Error(
        `Gemini API Error: None of the candidate models (${uniqueModels.join(
          ", "
        )}) were found.\nAvailable models for your API Key: [${available.join(
          ", "
        ) || "None found. Please check API Key in Google AI Studio"}]`
      );
    }
  }

  // Parse JSON จากคำตอบ
  let cleaned = successRawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();

  try {
    return JSON.parse(cleaned) as UnifiedExtractionResponse;
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", successRawText);
    throw new Error(`Invalid JSON from Gemini: ${successRawText}`);
  }
}
