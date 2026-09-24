import { TripRecord, ChargingRecord, PeriodSummary } from "./types";

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
/**
 * ดึงชื่อที่แสดงของผู้ใช้ LINE (ใช้เป็นชื่อผู้ขับอัตโนมัติ) คืน "" ถ้าดึงไม่ได้
 */
export async function fetchLineDisplayName(userId: string | undefined, accessToken: string): Promise<string> {
  if (!userId) return "";
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      console.warn(`[LINE Profile] ${res.status}: ${await res.text()}`);
      return "";
    }
    const profile: any = await res.json();
    return (profile.displayName || "").toString().trim();
  } catch (e) {
    console.warn("[LINE Profile] failed:", e);
    return "";
  }
}

/**
 * แสดงจุดกำลังพิมพ์ในแชท 1:1 ระหว่างรอคำตอบ (ล้มเหลวได้โดยไม่กระทบการทำงาน)
 */
export async function showLineLoading(userId: string | undefined, accessToken: string, seconds = 20): Promise<void> {
  if (!userId) return;
  try {
    await fetch("https://api.line.me/v2/bot/chat/loading/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ chatId: userId, loadingSeconds: seconds }),
    });
  } catch (e) {
    console.warn("[LINE Loading] failed:", e);
  }
}

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
    throw new Error(`LINE Reply Error (${res.status}): ${errorText}`);
  }
}

/**
 * ส่งข้อความ Push (เฉพาะบุคคล) หรือ Broadcast (ทุกคนที่เป็นเพื่อนกับบอท) สำหรับ Cron Scheduled Reports
 */
export async function pushOrBroadcastLineMessage(
  messages: any[],
  accessToken: string,
  userId?: string
): Promise<{ success: boolean; method: "push" | "broadcast"; response?: any }> {
  // 1. ถ้ามี userId ให้ลอง Push ก่อน
  if (userId && userId.trim()) {
    try {
      console.log(`[LINE Push] Attempting push to user: ${userId}`);
      const pushRes = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: userId.trim(),
          messages,
        }),
      });

      if (pushRes.ok) {
        console.log(`[LINE Push] Push message sent successfully to ${userId}`);
        return { success: true, method: "push" };
      } else {
        const err = await pushRes.text();
        console.warn(`[LINE Push] Push failed (${pushRes.status}): ${err}. Falling back to broadcast...`);
      }
    } catch (pushErr) {
      console.warn("[LINE Push] Exception during push, falling back to broadcast:", pushErr);
    }
  }

  // 2. Broadcast ไปยังผู้ติดตามทั้งหมดของบอท
  console.log(`[LINE Broadcast] Sending broadcast report message to all followers...`);
  const bcastRes = await fetch("https://api.line.me/v2/bot/message/broadcast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messages,
    }),
  });

  if (!bcastRes.ok) {
    const bcastErr = await bcastRes.text();
    console.error(`[LINE Broadcast] Broadcast failed (${bcastRes.status}): ${bcastErr}`);
    throw new Error(`LINE Broadcast Error (${bcastRes.status}): ${bcastErr}`);
  }

  console.log(`[LINE Broadcast] Broadcast sent successfully!`);
  return { success: true, method: "broadcast" };
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
export function buildTripFlex(
  record: TripRecord,
  sheetStatus: string = "✅ บันทึกลง Google Sheets แล้ว",
  driveLink?: string | null,
  dashboardUrl: string = "https://ev-log-bot.eb-book.workers.dev/"
): any {
  const distStr = record.distance_km !== "" ? `${record.distance_km} km` : "-";
  const durStr = record.duration_min !== "" ? `${record.duration_min} นาที` : "-";
  const consStr = record.avg_consumption !== "" ? `${record.avg_consumption} kWh/100km` : "-";
  const socStr = `${record.soc_start || "-"} ➔ ${record.soc_end || "-"}`;
  const energyStr = record.energy_kwh !== "" ? `${record.energy_kwh} kWh` : "-";
  const costNet = record.cost_net_thb !== "" ? `฿${record.cost_net_thb}` : "-";
  const costGrid = record.cost_grid_thb !== "" ? `฿${record.cost_grid_thb}` : "-";

  const rows = [
    { name: "🛣️ ระยะทาง", val: distStr },
    { name: "⏱️ เวลาเดินทาง", val: durStr },
    { name: "⚡ อัตราสิ้นเปลือง", val: consStr },
    { name: "🔋 ระดับแบตเตอรี่", val: socStr },
    { name: "🔌 พลังงานที่ใช้", val: energyStr },
    { name: "💰 ค่าไฟสุทธิ", val: costNet },
    { name: "📊 ค่าไฟตามมิเตอร์", val: costGrid },
  ];

  if (record.note) {
    rows.push({ name: "📝 หมายเหตุ", val: record.note });
  }

  const buttons: any[] = [
    {
      type: "button",
      style: "primary",
      height: "sm",
      color: "#16a34a",
      action: {
        type: "uri",
        label: "📊 เปิดดูแดชบอร์ด",
        uri: dashboardUrl,
      },
    },
  ];

  if (driveLink) {
    buttons.push({
      type: "button",
      style: "secondary",
      height: "sm",
      action: {
        type: "uri",
        label: "📁 ดูรูปหน้าปัดใน Google Drive",
        uri: driveLink,
      },
    });
  } else {
    buttons.push({
      type: "button",
      style: "secondary",
      height: "sm",
      action: {
        type: "uri",
        label: "🛣️ ดูประวัติการเดินทาง",
        uri: `${dashboardUrl}trips`,
      },
    });
  }

  return {
    type: "flex",
    altText: `🚗 บันทึกการเดินทางสำเร็จ: ${distStr} (${energyStr})`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#16a34a",
        paddingAll: "lg",
        contents: [
          {
            type: "text",
            text: "🚗 บันทึกการเดินทาง (Trip Log)",
            weight: "bold",
            size: "md",
            color: "#ffffff",
          },
          {
            type: "text",
            text: `${record.date} ${record.time}`,
            size: "xs",
            color: "#dcfce7",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "lg",
        contents: [
          // Hero Numbers
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "ระยะทาง", size: "xxs", color: "#64748b" },
                  { type: "text", text: distStr, size: "xl", weight: "bold", color: "#0f172a" },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                alignItems: "flex-end",
                contents: [
                  { type: "text", text: "ค่าไฟสุทธิ", size: "xxs", color: "#64748b" },
                  { type: "text", text: costNet, size: "xl", weight: "bold", color: "#16a34a" },
                ],
              },
            ],
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
                { type: "text", text: r.name, color: "#64748b", size: "xs", flex: 5 },
                { type: "text", text: r.val, color: "#1e293b", size: "xs", flex: 7, weight: "bold", align: "end", wrap: true },
              ],
            })),
          },
          { type: "separator", margin: "md" },
          {
            type: "box",
            layout: "vertical",
            margin: "sm",
            spacing: "xs",
            contents: [
              { type: "text", text: sheetStatus, size: "xxs", color: "#16a34a", weight: "bold" },
              ...(driveLink ? [{ type: "text", text: "📁 บันทึกรูปภาพลง Google Drive เรียบร้อย", size: "xxs", color: "#0284c7" }] : []),
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "md",
        contents: [
          ...buttons,
          {
            type: "text",
            text: "EV Log Bot • Cloudflare Worker & Google Sheets",
            size: "xxs",
            color: "#94a3b8",
            align: "center",
            margin: "xs",
          },
        ],
      },
    },
  };
}

/**
 * สร้าง Flex Message สำหรับ Charge Log
 */
export function buildChargingFlex(
  record: ChargingRecord,
  sheetStatus: string = "✅ บันทึกลง Google Sheets แล้ว",
  driveLink?: string | null,
  dashboardUrl: string = "https://ev-log-bot.eb-book.workers.dev/"
): any {
  const socStr = `${record.soc_start || "-"} ➔ ${record.soc_end || "-"}`;
  const netStr = record.net_kwh !== "" ? `${record.net_kwh} kWh` : "-";
  const gridStr = record.grid_kwh !== "" ? `${record.grid_kwh} kWh` : "-";
  const costNet = record.cost_net_thb !== "" ? `฿${record.cost_net_thb}` : "-";
  const costGrid = record.cost_grid_thb !== "" ? `฿${record.cost_grid_thb}` : "-";
  const durStr = record.duration_min !== "" ? `${record.duration_min} นาที` : "-";

  const isDc = (record.location + " " + record.note).toLowerCase().includes("dc") ||
               (record.location + " " + record.note).includes("เร็ว") ||
               (record.location + " " + record.note).toLowerCase().includes("pea") ||
               (record.location + " " + record.note).toLowerCase().includes("ptt") ||
               (record.location + " " + record.note).toLowerCase().includes("station") ||
               (record.location + " " + record.note).toLowerCase().includes("charge+");

  const headerTitle = isDc ? "⚡ บันทึกตู้ชาร์จด่วน (DC Fast)" : "🏠 บันทึกการชาร์จบ้าน (Home AC)";
  const headerColor = isDc ? "#0284c7" : "#0d9488";
  const heroCost = costNet !== "-" ? costNet : costGrid;

  const rows = [
    { name: "📍 สถานที่/หัวชาร์จ", val: record.location || (isDc ? "ตู้ชาร์จสาธารณะ DC" : "ชาร์จบ้าน AC") },
    { name: "🔋 ระดับแบตเตอรี่", val: socStr },
    { name: "⏱️ ระยะเวลาชาร์จ", val: durStr },
    { name: "📥 พลังงานชาร์จ", val: netStr },
    { name: "🔌 พลังงานมิเตอร์", val: gridStr },
    { name: "💰 ยอดชำระสุทธิ", val: heroCost },
  ];

  if (record.note) {
    rows.push({ name: "📝 รายละเอียด", val: record.note });
  }

  const buttons: any[] = [
    {
      type: "button",
      style: "primary",
      height: "sm",
      color: headerColor,
      action: {
        type: "uri",
        label: "📊 เปิดดูแดชบอร์ด",
        uri: dashboardUrl,
      },
    },
  ];

  if (driveLink) {
    buttons.push({
      type: "button",
      style: "secondary",
      height: "sm",
      action: {
        type: "uri",
        label: "📁 ดูรูปสลิปใน Google Drive",
        uri: driveLink,
      },
    });
  } else {
    buttons.push({
      type: "button",
      style: "secondary",
      height: "sm",
      action: {
        type: "uri",
        label: "⚡ ดูประวัติการชาร์จ",
        uri: `${dashboardUrl}charging`,
      },
    });
  }

  return {
    type: "flex",
    altText: `${isDc ? "⚡" : "🏠"} ${headerTitle}: ${netStr} (${heroCost})`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: headerColor,
        paddingAll: "lg",
        contents: [
          {
            type: "text",
            text: headerTitle,
            weight: "bold",
            size: "md",
            color: "#ffffff",
          },
          {
            type: "text",
            text: `${record.start_datetime}`,
            size: "xs",
            color: "#f0fdfa",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "lg",
        contents: [
          // Hero Numbers
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "พลังงานที่ได้", size: "xxs", color: "#64748b" },
                  { type: "text", text: netStr, size: "xl", weight: "bold", color: "#0f172a" },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                alignItems: "flex-end",
                contents: [
                  { type: "text", text: "ยอดค่าไฟ", size: "xxs", color: "#64748b" },
                  { type: "text", text: heroCost, size: "xl", weight: "bold", color: headerColor },
                ],
              },
            ],
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
                { type: "text", text: r.name, color: "#64748b", size: "xs", flex: 5 },
                { type: "text", text: r.val, color: "#1e293b", size: "xs", flex: 7, weight: "bold", align: "end", wrap: true },
              ],
            })),
          },
          { type: "separator", margin: "md" },
          {
            type: "box",
            layout: "vertical",
            margin: "sm",
            spacing: "xs",
            contents: [
              { type: "text", text: sheetStatus, size: "xxs", color: "#16a34a", weight: "bold" },
              ...(driveLink ? [{ type: "text", text: "📁 บันทึกรูปสลิปลง Google Drive เรียบร้อย", size: "xxs", color: "#0284c7" }] : []),
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "md",
        contents: [
          ...buttons,
          {
            type: "text",
            text: "EV Log Bot • Cloudflare Worker & Google Sheets",
            size: "xxs",
            color: "#94a3b8",
            align: "center",
            margin: "xs",
          },
        ],
      },
    },
  };
}

/**
 * แปลงสรุปรายงานประจำช่วงเวลาเป็นข้อความตัวอักษรธรรมดา (Fallback)
 */
export function formatPeriodSummaryText(summary: PeriodSummary): string {
  const isWeekly = summary.periodType === "weekly";
  const headerIcon = isWeekly ? "📊" : "🏆";
  const label = isWeekly ? "สรุปประจำสัปดาห์ (Weekly Digest)" : "สรุปประจำเดือน (Monthly Digest)";

  return (
    `${headerIcon} [${label}]\n` +
    `📅 ช่วงเวลา: ${summary.dateRangeStr}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🛣️ ระยะทางวิ่งรวม: ${summary.totalKm.toLocaleString()} กม.\n` +
    `⚡ ยอดค่าชาร์จไฟ${isWeekly ? "รอบสัปดาห์" : "รอบเดือน"}: ฿${summary.totalCostThb.toLocaleString()} (${summary.totalChargedKwh.toLocaleString()} kWh)\n` +
    `💰 ประหยัดเทียบน้ำมัน: ฿${summary.savingsThb.toLocaleString()} (เทียบเบนซิน 14 กม./ลิตร)\n` +
    `🎯 อัตราสิ้นเปลืองเฉลี่ย: ${summary.avgConsumptionWhKm > 0 ? `${summary.avgConsumptionWhKm} Wh/km` : "-"}\n` +
    `🚗 ต้นทุนค่าเดินทาง: ฿${summary.costPerKmThb.toFixed(2)} / กม.\n` +
    `  • 🏠 ชาร์จบ้าน (AC): ${summary.homeKwh.toLocaleString()} kWh (${summary.acCharges} ครั้ง) • ฿${summary.homeCostThb.toLocaleString()}\n` +
    `  • ⚡ ตู้ชาร์จด่วน (DC): ${summary.dcKwh.toLocaleString()} kWh (${summary.dcCharges} ครั้ง) • ฿${summary.dcCostThb.toLocaleString()}\n` +
    `⏱️ จำนวนเที่ยวขับ: ${summary.totalTrips} เที่ยว (${Math.round(summary.totalDurationMin / 60)} ชม. ${summary.totalDurationMin % 60} นาที)\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 ดูแดชบอร์ดฉบับเต็ม:\nhttps://ev-log-bot.eb-book.workers.dev/`
  );
}

/**
 * สร้าง Interactive Flex Message สำหรับรายงานสรุปประจำสัปดาห์ (Weekly) และประจำเดือน (Monthly)
 */
export function buildPeriodReportFlex(summary: PeriodSummary): any {
  const isWeekly = summary.periodType === "weekly";
  const headerBg = isWeekly ? "#1e1b4b" : "#064e3b"; // Dark Indigo vs Dark Emerald
  const accentColor = isWeekly ? "#38bdf8" : "#34d399";
  const badgeText = isWeekly ? "📅 สรุปประจำสัปดาห์" : "🏆 สรุปประจำเดือน";
  const badgeBg = isWeekly ? "#312e81" : "#065f46";

  const rows = [
    { name: "🎯 อัตราสิ้นเปลืองเฉลี่ย", val: summary.avgConsumptionWhKm > 0 ? `${summary.avgConsumptionWhKm} Wh/km` : "-" },
    { name: "🚗 ต้นทุนการเดินทาง", val: `฿${summary.costPerKmThb.toFixed(2)} / กม.` },
    { name: "🏠 ชาร์จบ้าน (AC)", val: `${summary.homeKwh.toLocaleString()} kWh (${summary.acCharges} ครั้ง) • ฿${summary.homeCostThb.toLocaleString()}` },
    { name: "⚡ ตู้ชาร์จด่วน (DC)", val: `${summary.dcKwh.toLocaleString()} kWh (${summary.dcCharges} ครั้ง) • ฿${summary.dcCostThb.toLocaleString()}` },
    { name: "💰 ประหยัดเทียบเบนซิน", val: `฿${summary.savingsThb.toLocaleString()} (14 km/L)` },
    { name: "🚗 สถิติเที่ยวขับขี่", val: `${summary.totalTrips} เที่ยว (${Math.round(summary.totalDurationMin / 60)} ชม. ${summary.totalDurationMin % 60} น.)` },
  ];

  if (summary.odoStart && summary.odoEnd) {
    rows.push({
      name: "🛣️ เลขไมล์ช่วงนี้",
      val: `${summary.odoStart.toLocaleString()} ➔ ${summary.odoEnd.toLocaleString()} กม.`,
    });
  }

  return {
    type: "flex",
    altText: `${badgeText}: วิ่ง ${summary.totalKm.toLocaleString()} กม. ยอดค่าชาร์จ ฿${summary.totalCostThb.toLocaleString()}`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: headerBg,
        paddingAll: "lg",
        spacing: "xs",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                backgroundColor: badgeBg,
                cornerRadius: "md",
                paddingStart: "sm",
                paddingEnd: "sm",
                paddingTop: "xs",
                paddingBottom: "xs",
                contents: [
                  {
                    type: "text",
                    text: badgeText,
                    color: accentColor,
                    size: "xxs",
                    weight: "bold",
                  },
                ],
              },
            ],
          },
          {
            type: "text",
            text: isWeekly ? "EV Weekly Executive Digest" : "EV Monthly Executive Digest",
            weight: "bold",
            size: "md",
            color: "#ffffff",
            margin: "sm",
          },
          {
            type: "text",
            text: `ช่วงเวลา: ${summary.dateRangeStr}`,
            size: "xxs",
            color: "#94a3b8",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "lg",
        spacing: "md",
        backgroundColor: "#ffffff",
        contents: [
          // Hero Metrics 2 ช่อง
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            contents: [
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#f8fafc",
                paddingAll: "md",
                cornerRadius: "md",
                borderColor: "#e2e8f0",
                borderWidth: "light",
                flex: 1,
                contents: [
                  { type: "text", text: "🛣️ ระยะทางรวม", size: "xxs", color: "#64748b" },
                  {
                    type: "text",
                    text: `${summary.totalKm.toLocaleString()}`,
                    size: "xl",
                    weight: "bold",
                    color: "#0f172a",
                    margin: "xs",
                  },
                  { type: "text", text: "กิโลเมตร", size: "xxs", color: "#94a3b8" },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                backgroundColor: isWeekly ? "#eff6ff" : "#f0fdf4",
                paddingAll: "md",
                cornerRadius: "md",
                borderColor: isWeekly ? "#bfdbfe" : "#bbf7d0",
                borderWidth: "light",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: isWeekly ? "⚡ ค่าชาร์จสัปดาห์นี้" : "⚡ ค่าชาร์จเดือนนี้",
                    size: "xxs",
                    color: isWeekly ? "#1e40af" : "#166534",
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: `฿${summary.totalCostThb.toLocaleString()}`,
                    size: "xl",
                    weight: "bold",
                    color: isWeekly ? "#1d4ed8" : "#15803d",
                    margin: "xs",
                  },
                  {
                    type: "text",
                    text: `รวม ${summary.totalChargedKwh.toLocaleString()} kWh (${summary.totalCharges} ครั้ง)`,
                    size: "xxs",
                    color: isWeekly ? "#3b82f6" : "#16a34a",
                  },
                ],
              },
            ],
          },
          { type: "separator" },
          // Key Performance Indicators Rows
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: rows.map((r) => ({
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                { type: "text", text: r.name, color: "#64748b", size: "xs", flex: 5 },
                { type: "text", text: r.val, color: "#0f172a", size: "xs", flex: 7, weight: "bold", align: "end", wrap: true },
              ],
            })),
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "md",
        backgroundColor: "#f8fafc",
        contents: [
          {
            type: "button",
            style: "primary",
            color: headerBg,
            height: "sm",
            action: {
              type: "uri",
              label: "📊 เปิดดูแดชบอร์ดฉบับเต็ม",
              uri: "https://ev-log-bot.eb-book.workers.dev/",
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "📈 ดูรายงานเชิงลึก (Reports View)",
              uri: "https://ev-log-bot.eb-book.workers.dev/reports",
            },
          },
          {
            type: "text",
            text: "ระบบรายงานอัตโนมัติ • Cloudflare Workers Cron",
            size: "xxs",
            color: "#94a3b8",
            align: "center",
            margin: "xs",
          },
        ],
      },
    },
  };
}
