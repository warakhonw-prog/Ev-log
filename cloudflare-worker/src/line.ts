import { TripRecord, ChargingRecord } from "./types";

/**
 * ตรวจสอบความถูกต้องของ LINE Webhook Signature ด้วย HMAC-SHA256 (Web Crypto API)
 */
export async function verifyLineSignature(
  bodyText: string,
  signature: string | null,
  channelSecret: string
): Promise<boolean> {
  if (!signature || !channelSecret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const hashBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(bodyText)
  );

  const hashArray = new Uint8Array(hashBuffer);
  let binary = "";
  for (let i = 0; i < hashArray.length; i++) {
    binary += String.fromCharCode(hashArray[i]);
  }
  const calculatedSignature = btoa(binary);

  return calculatedSignature === signature;
}

/**
 * ดาวน์โหลดรูปภาพจาก LINE Content API และแปลงเป็น Base64
 */
export async function fetchLineImageBase64(
  messageId: string,
  accessToken: string
): Promise<string> {
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to download LINE image: ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * ส่งข้อความตอบกลับไปยัง LINE Messaging API
 */
export async function replyLineMessage(
  replyToken: string,
  messages: any[],
  accessToken: string
): Promise<void> {
  const url = "https://api.line.me/v2/bot/message/reply";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`LINE Reply Error (${res.status}): ${errorText}`);
  }
}

export function formatTripSummaryText(record: TripRecord, sheetStatus: string = "✅ บันทึกลง Google Sheets แล้ว"): string {
  const distStr = record.distance_km !== "" ? `${record.distance_km} กม.` : "-";
  const durStr = record.duration_min !== "" ? `${record.duration_min} นาที` : "-";
  const consStr = record.avg_consumption !== "" ? `${record.avg_consumption} kWh/100km` : "-";
  const socStr = `${record.soc_start || "-"} ➔ ${record.soc_end || "-"}`;
  const energyStr = record.energy_kwh !== "" ? `${record.energy_kwh} kWh` : "-";
  const costNet = record.cost_net_thb !== "" ? `฿${record.cost_net_thb}` : "-";
  const costGrid = record.cost_grid_thb !== "" ? `฿${record.cost_grid_thb}` : "-";

  return (
    `🚗 [บันทึกการเดินทางสำเร็จ]\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📅 วันที่: ${record.date} ${record.time}\n` +
    `🛣️ ระยะทาง: ${distStr}\n` +
    `⏱️ เวลาที่ใช้: ${durStr}\n` +
    `⚡ อัตราสิ้นเปลือง: ${consStr}\n` +
    `🔋 แบตเตอรี่: ${socStr}\n` +
    `🔌 ไฟที่ใช้: ${energyStr}\n` +
    `💰 ค่าไฟสุทธิ: ${costNet}\n` +
    `📊 ค่าไฟตามมิเตอร์: ${costGrid}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `${sheetStatus}`
  );
}

export function formatChargingSummaryText(record: ChargingRecord, sheetStatus: string = "✅ บันทึกลง Google Sheets แล้ว"): string {
  const isReceipt = (!record.soc_start || record.soc_start === "-") && (!record.soc_end || record.soc_end === "-");
  const durStr = record.duration_min !== "" ? `${record.duration_min} นาที` : "-";
  const netStr = record.net_kwh !== "" ? `${record.net_kwh} kWh` : "-";
  const costNet = record.cost_net_thb !== "" ? `฿${record.cost_net_thb}` : "-";
  const costGrid = record.cost_grid_thb !== "" ? `฿${record.cost_grid_thb}` : "-";

  if (isReceipt) {
    return (
      `⚡ [บันทึกใบเสร็จการชาร์จสำเร็จ]\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 วันที่: ${record.start_datetime}\n` +
      `🔌 สถานี: ${record.location}\n` +
      `⏱️ ระยะเวลาชาร์จ: ${durStr}\n` +
      `📥 พลังงานที่ชาร์จ: ${netStr}\n` +
      `💰 ยอดชำระจริง: ${costNet}\n` +
      `📝 รายละเอียด: ${record.note}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${sheetStatus}`
    );
  }

  const socStr = `${record.soc_start || "-"} ➔ ${record.soc_end || "-"}`;
  const gridStr = record.grid_kwh !== "" ? `${record.grid_kwh} kWh` : "-";
  return (
    `⚡ [บันทึกการชาร์จไฟสำเร็จ]\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🔋 แบตเตอรี่: ${socStr}\n` +
    `⏱️ ระยะเวลาชาร์จ: ${durStr}\n` +
    `📥 ไฟเข้าแบตเตอรี่: ${netStr}\n` +
    `🔌 ไฟตามมิเตอร์: ${gridStr}\n` +
    `💰 ค่าไฟสุทธิ: ${costNet}\n` +
    `🧾 ค่าไฟตามมิเตอร์: ${costGrid}\n` +
    `📝 หมายเหตุ: ${record.note}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `${sheetStatus}`
  );
}

/**
 * สร้าง Flex Message สำหรับ Trip Log
 */
export function buildTripFlex(record: TripRecord): any {
  const distStr = record.distance_km !== "" ? `${record.distance_km} km` : "-";
  const durStr = record.duration_min !== "" ? `${record.duration_min} min` : "-";
  const consStr = record.avg_consumption !== "" ? `${record.avg_consumption} kWh/100km` : "-";
  const socStr = `${record.soc_start || "-"} ➔ ${record.soc_end || "-"}`;
  const energyStr = record.energy_kwh !== "" ? `${record.energy_kwh} kWh` : "-";
  const costNet = record.cost_net_thb !== "" ? `฿${record.cost_net_thb}` : "-";
  const costGrid = record.cost_grid_thb !== "" ? `฿${record.cost_grid_thb}` : "-";

  const rows = [
    { name: "🛣️ ระยะทาง", val: distStr },
    { name: "⏱️ เวลาเดินทาง", val: durStr },
    { name: "⚡ อัตราสิ้นเปลือง", val: consStr },
    { name: "🔋 แบตเตอรี่", val: socStr },
    { name: "🔌 พลังงานที่ใช้", val: energyStr },
    { name: "💰 ค่าไฟสุทธิ", val: costNet },
    { name: "📊 ค่าไฟตามมิเตอร์", val: costGrid },
  ];

  return {
    type: "flex",
    altText: `🚗 บันทึกการเดินทางสำเร็จ: ${distStr}`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🚗 บันทึกการเดินทาง (Trip Log)",
            weight: "bold",
            size: "lg",
            color: "#16a34a",
          },
          {
            type: "text",
            text: `${record.date} ${record.time}`,
            size: "xs",
            color: "#94a3b8",
            margin: "xs",
          },
          { type: "separator", margin: "md" },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "sm",
            contents: rows.map((r) => ({
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                { type: "text", text: r.name, color: "#64748b", size: "sm", flex: 5 },
                { type: "text", text: r.val, color: "#1e293b", size: "sm", flex: 6, weight: "bold", align: "end" },
              ],
            })),
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "Cloudflare Worker + Google Sheets",
            size: "xxs",
            color: "#94a3b8",
            align: "center",
          },
        ],
      },
    },
  };
}

/**
 * สร้าง Flex Message สำหรับ Charge Log
 */
export function buildChargingFlex(record: ChargingRecord): any {
  const socStr = `${record.soc_start || "-"} ➔ ${record.soc_end || "-"}`;
  const netStr = record.net_kwh !== "" ? `${record.net_kwh} kWh` : "-";
  const gridStr = record.grid_kwh !== "" ? `${record.grid_kwh} kWh` : "-";
  const costGrid = record.cost_grid_thb !== "" ? `฿${record.cost_grid_thb}` : "-";

  const rows = [
    { name: "📍 สถานที่", val: record.location },
    { name: "🔋 ระดับแบตเตอรี่", val: socStr },
    { name: "📥 ไฟเข้าแบต", val: netStr },
    { name: "🔌 ไฟจากมิเตอร์", val: gridStr },
    { name: "🧾 ค่าไฟจริง", val: costGrid },
  ];

  return {
    type: "flex",
    altText: `⚡ บันทึกการชาร์จไฟสำเร็จ: ${netStr}`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "⚡ บันทึกการชาร์จไฟ (Charge Log)",
            weight: "bold",
            size: "lg",
            color: "#0284c7",
          },
          {
            type: "text",
            text: `${record.start_datetime}`,
            size: "xs",
            color: "#94a3b8",
            margin: "xs",
          },
          { type: "separator", margin: "md" },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "sm",
            contents: rows.map((r) => ({
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                { type: "text", text: r.name, color: "#64748b", size: "sm", flex: 5 },
                { type: "text", text: r.val, color: "#1e293b", size: "sm", flex: 6, weight: "bold", align: "end" },
              ],
            })),
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "Cloudflare Worker + Google Sheets",
            size: "xxs",
            color: "#94a3b8",
            align: "center",
          },
        ],
      },
    },
  };
}
