import { Env } from "./types";
import {
  verifyLineSignature,
  fetchLineImageBase64,
  replyLineMessage,
  buildTripFlex,
  buildChargingFlex,
  formatTripSummaryText,
  formatChargingSummaryText,
} from "./line";
import { analyzeEVImageWithGemini } from "./gemini";
import {
  buildTripRecord,
  buildChargingRecord,
  tripToSheetRow,
  chargingToSheetRow,
} from "./calculator";
import {
  appendTripToGoogleSheet,
  appendChargingToGoogleSheet,
  updateSheetRow,
  deleteSheetRow,
  appendRawRowToGoogleSheet,
} from "./sheets";

import { fetchDashboardDataFromSheets } from "./dashboardData";
import { renderDashboardHtml } from "./dashboardView";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const corsHeaders = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 1. Interactive EV Web Dashboard & Management Prototype
    const validPaths = [
      "/", "/dashboard", "/charging", "/manage", "/trips",
      "/vehicles", "/vehicle-detail", "/charging-history",
      "/add-charging", "/cost-analysis", "/reports", "/settings"
    ];
    if ((request.method === "GET" || request.method === "HEAD") && validPaths.includes(url.pathname)) {
      const cleanPath = url.pathname.replace(/^\//, "");
      const initialTab = (url.searchParams.get("tab") || cleanPath || "dashboard") as any;
      const payload = await fetchDashboardDataFromSheets(env);
      const html = renderDashboardHtml(payload, initialTab);
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=30, s-maxage=30",
        },
      });
    }

    // 2. API Data Endpoint (คืนค่า JSON สำหรับระบบอื่นหรือ dynamic fetch)
    if (request.method === "GET" && url.pathname === "/api/data") {
      const payload = await fetchDashboardDataFromSheets(env);
      return new Response(JSON.stringify(payload), {
        headers: corsHeaders,
      });
    }

    // 3. API Records CRUD Endpoints
    if (request.method === "POST" && url.pathname === "/api/records") {
      try {
        const body: any = await request.json();
        const date = (body.date || "").toString().trim();
        const time = (body.time || "").toString().trim();
        const odoStart = body.odoStart !== "" && body.odoStart != null ? parseFloat(body.odoStart) : "";
        const odoEnd = body.odoEnd !== "" && body.odoEnd != null ? parseFloat(body.odoEnd) : "";
        const distanceKm = body.distanceKm !== "" && body.distanceKm != null ? parseFloat(body.distanceKm) : 0;
        const durationMin = body.durationMin !== "" && body.durationMin != null ? parseFloat(body.durationMin) : 0;
        const avgConsumption = body.avgConsumption !== "" && body.avgConsumption != null ? parseFloat(body.avgConsumption) : 0;
        const socStart = body.socStart !== "" && body.socStart != null ? `${parseFloat(body.socStart)}%` : "";
        const socEnd = body.socEnd !== "" && body.socEnd != null ? `${parseFloat(body.socEnd)}%` : "";
        const energyKwh = body.energyKwh !== "" && body.energyKwh != null ? parseFloat(body.energyKwh) : 0;
        const costNetThb = body.costNetThb !== "" && body.costNetThb != null ? parseFloat(body.costNetThb) : 0;
        const costGridThb = body.costGridThb !== "" && body.costGridThb != null ? parseFloat(body.costGridThb) : costNetThb;
        const note = (body.note || "").toString().trim();

        const rowValues = [
          date,
          time,
          odoStart,
          odoEnd,
          distanceKm,
          durationMin,
          avgConsumption,
          socStart,
          socEnd,
          energyKwh,
          costNetThb,
          costGridThb,
          note,
        ];

        const res = await appendRawRowToGoogleSheet(rowValues, env);
        return new Response(JSON.stringify({ ok: true, message: "Record added successfully", res }), {
          headers: corsHeaders,
        });
      } catch (err: any) {
        console.error("POST /api/records error:", err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    if (request.method === "PUT" && url.pathname === "/api/records") {
      try {
        const body: any = await request.json();
        const rowIndex = parseInt(body.sheetRowIndex, 10);
        if (!rowIndex || rowIndex < 2) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid sheetRowIndex" }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        const date = (body.date || "").toString().trim();
        const time = (body.time || "").toString().trim();
        const odoStart = body.odoStart !== "" && body.odoStart != null ? parseFloat(body.odoStart) : "";
        const odoEnd = body.odoEnd !== "" && body.odoEnd != null ? parseFloat(body.odoEnd) : "";
        const distanceKm = body.distanceKm !== "" && body.distanceKm != null ? parseFloat(body.distanceKm) : 0;
        const durationMin = body.durationMin !== "" && body.durationMin != null ? parseFloat(body.durationMin) : 0;
        const avgConsumption = body.avgConsumption !== "" && body.avgConsumption != null ? parseFloat(body.avgConsumption) : 0;
        const socStart = body.socStart !== "" && body.socStart != null ? `${parseFloat(body.socStart)}%` : "";
        const socEnd = body.socEnd !== "" && body.socEnd != null ? `${parseFloat(body.socEnd)}%` : "";
        const energyKwh = body.energyKwh !== "" && body.energyKwh != null ? parseFloat(body.energyKwh) : 0;
        const costNetThb = body.costNetThb !== "" && body.costNetThb != null ? parseFloat(body.costNetThb) : 0;
        const costGridThb = body.costGridThb !== "" && body.costGridThb != null ? parseFloat(body.costGridThb) : costNetThb;
        const note = (body.note || "").toString().trim();

        const rowValues = [
          date,
          time,
          odoStart,
          odoEnd,
          distanceKm,
          durationMin,
          avgConsumption,
          socStart,
          socEnd,
          energyKwh,
          costNetThb,
          costGridThb,
          note,
        ];

        const res = await updateSheetRow(rowIndex, rowValues, env);
        return new Response(JSON.stringify({ ok: true, message: "Record updated successfully", res }), {
          headers: corsHeaders,
        });
      } catch (err: any) {
        console.error("PUT /api/records error:", err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    if (request.method === "DELETE" && url.pathname === "/api/records") {
      try {
        let rowIndex = parseInt(url.searchParams.get("rowIndex") || "", 10);
        if (!rowIndex) {
          const body: any = await request.json().catch(() => ({}));
          rowIndex = parseInt(body.sheetRowIndex, 10);
        }
        if (!rowIndex || rowIndex < 2) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid sheetRowIndex" }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        const res = await deleteSheetRow(rowIndex, env);
        return new Response(JSON.stringify({ ok: true, message: "Record deleted successfully", res }), {
          headers: corsHeaders,
        });
      } catch (err: any) {
        console.error("DELETE /api/records error:", err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }



    // 3. Health check & Diagnostics Dashboard
    if (request.method === "GET" && url.pathname === "/health") {
      const isGeminiOk = !!env.GEMINI_API_KEY;
      const isLineOk = !!(env.LINE_CHANNEL_SECRET && env.LINE_CHANNEL_ACCESS_TOKEN);
      const isSheetsOk = !!(
        env.GOOGLE_APPS_SCRIPT_URL ||
        (env.SPREADSHEET_ID && env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY)
      );

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>🚗 EV Log Cloudflare Worker - Status</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; }
          .box { max-width: 550px; margin: 0 auto; background: #1e293b; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
          h2 { color: #38bdf8; margin-top: 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #334155; }
          .badge-ok { color: #4ade80; font-weight: bold; }
          .badge-no { color: #f87171; font-weight: bold; }
          a { color: #38bdf8; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>⚡ EV Trip & Charge Log (Cloudflare Worker)</h2>
          <p style="color: #94a3b8;">Serverless 24/7 Webhook & Live Dashboard</p>
          <div class="item">
            <span>Gemini Vision API:</span>
            <span class="${isGeminiOk ? "badge-ok" : "badge-no"}">${isGeminiOk ? "✅ Ready" : "❌ Missing GEMINI_API_KEY"}</span>
          </div>
          <div class="item">
            <span>LINE Messaging API:</span>
            <span class="${isLineOk ? "badge-ok" : "badge-no"}">${isLineOk ? "✅ Ready" : "❌ Missing Token/Secret"}</span>
          </div>
          <div class="item">
            <span>Google Sheets Integration:</span>
            <span class="${isSheetsOk ? "badge-ok" : "badge-no"}">${isSheetsOk ? "✅ Ready" : "❌ Missing Credentials"}</span>
          </div>
          <div style="margin-top: 20px; font-size: 14px; color: #cbd5e1;">
            <p><strong>📊 Live Web Dashboard:</strong> <a href="${url.origin}/">Open Dashboard</a></p>
            <p><strong>LINE Webhook URL:</strong><br><code>${url.origin}/callback</code></p>
          </div>
        </div>
      </body>
      </html>
      `;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 2. LINE Webhook Endpoint
    if (request.method === "POST" && (url.pathname === "/" || url.pathname === "/callback")) {
      const signature = request.headers.get("x-line-signature");
      const bodyText = await request.text();

      // ตรวจสอบ Signature
      const isValid = await verifyLineSignature(bodyText, signature, env.LINE_CHANNEL_SECRET);
      if (!isValid) {
        return new Response("Invalid signature", { status: 403 });
      }

      let data: any;
      try {
        data = JSON.parse(bodyText);
      } catch (e) {
        return new Response("Invalid JSON", { status: 400 });
      }

      const events = data.events || [];

      // ใช้ ctx.waitUntil เพื่อประมวลผลเบื้องหลัง และตอบ 200 OK ให้ LINE ทันที
      for (const event of events) {
        if (event.type === "message" && event.message?.type === "image") {
          ctx.waitUntil(handleImageEvent(event, env));
        } else if (event.type === "message" && event.message?.type === "text") {
          ctx.waitUntil(handleTextEvent(event, env));
        }
      }

      return new Response("OK", { status: 200 });
    }

    // 404
    return new Response("Not Found", { status: 404 });
  },
};

/**
 * ประมวลผลรูปภาพใน Background ผ่าน Cloudflare Worker waitUntil
 */
async function handleImageEvent(event: any, env: Env): Promise<void> {
  const replyToken = event.replyToken;
  const messageId = event.message.id;

  try {
    console.log(`[1/4] Fetching image from LINE messageId: ${messageId}`);
    const imageBase64 = await fetchLineImageBase64(messageId, env.LINE_CHANNEL_ACCESS_TOKEN);

    console.log(`[2/4] Sending image to Gemini Vision API...`);
    const analysis = await analyzeEVImageWithGemini(imageBase64, env);
    console.log(`[2/4] Gemini extraction completed: type=${analysis.type}`);

    let replyMessageText = "";
    let sheetStatus = "✅ บันทึกลง Google Sheets แล้ว";

    if (analysis.type === "charging" && analysis.charging_data) {
      const record = buildChargingRecord(analysis.charging_data, env);

      try {
        console.log(`[3/4] Appending row to Google Sheet (Charging)...`);
        const res = await appendChargingToGoogleSheet(record, env);
        console.log(`[3/4] Google Sheet append successful to '${res.sheetName}'!`);
        sheetStatus = `✅ บันทึกลง ${res.sheetName} แล้ว`;
      } catch (sheetErr: any) {
        console.error("Google Sheet append error:", sheetErr);
        sheetStatus = `⚠️ บันทึกลง Sheets ไม่สำเร็จ: ${sheetErr.message}`;
      }

      replyMessageText = formatChargingSummaryText(record, sheetStatus);
    } else {
      const tripData = analysis.trip_data || {
        odo_start: null,
        odo_end: null,
        distance_km: null,
        duration_min: null,
        avg_consumption: null,
        soc_start: null,
        soc_end: null,
        note: null,
      };
      const record = buildTripRecord(tripData, env);

      try {
        console.log(`[3/4] Appending row to Google Sheet (Trips)...`);
        const res = await appendTripToGoogleSheet(record, env);
        console.log(`[3/4] Google Sheet append successful to '${res.sheetName}'!`);
        sheetStatus = `✅ บันทึกลง ${res.sheetName} แล้ว`;
      } catch (sheetErr: any) {
        console.error("Google Sheet append error:", sheetErr);
        sheetStatus = `⚠️ บันทึกลง Sheets ไม่สำเร็จ: ${sheetErr.message}`;
      }

      replyMessageText = formatTripSummaryText(record, sheetStatus);
    }

    console.log(`[4/4] Replying to LINE user...`);
    await replyLineMessage(
      replyToken,
      [{ type: "text", text: replyMessageText }],
      env.LINE_CHANNEL_ACCESS_TOKEN
    );
    console.log(`[4/4] Reply sent successfully!`);

  } catch (err: any) {
    console.error("Error processing image event:", err);
    try {
      await replyLineMessage(
        replyToken,
        [
          {
            type: "text",
            text: `⚠️ เกิดข้อผิดพลาดในการประมวลผลภาพ:\n${err?.message || err}`,
          },
        ],
        env.LINE_CHANNEL_ACCESS_TOKEN
      );
    } catch (e) {
      console.error("Failed to send error reply to LINE:", e);
    }
  }
}

/**
 * ตอบกลับข้อความช่วยเหลือทั่วไป
 */
async function handleTextEvent(event: any, env: Env): Promise<void> {
  const replyToken = event.replyToken;
  const text = (event.message?.text || "").trim().toLowerCase();

  const guide =
    "🚗 [ระบบบันทึก EV Trip & Charge Log]\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "ถ่ายรูปหน้าปัดเรือนไมล์ หรือหน้าจอแอปชาร์จไฟ แล้วส่งรูปเข้ามาในแชทนี้ได้เลยครับ!\n\n" +
    "🤖 Gemini AI จะอ่านข้อมูล คำนวณค่าไฟ และบันทึกลง Google Sheets ให้อัตโนมัติทันที 24 ชม.\n\n" +
    "📊 ดูสรุปภาพรวมแดชบอร์ด:\n" +
    "https://ev-log-bot.eb-book.workers.dev/\n\n" +
    "⚡ รายงานค่าใช้จ่ายการชาร์จไฟ (สัปดาห์/เดือน/ปี):\n" +
    "https://ev-log-bot.eb-book.workers.dev/charging";

  await replyLineMessage(
    replyToken,
    [{ type: "text", text: guide }],
    env.LINE_CHANNEL_ACCESS_TOKEN
  );
}
