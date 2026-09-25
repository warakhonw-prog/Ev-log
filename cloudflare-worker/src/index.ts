import { Env } from "./types";
import {
  verifyLineSignature,
  fetchLineImageBase64,
  replyLineMessage,
  pushOrBroadcastLineMessage,
  buildTripFlex,
  buildChargingFlex,
  buildPeriodReportFlex,
  formatTripSummaryText,
  formatChargingSummaryText,
  formatPeriodSummaryText,
  fetchLineDisplayName,
  showLineLoading,
} from "./line";
import { askEvAssistant, isLineUserAllowed, formatAnswerForLine, AskTurn } from "./assistant";
import { verifyAdminLogin, setAdminPassword, deleteAdmin, readAdmins, summarize, normalizeUsername } from "./admins";
import { generatePeriodSummary } from "./reports";
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
import { uploadImageToGoogleDrive } from "./drive";
import {
  RowExt,
  extToCells,
  normalizePurpose,
  readVehicles,
  defaultVehicleId,
  saveVehicle,
  setRowPurpose,
} from "./fleet";
import { buildExpenseReport, expenseReportToXlsx, renderExpenseReportHtml, ExpenseFilter } from "./expense";
import { getGoogleAccessToken } from "./sheets";

import { fetchDashboardDataFromSheets } from "./dashboardData";
import { renderDashboardHtml } from "./dashboardView";
import {
  isAuthConfigured,
  isAuthorized,
  checkToken,
  buildSessionCookie,
  clearSessionCookie,
  safeNextPath,
  renderLoginHtml,
  currentUser,
} from "./auth";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight: เปิดข้ามโดเมนเฉพาะการอ่าน (GET) — การเขียนต้องมาจาก origin เดียวกันเท่านั้น
    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // สำหรับ endpoint อ่านอย่างเดียว
    const corsHeaders = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // สำหรับ endpoint ที่แก้ข้อมูล/ส่ง LINE: ไม่มี CORS header (same-origin เท่านั้น) และห้าม cache
    const writeHeaders = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    };

    // Login / Logout (session cookie สำหรับหน้า dashboard)
    if (url.pathname === "/login" && request.method === "GET") {
      const next = safeNextPath(url.searchParams.get("next"));
      return new Response(renderLoginHtml(next), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    if (url.pathname === "/login" && request.method === "POST") {
      const origin = request.headers.get("Origin");
      if (origin && origin !== url.origin) {
        return new Response("Forbidden", { status: 403 });
      }
      const form = await request.formData().catch(() => null);
      const token = (form?.get("token") || "").toString();
      const username = normalizeUsername(form?.get("username"));
      const next = safeNextPath((form?.get("next") || "").toString());
      if (!isAuthConfigured(env)) {
        return new Response(renderLoginHtml(next, "ยังไม่ได้ตั้งค่า DASHBOARD_TOKEN บนเซิร์ฟเวอร์"), {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        });
      }
      const htmlHeaders = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" };
      // มีชื่อผู้ใช้ = login ด้วยบัญชีแอดมิน · ไม่มี = login ด้วย DASHBOARD_TOKEN
      if (username) {
        let result;
        try {
          result = await verifyAdminLogin(username, token, env);
        } catch (e: any) {
          console.error("admin login error:", e);
          return new Response(renderLoginHtml(next, "ตรวจสอบบัญชีไม่สำเร็จ ลองใหม่อีกครั้ง"), { status: 500, headers: htmlHeaders });
        }
        if (!result.ok) {
          const msg =
            result.reason === "locked"
              ? `บัญชีถูกล็อกชั่วคราวเพราะใส่รหัสผิดหลายครั้ง ลองใหม่หลัง ${new Date(((result.lockedUntil || 0) + 7 * 3600) * 1000).toISOString().slice(11, 16)} น. หรือเข้าด้วย Dashboard token`
              : "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
          return new Response(renderLoginHtml(next, msg), { status: 401, headers: htmlHeaders });
        }
        return new Response(null, {
          status: 303,
          headers: { Location: next, "Set-Cookie": await buildSessionCookie(env, result.admin), "Cache-Control": "no-store" },
        });
      }
      if (!(await checkToken(token, env))) {
        return new Response(renderLoginHtml(next, "Token ไม่ถูกต้อง"), { status: 401, headers: htmlHeaders });
      }
      return new Response(null, {
        status: 303,
        headers: { Location: next, "Set-Cookie": await buildSessionCookie(env), "Cache-Control": "no-store" },
      });
    }

    if (url.pathname === "/logout" && (request.method === "GET" || request.method === "POST")) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/", "Set-Cookie": clearSessionCookie(), "Cache-Control": "no-store" },
      });
    }

    // สถานะการ login (ใช้แสดงในหน้า dashboard ไม่ต้องยืนยันตัวตน)
    if (url.pathname === "/api/me" && request.method === "GET") {
      const user = await currentUser(request, env);
      return new Response(JSON.stringify({ ok: true, authenticated: !!user, user }), { headers: writeHeaders });
    }

    // ทุก endpoint ที่แก้ข้อมูลใน Sheet หรือยิงข้อความ LINE ต้องยืนยันตัวตน
    const isWriteEndpoint =
      (url.pathname === "/api/records" && ["POST", "PUT", "DELETE"].includes(request.method)) ||
      (url.pathname === "/api/vehicles" && request.method === "POST") ||
      (url.pathname === "/api/cron/trigger" && request.method === "GET") ||
      // เรียก AI มีค่าใช้จ่าย จึงต้อง login เหมือน endpoint ที่แก้ข้อมูล
      (url.pathname === "/api/ask" && request.method === "POST") ||
      // บัญชีแอดมิน: ดู/เพิ่ม/เปลี่ยนรหัส/ลบ ต้อง login ก่อนทั้งหมด
      (url.pathname === "/api/admins" && ["GET", "POST", "DELETE"].includes(request.method));
    if (isWriteEndpoint && !(await isAuthorized(request, env))) {
      if (!isAuthConfigured(env)) {
        return new Response(JSON.stringify({ ok: false, error: "DASHBOARD_TOKEN is not configured on the server" }), {
          status: 503,
          headers: writeHeaders,
        });
      }
      // เปิดลิงก์ในเบราว์เซอร์ (เช่นปุ่มยิงรายงานในหน้า /health) → ส่งไปหน้า login
      if (request.method === "GET" && (request.headers.get("Accept") || "").includes("text/html")) {
        return new Response(null, {
          status: 303,
          headers: { Location: `/login?next=${encodeURIComponent(url.pathname + url.search)}`, "Cache-Control": "no-store" },
        });
      }
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized", login: "/login" }), {
        status: 401,
        headers: { ...writeHeaders, "WWW-Authenticate": 'Bearer realm="ev-log"' },
      });
    }

    // 1. Interactive EV Web Dashboard & Management Prototype
    const validPaths = [
      "/", "/dashboard", "/charging", "/manage", "/trips",
      "/vehicles", "/vehicle-detail", "/charging-history",
      "/add-charging", "/cost-analysis", "/reports", "/settings", "/drivers", "/ask"
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

    // 2.1 Battery Health & Telemetry Pro (ผลวิเคราะห์แบตเตอรี่อย่างเดียว)
    if (request.method === "GET" && url.pathname === "/api/battery") {
      const payload = await fetchDashboardDataFromSheets(env);
      const body = payload.ok
        ? { ok: true, battery: payload.data?.battery ?? null }
        : { ok: false, error: payload.error };
      return new Response(JSON.stringify(body), {
        status: payload.ok ? 200 : 500,
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
          ...bodyExtCells(body),
        ];

        const res = await appendRawRowToGoogleSheet(rowValues, env);
        return new Response(JSON.stringify({ ok: true, message: "Record added successfully", res }), {
          headers: writeHeaders,
        });
      } catch (err: any) {
        console.error("POST /api/records error:", err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), {
          status: 500,
          headers: writeHeaders,
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
            headers: writeHeaders,
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
          ...bodyExtCells(body),
        ];

        const res = await updateSheetRow(rowIndex, rowValues, env);
        return new Response(JSON.stringify({ ok: true, message: "Record updated successfully", res }), {
          headers: writeHeaders,
        });
      } catch (err: any) {
        console.error("PUT /api/records error:", err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), {
          status: 500,
          headers: writeHeaders,
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
            headers: writeHeaders,
          });
        }
        const res = await deleteSheetRow(rowIndex, env);
        return new Response(JSON.stringify({ ok: true, message: "Record deleted successfully", res }), {
          headers: writeHeaders,
        });
      } catch (err: any) {
        console.error("DELETE /api/records error:", err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), {
          status: 500,
          headers: writeHeaders,
        });
      }
    }



    // 3.0 Ask EV Log: ถามข้อมูลจากชีต + ค้นเว็บ (ผ่าน auth gate ด้านบนแล้ว)
    if (request.method === "POST" && url.pathname === "/api/ask") {
      try {
        const body: any = await request.json();
        const question = (body.question || "").toString();
        const history: AskTurn[] = Array.isArray(body.history) ? body.history : [];
        const payload = await fetchDashboardDataFromSheets(env);
        if (!payload.ok) throw new Error(payload.error || "ดึงข้อมูลชีตไม่สำเร็จ");
        const result = await askEvAssistant(question, payload, env, { channel: "web", history });
        return new Response(JSON.stringify({ ok: true, ...result }), { headers: writeHeaders });
      } catch (err: any) {
        console.error("/api/ask error:", err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), {
          status: 500,
          headers: writeHeaders,
        });
      }
    }

    // 3.05 Admin Accounts (ผ่าน auth gate ด้านบนแล้ว)
    if (url.pathname === "/api/admins") {
      try {
        if (request.method === "GET") {
          return new Response(
            JSON.stringify({ ok: true, admins: summarize(await readAdmins(env)), me: await currentUser(request, env) }),
            { headers: writeHeaders }
          );
        }
        if (request.method === "POST") {
          const body: any = await request.json();
          const me = await currentUser(request, env);
          const saved = await setAdminPassword(body.username, (body.password || "").toString(), env);
          const headers: Record<string, string> = { ...writeHeaders };
          // เปลี่ยนรหัสของตัวเอง: ออก cookie ใหม่ให้เลย ไม่ต้อง login ซ้ำ
          if (me === saved.username) headers["Set-Cookie"] = await buildSessionCookie(env, saved);
          return new Response(JSON.stringify({ ok: true, admins: summarize(await readAdmins(env)) }), { headers });
        }
        const target = normalizeUsername(url.searchParams.get("username"));
        const removed = await deleteAdmin(target, env);
        return new Response(JSON.stringify({ ok: removed, error: removed ? undefined : "ไม่พบบัญชีนี้", admins: summarize(await readAdmins(env)) }), {
          status: removed ? 200 : 404,
          headers: writeHeaders,
        });
      } catch (err: any) {
        console.error("/api/admins error:", err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 400, headers: writeHeaders });
      }
    }

    // 3.1 Vehicle Profiles (แผนที่ 4)
    if (url.pathname === "/api/vehicles" && (request.method === "GET" || request.method === "POST")) {
      try {
        if (request.method === "GET") {
          const token = await getGoogleAccessToken(env.GOOGLE_CLIENT_EMAIL, env.GOOGLE_PRIVATE_KEY);
          const vehicles = await readVehicles(env, token);
          return new Response(JSON.stringify({ ok: true, vehicles, defaultVehicleId: defaultVehicleId(vehicles) }), {
            headers: corsHeaders,
          });
        }
        const body: any = await request.json();
        const vehicles = await saveVehicle(
          {
            id: body.id,
            name: body.name,
            plate: body.plate,
            batteryKwh: parseFloat(body.batteryKwh),
            isDefault: body.isDefault === true || body.isDefault === "true",
          },
          env
        );
        return new Response(JSON.stringify({ ok: true, vehicles, defaultVehicleId: defaultVehicleId(vehicles) }), {
          headers: writeHeaders,
        });
      } catch (err: any) {
        console.error("/api/vehicles error:", err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), {
          status: request.method === "POST" ? 400 : 500,
          headers: request.method === "POST" ? writeHeaders : corsHeaders,
        });
      }
    }

    // 3.2 Expense Export (แผนที่ 4): Excel + หน้าพิมพ์/บันทึกเป็น PDF
    if (request.method === "GET" && (url.pathname === "/api/export.xlsx" || url.pathname === "/report/expense")) {
      const payload = await fetchDashboardDataFromSheets(env);
      if (!payload.ok || !payload.data) {
        return new Response(`ดึงข้อมูลไม่สำเร็จ: ${payload.error || "unknown"}`, { status: 500 });
      }
      const filter = parseExpenseFilter(url, payload.data.meta.rate);
      const report = buildExpenseReport(payload.data.rows, payload.data.meta.vehicles || [], filter);

      if (url.pathname === "/api/export.xlsx") {
        const bytes = expenseReportToXlsx(report);
        const name = `EV_Expense_${filter.month || "all"}${filter.purpose !== "all" ? "_" + filter.purpose : ""}.xlsx`;
        return new Response(bytes, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${name}"`,
            "Cache-Control": "no-store",
          },
        });
      }
      const xlsxUrl = `/api/export.xlsx${url.search}`;
      return new Response(renderExpenseReportHtml(report, xlsxUrl), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    // 4. API Cron Trigger / Test Endpoint (สั่งส่งสรุปรายสัปดาห์ / รายเดือนทันที)
    if (request.method === "GET" && url.pathname === "/api/cron/trigger") {
      const type = (url.searchParams.get("type") || "weekly") as "weekly" | "monthly";
      try {
        const result = await sendScheduledReport(type, env);
        return new Response(JSON.stringify({ ok: true, type, result }), {
          headers: writeHeaders,
        });
      } catch (err: any) {
        console.error("Manual Cron Trigger error:", err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), {
          status: 500,
          headers: writeHeaders,
        });
      }
    }

    // 5. Health check & Diagnostics Dashboard
    if (request.method === "GET" && url.pathname === "/health") {
      const isGeminiOk = !!env.GEMINI_API_KEY;
      const isLineOk = !!(env.LINE_CHANNEL_SECRET && env.LINE_CHANNEL_ACCESS_TOKEN);
      const isSheetsOk = !!(
        env.GOOGLE_APPS_SCRIPT_URL ||
        (env.SPREADSHEET_ID && env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY)
      );
      const driveFolder = env.GOOGLE_DRIVE_FOLDER_ID || "1MQJN7bk8GNUyxdfH4rECRwrR7gPeYE-e";
      const isDriveOk = !!(driveFolder && env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY);

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>🚗 EV Log Cloudflare Worker - Status</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; }
          .box { max-width: 580px; margin: 0 auto; background: #1e293b; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
          h2 { color: #38bdf8; margin-top: 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #334155; font-size: 13.5px; }
          .badge-ok { color: #4ade80; font-weight: bold; }
          .badge-no { color: #f87171; font-weight: bold; }
          a { color: #38bdf8; text-decoration: none; }
          code { font-family: monospace; background: #0f172a; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #38bdf8; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>⚡ EV Trip & Charge Log (Cloudflare Worker)</h2>
          <p style="color: #94a3b8;">Serverless 24/7 Webhook, AI Vision OCR & Live Dashboard</p>
          <div class="item">
            <span>Gemini Vision API:</span>
            <span class="${isGeminiOk ? "badge-ok" : "badge-no"}">${isGeminiOk ? "✅ Ready" : "❌ Missing GEMINI_API_KEY"}</span>
          </div>
          <div class="item">
            <span>LINE Messaging API:</span>
            <span class="${isLineOk ? "badge-ok" : "badge-no"}">${isLineOk ? "✅ Ready (Flex Enabled)" : "❌ Missing Token/Secret"}</span>
          </div>
          <div class="item">
            <span>Scheduled Reports (Cron):</span>
            <span class="badge-ok">✅ Ready (Sun 20:00 & 1st 20:00 TH)</span>
          </div>
          <div class="item">
            <span>Google Sheets Sync:</span>
            <span class="${isSheetsOk ? "badge-ok" : "badge-no"}">${isSheetsOk ? "✅ Ready" : "❌ Missing Credentials"}</span>
          </div>
          <div class="item">
            <span>Google Drive Storage:</span>
            <span class="${isDriveOk ? "badge-ok" : "badge-no"}">${isDriveOk ? "✅ Ready" : "❌ Missing Config"}</span>
          </div>
          <div class="item">
            <span>Service Account Email:</span>
            <span><code>${env.GOOGLE_CLIENT_EMAIL || "Not set"}</code></span>
          </div>
          <div class="item">
            <span>Drive Folder ID:</span>
            <span><code>${driveFolder}</code></span>
          </div>
          <div style="margin-top: 18px; padding-top: 15px; border-top: 1px solid #334155;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; font-weight: bold;">⚡ ทดสอบส่งรายงานสรุปเข้า LINE ทันที:</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <a href="/api/cron/trigger?type=weekly" target="_blank" style="display: inline-block; background: #0284c7; color: #ffffff; padding: 7px 12px; border-radius: 6px; font-size: 12px; text-decoration: none; font-weight: bold;">🚀 ยิงรายงาน Weekly Digest</a>
              <a href="/api/cron/trigger?type=monthly" target="_blank" style="display: inline-block; background: #0d9488; color: #ffffff; padding: 7px 12px; border-radius: 6px; font-size: 12px; text-decoration: none; font-weight: bold;">🏆 ยิงรายงาน Monthly Digest</a>
            </div>
          </div>
          <div style="margin-top: 20px; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            <p><strong>📊 Live Web Dashboard:</strong> <a href="${url.origin}/" target="_blank">Open Dashboard</a></p>
            <p><strong>📁 Google Drive Folder:</strong> <a href="https://drive.google.com/drive/folders/${driveFolder}" target="_blank">Open Folder</a></p>
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

  async scheduled(
    event: any,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`[Cron Trigger] Fired with cron: "${event.cron}" at ${new Date().toISOString()}`);
    ctx.waitUntil(handleScheduledReport(event.cron || "", env));
  },
};

// waitUntil ของ Worker ทำงานต่อได้ราว 30 วินาทีหลังตอบ LINE ถ้าเกินจะถูกตัดทิ้งโดยไม่มีการตอบกลับ
// จึงตั้งงบเวลาไว้ต่ำกว่านั้น: Gemini ลองได้ถึง ~18 วินาที และตอบผู้ใช้ไม่เกิน 24 วินาทีเสมอ
const IMAGE_BUDGET_MS = 24000;
const GEMINI_BUDGET_MS = 18000;

/**
 * ประมวลผลรูปภาพใน Background ผ่าน Cloudflare Worker waitUntil
 */
async function handleImageEvent(event: any, env: Env): Promise<void> {
  const startedAt = Date.now();
  let replied = false;
  // ตอบได้ครั้งเดียว (reply token ใช้ได้ครั้งเดียว และกันการตอบซ้ำหลังตัวกันเวลาทำงาน)
  const reply = async (messages: any[]): Promise<void> => {
    if (replied) return;
    replied = true;
    await replyLineMessage(event.replyToken, messages, env.LINE_CHANNEL_ACCESS_TOKEN);
  };

  // แสดงจุดกำลังพิมพ์ทันที ผู้ใช้จะรู้ว่าบอทกำลังประมวลผล (เฉพาะแชท 1:1)
  if (event.source?.type === "user") {
    await showLineLoading(event.source.userId, env.LINE_CHANNEL_ACCESS_TOKEN, 30);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const watchdog = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), IMAGE_BUDGET_MS);
  });
  const outcome = await Promise.race([
    processImageEvent(event, env, startedAt, reply).then(() => "done" as const),
    watchdog,
  ]);
  if (timer !== undefined) clearTimeout(timer);

  if (outcome === "timeout" && !replied) {
    console.error(`[Image] exceeded ${IMAGE_BUDGET_MS} ms budget, replying before waitUntil is cut off`);
    try {
      await reply([
        {
          type: "text",
          text:
            "⏳ ประมวลผลรูปนานเกินไป (Gemini หรือ Google Sheets ตอบช้า)\n" +
            "ตรวจในแดชบอร์ดก่อนว่ารายการถูกบันทึกหรือยัง ถ้ายังไม่มี ให้ส่งรูปใหม่อีกครั้ง\n" +
            "https://ev-log-bot.eb-book.workers.dev/",
        },
      ]);
    } catch (e) {
      console.error("Failed to send timeout reply to LINE:", e);
    }
  }
}

async function processImageEvent(
  event: any,
  env: Env,
  startedAt: number,
  reply: (messages: any[]) => Promise<void>
): Promise<void> {
  const messageId = event.message.id;

  try {
    console.log(`[1/4] Fetching image from LINE messageId: ${messageId}`);
    const imageBase64 = await fetchLineImageBase64(messageId, env.LINE_CHANNEL_ACCESS_TOKEN);

    // งานที่ไม่ต้องรอผล Gemini เริ่มพร้อมกันเลย: อัปโหลด Drive และอ่านรถ/ชื่อผู้ส่ง
    const folderId = env.GOOGLE_DRIVE_FOLDER_ID || "1MQJN7bk8GNUyxdfH4rECRwrR7gPeYE-e";
    const nowStr = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `EV_Log_${nowStr}_${messageId.slice(-6)}.jpg`;
    const drivePromise: Promise<string | null> = (async () => {
      try {
        console.log(`[Google Drive] Uploading image: ${filename} to folder: ${folderId}...`);
        const driveRes = await uploadImageToGoogleDrive(imageBase64, filename, folderId, env);
        if (driveRes) {
          console.log(`[Google Drive] Uploaded successfully: ${driveRes.webViewLink}`);
          return driveRes.webViewLink;
        }
      } catch (dErr: any) {
        console.warn("[Google Drive] Upload skipped or failed:", dErr?.message || dErr);
      }
      return null;
    })();
    const extPromise = lineRowExt(event, env);

    console.log(`[2/4] Sending image to Gemini Vision API...`);
    const analysis = await analyzeEVImageWithGemini(imageBase64, env, "image/jpeg", startedAt + GEMINI_BUDGET_MS);
    console.log(`[2/4] Gemini extraction completed: type=${analysis.type} (${Date.now() - startedAt} ms)`);

    let replyMessageText = "";
    let sheetStatus = "✅ บันทึกลง Google Sheets แล้ว";
    const isCharging = analysis.type === "charging" && !!analysis.charging_data;
    const [driveLink, ext] = await Promise.all([drivePromise, extPromise]);

    let flexMessage: any;
    if (isCharging && analysis.charging_data) {
      const record = buildChargingRecord(analysis.charging_data, env);
      if (driveLink) {
        record.note = record.note ? `${record.note} [Drive]` : "[Drive]";
      }

      try {
        console.log(`[3/4] Appending row to Google Sheet (Charging)...`);
        const res = await appendChargingToGoogleSheet(record, env, ext);
        console.log(`[3/4] Google Sheet append successful to '${res.sheetName}'!`);
        sheetStatus = `✅ บันทึกลง ${res.sheetName} แล้ว`;
      } catch (sheetErr: any) {
        console.error("Google Sheet append error:", sheetErr);
        sheetStatus = `⚠️ บันทึกลง Sheets ไม่สำเร็จ: ${sheetErr.message}`;
      }

      replyMessageText = formatChargingSummaryText(record, sheetStatus);
      flexMessage = buildChargingFlex(record, sheetStatus, driveLink);
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
      if (driveLink) {
        record.note = record.note ? `${record.note} [Drive]` : "[Drive]";
      }

      try {
        console.log(`[3/4] Appending row to Google Sheet (Trips)...`);
        const res = await appendTripToGoogleSheet(record, env, ext);
        console.log(`[3/4] Google Sheet append successful to '${res.sheetName}'!`);
        sheetStatus = `✅ บันทึกลง ${res.sheetName} แล้ว`;
      } catch (sheetErr: any) {
        console.error("Google Sheet append error:", sheetErr);
        sheetStatus = `⚠️ บันทึกลง Sheets ไม่สำเร็จ: ${sheetErr.message}`;
      }

      replyMessageText = formatTripSummaryText(record, sheetStatus);
      flexMessage = buildTripFlex(record, sheetStatus, driveLink);
    }

    console.log(`[4/4] Replying to LINE user with Interactive Flex Message... (${Date.now() - startedAt} ms)`);
    try {
      await reply([flexMessage]);
      console.log(`[4/4] Flex message reply sent successfully!`);
    } catch (flexErr) {
      console.warn("Flex message failed, falling back to text message:", flexErr);
      // reply token ถูกใช้ไปแล้วถ้า LINE ปฏิเสธการ์ด จึงส่งข้อความสำรองผ่าน replyLineMessage ตรงๆ
      await replyLineMessage(event.replyToken, [{ type: "text", text: replyMessageText }], env.LINE_CHANNEL_ACCESS_TOKEN);
      console.log(`[4/4] Fallback text message sent successfully!`);
    }

  } catch (err: any) {
    console.error("Error processing image event:", err);
    try {
      await reply([{ type: "text", text: `⚠️ เกิดข้อผิดพลาดในการประมวลผลภาพ:\n${err?.message || err}` }]);
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

  const purposeCmd: Record<string, "business" | "personal"> = {
    "งาน": "business", "ธุรกิจ": "business", "business": "business", "#งาน": "business",
    "ส่วนตัว": "personal", "personal": "personal", "#ส่วนตัว": "personal",
  };
  if (purposeCmd[text]) {
    const reply = await tagLatestRecordPurpose(event, purposeCmd[text], env);
    await replyLineMessage(replyToken, [{ type: "text", text: reply }], env.LINE_CHANNEL_ACCESS_TOKEN);
    return;
  }

  const helpWords = ["help", "?", "วิธีใช้", "ช่วยเหลือ", "เมนู", "menu", "สวัสดี", "hi", "hello"];
  if (text && !helpWords.includes(text)) {
    await replyLineMessage(replyToken, [{ type: "text", text: await answerLineQuestion(event, env) }], env.LINE_CHANNEL_ACCESS_TOKEN);
    return;
  }

  const guide =
    "🚗 [ระบบบันทึก EV Trip & Charge Log]\n" +
    "━━━━━━━━━━━━━━━━━━━━\n" +
    "ถ่ายรูปหน้าปัดเรือนไมล์ หรือหน้าจอแอปชาร์จไฟ แล้วส่งรูปเข้ามาในแชทนี้ได้เลยครับ!\n\n" +
    "🤖 Gemini AI จะอ่านข้อมูล คำนวณค่าไฟ และบันทึกลง Google Sheets ให้อัตโนมัติทันที 24 ชม.\n\n" +
    "📊 ดูสรุปภาพรวมแดชบอร์ด:\n" +
    "https://ev-log-bot.eb-book.workers.dev/\n\n" +
    "🏷️ ส่งรูปแล้วพิมพ์ \"งาน\" หรือ \"ส่วนตัว\" เพื่อระบุประเภทของรายการล่าสุด (ใช้ออกรายงานเบิกจ่าย)\n\n" +
    "💬 พิมพ์ถามได้เลย เช่น \"เดือนนี้ค่าชาร์จเท่าไร\", \"ทริปไหนกินไฟที่สุด\", \"ค่า Ft งวดนี้เท่าไร\"\n\n" +
    "⚡ รายงานค่าใช้จ่ายการชาร์จไฟ (สัปดาห์/เดือน/ปี):\n" +
    "https://ev-log-bot.eb-book.workers.dev/charging";

  await replyLineMessage(
    replyToken,
    [{ type: "text", text: guide }],
    env.LINE_CHANNEL_ACCESS_TOKEN
  );
}

/**
 * จัดการเมื่อ Cloudflare Cron Trigger ทำงานตามตารางเวลา
 */
async function handleScheduledReport(cronPattern: string, env: Env): Promise<void> {
  // ตรวจสอบว่าเป็นรอบเดือนหรือรอบสัปดาห์
  // "0 13 1 * *" -> monthly
  // "0 13 * * 0" -> weekly
  const isMonthly = cronPattern.includes(" 1 * *") || cronPattern.startsWith("0 13 1 ");
  const type: "weekly" | "monthly" = isMonthly ? "monthly" : "weekly";
  console.log(`[Scheduled Report] Triggered for pattern '${cronPattern}', detected type: ${type}`);
  await sendScheduledReport(type, env);
}

/**
 * ดึงข้อมูลจาก Sheets คำนวณสรุปสถิติรอบสัปดาห์หรือเดือน และส่ง Flex Message เข้า LINE
 */
export async function sendScheduledReport(
  type: "weekly" | "monthly",
  env: Env
): Promise<{ ok: boolean; summary: any; method: string; fallbackText?: boolean }> {
  console.log(`[Scheduled Report] Fetching sheet data for ${type} summary...`);
  const payload = await fetchDashboardDataFromSheets(env);
  const rows = payload.data?.rows || [];

  const summary = generatePeriodSummary(rows, type);
  console.log(
    `[Scheduled Report] Summary: ${summary.title} | ${summary.dateRangeStr} | km=${summary.totalKm} | savings=฿${summary.savingsThb}`
  );

  const flexMessage = buildPeriodReportFlex(summary);
  const textFallback = formatPeriodSummaryText(summary);

  try {
    const res = await pushOrBroadcastLineMessage(
      [flexMessage],
      env.LINE_CHANNEL_ACCESS_TOKEN,
      env.LINE_USER_ID
    );
    console.log(`[Scheduled Report] Flex message successfully dispatched via ${res.method}!`);
    return { ok: true, summary, method: res.method };
  } catch (err: any) {
    console.warn(`[Scheduled Report] Flex message failed, falling back to text:`, err);
    const res = await pushOrBroadcastLineMessage(
      [{ type: "text", text: textFallback }],
      env.LINE_CHANNEL_ACCESS_TOKEN,
      env.LINE_USER_ID
    );
    return { ok: true, summary, method: res.method, fallbackText: true };
  }
}

/** คอลัมน์ N:P (รถ/ผู้ขับ/ประเภท) จาก body ของ API — คืน [] ถ้า client ไม่ได้ส่งมา เพื่อคงค่าเดิมในชีต */
function bodyExtCells(body: any): string[] {
  if (!("vehicle" in body) && !("driver" in body) && !("purpose" in body)) return [];
  return extToCells({
    vehicle: body.vehicle,
    driver: body.driver,
    purpose: normalizePurpose(body.purpose),
  });
}

function parseExpenseFilter(url: URL, defaultRate: number): ExpenseFilter {
  const month = (url.searchParams.get("month") || "").trim();
  const purpose = (url.searchParams.get("purpose") || "all").trim();
  const rate = parseFloat(url.searchParams.get("rateKm") || "0");
  return {
    month: /^\d{4}-\d{2}$/.test(month) ? month : "",
    vehicleId: (url.searchParams.get("vehicle") || "all").trim() || "all",
    purpose: purpose === "business" || purpose === "personal" ? purpose : "all",
    driver: url.searchParams.has("driver") ? (url.searchParams.get("driver") || "").trim() : "all",
    ratePerKm: rate > 0 && rate < 1000 ? rate : 0,
    electricityRate: defaultRate,
  };
}

/** รถคันหลัก + ชื่อ LINE ของผู้ส่งเป็นผู้ขับ (รายการจาก LINE เริ่มต้นเป็น "ส่วนตัว") */
async function lineRowExt(event: any, env: Env): Promise<Partial<RowExt>> {
  let vehicle = "";
  try {
    const token = await getGoogleAccessToken(env.GOOGLE_CLIENT_EMAIL, env.GOOGLE_PRIVATE_KEY);
    vehicle = defaultVehicleId(await readVehicles(env, token));
  } catch (e) {
    console.warn("[Fleet] cannot read vehicles, leaving vehicle blank (= default):", e);
  }
  const driver = await fetchLineDisplayName(event.source?.userId, env.LINE_CHANNEL_ACCESS_TOKEN);
  return { vehicle, driver, purpose: "personal" };
}

/** ติดป้าย งาน/ส่วนตัว ให้รายการล่าสุดของผู้ส่ง (ถ้าหาไม่เจอใช้รายการล่าสุดในชีต) */
async function tagLatestRecordPurpose(event: any, purpose: "business" | "personal", env: Env): Promise<string> {
  try {
    const payload = await fetchDashboardDataFromSheets(env);
    const rows: any[] = payload.data?.rows || [];
    const title = payload.data?.meta.sheetTitle;
    if (!rows.length || !title) return "⚠️ ยังไม่มีรายการในชีตให้ระบุประเภท";

    const driver = await fetchLineDisplayName(event.source?.userId, env.LINE_CHANNEL_ACCESS_TOKEN);
    const byRow = [...rows].sort((a, b) => b.sheetRowIndex - a.sheetRowIndex);
    const target = (driver && byRow.find((r) => r.driver === driver)) || byRow[0];

    await setRowPurpose(target.sheetRowIndex, purpose, env, title);
    const what = target.kind === "trip" ? `ทริป ${target.km} km` : `ชาร์จ ${target.kwh} kWh`;
    return `✅ ระบุ "${purpose === "business" ? "งาน" : "ส่วนตัว"}" ให้รายการล่าสุดแล้ว\n${target.iso} ${target.time} · ${what}`;
  } catch (err: any) {
    console.error("tagLatestRecordPurpose error:", err);
    return `⚠️ ระบุประเภทไม่สำเร็จ: ${err?.message || err}`;
  }
}

/** ตอบคำถามจาก LINE: เฉพาะบัญชีที่อนุญาตเท่านั้น (ข้อมูลการเดินทางเป็นข้อมูลส่วนตัว) */
async function answerLineQuestion(event: any, env: Env): Promise<string> {
  const userId: string | undefined = event.source?.userId;
  if (event.source?.type && event.source.type !== "user") {
    return "💬 ถามข้อมูลได้เฉพาะในแชทส่วนตัวกับบอทเท่านั้น";
  }
  if (!isLineUserAllowed(userId, env)) {
    return (
      "🔒 บัญชีนี้ยังไม่ได้รับอนุญาตให้ถามข้อมูล\n" +
      "เจ้าของระบบเพิ่มสิทธิ์ได้โดยตั้งค่า LINE_ALLOWED_USER_IDS บน Cloudflare Worker เป็นรหัสนี้:\n" +
      (userId || "(ไม่พบรหัสผู้ใช้)")
    );
  }
  try {
    await showLineLoading(userId, env.LINE_CHANNEL_ACCESS_TOKEN);
    const payload = await fetchDashboardDataFromSheets(env);
    if (!payload.ok) throw new Error(payload.error || "ดึงข้อมูลชีตไม่สำเร็จ");
    const result = await askEvAssistant((event.message?.text || "").toString(), payload, env, { channel: "line" });
    return formatAnswerForLine(result);
  } catch (err: any) {
    console.error("answerLineQuestion error:", err);
    return `⚠️ ตอบคำถามไม่สำเร็จ: ${err?.message || err}`;
  }
}
