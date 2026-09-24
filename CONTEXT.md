# 🚗 CONTEXT.md - EV Log Hub System Architecture & Development Context

> **เอกสารบริบททางเทคนิค (Context Document) สำหรับ AI Agent และนักพัฒนาเพื่อใช้ทำงานต่อในระบบได้ทันที**  
> *วันที่อัปเดตล่าสุด:* 23 กันยายน 2026  
> *ยานพาหนะหลักในระบบ:* XPENG G6 Standard Range (LFP Battery 68.5 kWh)  
> *สเปกการคำนวณพื้นฐาน:* ค่าไฟ 4.90 ฿/หน่วย, ประสิทธิภาพชาร์จบ้าน 90% (Loss 10%), น้ำมันเทียบเคียง 14 กม./ลิตร (38 ฿/ลิตร)

---

## 1. Project Overview

ระบบ **EV Log Hub** คือแพลตฟอร์มบริหารจัดการและบันทึกข้อมูลการเดินทาง (Trips) และการชาร์จไฟฟ้า (Charging) ของยานยนต์ไฟฟ้า (EV) แบบอัตโนมัติ 24/7 เพื่อลดภาระการบันทึกข้อมูลของผู้ใช้ให้เหลือ 0 ขั้นตอน (Zero-effort logging)

### ฟีเจอร์หลัก (Core Features):
1. **AI Vision OCR (Gemini Vision)**: ผู้ใช้เพียงถ่ายรูปหน้าปัดเรือนไมล์ หรือแคปหน้าจอบิล/สลิปการชาร์จจากแอปใดก็ได้ (PEA Volta, PTT EV Station Pluz, EA Anywhere ฯลฯ) ส่งเข้า LINE Bot ระบบจะอ่านค่า Odometer, ระยะทาง, SOC %, kWh, ยอดเงินสุทธิ และชื่อสถานีโดยอัตโนมัติ
2. **Cloud Storage Backup (Google Drive)**: รูปภาพสลิปและหน้าปัดรถจะถูกอัปโหลดสำรองลง Google Drive โฟลเดอร์ที่กำหนดโดยอัตโนมัติ พร้อมสร้าง URL ลิงก์ตรง
3. **Dual Data Persistence (Google Sheets)**: บันทึกข้อมูลลง Google Sheets แบบแยกโครงสร้างข้อมูลมาตรฐาน A:M รองรับทั้งการเรียกดูและแก้ไขย้อนหลัง
4. **Interactive LINE Flex Messages**: ตอบกลับผลลัพธ์เป็นการ์ด Flex Message ดีไซน์ Modern Clean พร้อม Hero Metrics, Badge แยกประเภท (`AC ชาร์จบ้าน` vs `DC Fast Charge`), และปุ่มกดด่วน (`📊 เปิดดูแดชบอร์ด`, `📁 ดูรูปใน Google Drive`)
5. **Scheduled Executive Digests (Cron Triggers)**: ส่งรายงานสรุปสถิติอัตโนมัติเข้า LINE:
   - **Weekly Digest**: ทุกวันอาทิตย์ เวลา 20:00 น. (เวลาไทย)
   - **Monthly Digest**: ทุกวันที่ 1 ของเดือน เวลา 20:00 น. (เวลาไทย)
6. **Executive Web Dashboard (Responsive Single-File)**:
   - จำลองกราฟิกตัวรถและ Telemetry (SOC %, Odometer, คาดการณ์ระยะทางวิ่งได้)
   - 6 KPI Card (Wh/km, Odometer, พลังงานรวม, ค่าชาร์จรวม, ต้นทุน ฿/กม., เงินประหยัดเทียบน้ำมัน)
   - 2x2 Data Visualization Hub (แนวโน้ม Wh/km, สัดส่วน AC/DC & Charging Network, กราฟแท่งรายเดือน, กราฟจัดกลุ่มประสิทธิภาพตามระยะทาง)
   - ระบบค้นหา กรองข้อมูล แก้ไข และลบข้อมูล (CRUD) พร้อมหน้ารายงานสรุปเชิงลึก (Reports View)

---

## 2. Tech Stack & Environment

### Production Backend (Cloudflare Workers)
- **Runtime**: Cloudflare Workers (Serverless V8 Isolate)
  - `compatibility_date`: `2024-09-01`
  - `compatibility_flags`: `["nodejs_compat"]`
- **Language**: TypeScript 5.7.3
- **CLI / Deployment**: Wrangler 3.114+ (`npx wrangler`)
- **Crypto & Signatures**: Web Crypto API (`crypto.subtle` สำหรับ HMAC-SHA256 และ RSASSA-PKCS1-v1_5)
- **Zero Runtime Dependencies**: โค้ดทั้งหมดใช้มาตรฐาน Web Standard Fetch API และ Native Modules ไม่พึ่งพาแพ็กเกจ npm หนักๆ ตอนรัน

### External APIs & Integrations
- **AI Vision OCR**: Google Gemini API (`gemini-3.6-flash` / `gemini-1.5-flash`)
- **Database**: Google Sheets API v4 (ยืนยันตัวตนผ่าน Google Service Account JWT แบบเซิร์ฟเวอร์ต่อเซิร์ฟเวอร์)
- **File Storage**: Google Drive API v3 (อัปโหลดแบบ Multipart/related ด้วย Service Account)
- **Messaging**: LINE Messaging API
  - Webhook: HMAC-SHA256 signature verification
  - Messaging: Reply API (`/v2/bot/message/reply`), Push API (`/v2/bot/message/push`), Broadcast API (`/v2/bot/message/broadcast`)
  - Layout: LINE Flex Message format (Bubble layout)

### Web Frontend (Embedded Dashboard)
- **Architecture**: Single-page SSR/CSR hybrid rendered directly from Worker (`dashboardView.ts`)
- **Styling**: Vanilla CSS3 Custom Properties (Design Tokens, Dark/Light theme toggle)
- **Typography**: Google Fonts (`Plus Jakarta Sans`, `Anuphan`, `JetBrains Mono`)
- **Graphics**: Pure SVG Charting (Zero chart library overhead)

### Python Prototype / Legacy Scripts (Root Directory)
- Python 3.10+, FastAPI, `google-generativeai`, `gspread`, `pydantic` (ใช้สำหรับการทดสอบแบบ Local script)

---

## 3. Project Structure

```text
d:\ev\
│   CONTEXT.md                       # เอกสารสรุปบริบทฉบับนี้
│   ROADMAP.md                       # แผนกลยุทธ์และ Backlog รายการพัฒนา
│   README.md                        # คำอธิบายภาพรวมโครงการ
│   EV_Log_App_Spec.md               # สเปกระบบตั้งต้น
│   requirements.txt                 # ไลบรารี Python สำหรับ Local CLI
│   sample_sheet.csv                 # ตัวอย่างโครงสร้างชีต CSV
│
├───cloudflare-worker/               # [PRODUCTION BACKEND] ซอร์สโค้ดหลักที่ Deploy ใช้งานจริง
│   │   package.json                 # Project manifest & devDependencies
│   │   tsconfig.json                # TypeScript compiler config
│   │   wrangler.toml                # Worker configuration, Bindings & Cron Triggers
│   │
│   └───src/
│           index.ts                 # Worker Entrypoint, HTTP Router, Scheduled Handler
│           types.ts                 # TypeScript Interfaces & Environment Bindings
│           gemini.ts                # Gemini Vision OCR Integration & Prompt Engineering
│           calculator.ts            # EV Business Logic & Technical Formulas
│           sheets.ts                # Google Service Account JWT & Sheets API CRUD
│           drive.ts                 # Google Drive API Multipart File Upload
│           line.ts                  # LINE Signature, Reply/Push/Broadcast, Flex Builders
│           reports.ts               # Weekly & Monthly Aggregator, Date Utils
│           dashboardData.ts         # Google Sheets Data Pipeline & Normalization
│           dashboardView.ts         # Executive Web Dashboard HTML/SVG Renderer
│           battery.ts               # Battery Health & Telemetry Pro (SoH, Range Predictor, DC Profiler)
│           tou.ts                   # TOU What-If: แยก kWh ชาร์จบ้านเป็น On/Off-Peak
│
├───config/                          # [Python Legacy]
├───models/                          # [Python Legacy]
├───services/                        # [Python Legacy]
├───scripts/                         # [Python Legacy]
└───webhook/                         # [Python Legacy]
```

---

## 4. Key Data Models & Schemas

### 1. Google Sheets Column Structure (A ถึง M)
แถวข้อมูลใน Google Sheets มีทั้งหมด 13 คอลัมน์ (Index 0 ถึง 12):
| Index | คอลัมน์ | ชนิดข้อมูล | ตัวอย่าง | คำอธิบาย |
| :---: | :--- | :---: | :--- | :--- |
| **A** | `Date` | String | `2026-09-22` | วันที่บันทึก (YYYY-MM-DD) |
| **B** | `Time` | String | `18:30` | เวลาบันทึก (HH:mm) |
| **C** | `Odo_Start` | Number | `2005` | เลขไมล์เริ่มต้นทริป (กม.) |
| **D** | `Odo_End` | Number | `2050` | เลขไมล์สิ้นสุดทริป (กม.) |
| **E** | `Distance_km`| Number | `45.0` | ระยะทางขับขี่ (กม.) |
| **F** | `Duration_min`| Number | `55` | ระยะเวลาเดินทาง (นาที) |
| **G** | `Avg_Consumption`| Number| `13.5` | อัตราสิ้นเปลือง (kWh/100km หรือ Wh/km) |
| **H** | `SoC_Start` | String | `80%` | แบตเตอรี่เริ่มต้น |
| **I** | `SoC_End` | String | `68%` | แบตเตอรี่สิ้นสุด |
| **J** | `Energy_kWh` | Number | `6.08` | พลังงานที่ใช้ (Trip) หรือ พลังงานที่ชาร์จเข้า (Charge) |
| **K** | `Cost_Net_THB` | Number | `29.77` | ค่าไฟสุทธิ (บาท) |
| **L** | `Cost_Grid_THB`| Number | `33.08` | ค่าไฟรวม Loss ตามมิเตอร์ (บาท) |
| **M** | `Note` | String | `PEA Volta [Drive]` | รายละเอียดสถานี, ประเภทชาร์จ, แท็กรูปภาพ |

### 2. TypeScript Interfaces (`cloudflare-worker/src/types.ts`)

```typescript
export interface Env {
  BATTERY_CAPACITY_KWH: string;
  ELECTRICITY_RATE_THB: string;
  CHARGING_EFFICIENCY: string;
  GEMINI_MODEL: string;
  GEMINI_API_KEY: string;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  SPREADSHEET_ID: string;
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_DRIVE_FOLDER_ID?: string;
  LINE_USER_ID?: string;
}

export interface TripRecord {
  trip_id: string;
  date: string;
  time: string;
  odo_start: number | "";
  odo_end: number | "";
  distance_km: number | "";
  duration_min: number | "";
  avg_consumption: number | "";
  soc_start: string;
  soc_end: string;
  energy_kwh: number | "";
  cost_net_thb: number | "";
  cost_grid_thb: number | "";
  note: string;
}

export interface ChargingRecord {
  charge_id: string;
  start_datetime: string;
  end_datetime: string;
  duration_min: number | "";
  soc_start: string;
  soc_end: string;
  net_kwh: number | "";
  grid_kwh: number | "";
  cost_net_thb: number | "";
  cost_grid_thb: number | "";
  location: string;
  note: string;
}

export interface PeriodSummary {
  periodType: "weekly" | "monthly";
  title: string;
  dateRangeStr: string;
  totalTrips: number;
  totalKm: number;
  totalDurationMin: number;
  avgConsumptionWhKm: number;
  totalChargedKwh: number;
  totalCostThb: number;
  totalCharges: number;
  acCharges: number;
  dcCharges: number;
  homeKwh: number;
  homeCostThb: number;
  dcKwh: number;
  dcCostThb: number;
  costPerKmThb: number;
  gasolineEquivCostThb: number;
  savingsThb: number;
  odoStart: number | null;
  odoEnd: number | null;
}
```

---

## 5. Coding Standards & Architectural Patterns

### 1. Functional & Stateless Micro-Modules
- แยกหน้าที่การทำงานตาม Single Responsibility Principle (SRP)
- ทุกฟังก์ชันที่ต้องติดต่อกับภายนอกจะรับ `env: Env` เข้าไปแบบชัดเจน ปราศจาก Global state หรือ Singleton ที่อาจเกิด Concurrency issue บน Cloudflare Worker

### 2. การจำแนกประเภทข้อมูลอย่างเคร่งครัด (Strict Kind Separation)
- ใน `dashboardData.ts` แถวข้อมูลจะถูกจัดประเภทเป็น `kind: "charge"` หรือ `kind: "trip"`:
  - หาก `km > 0` หรือมีระยะทางขับขี่ -> จัดเป็น `trip` เสมอ
  - หาก `km === 0` และมีประจุไฟ/ยอดเงิน/คำว่า charge -> จัดเป็น `charge`
- **ข้อควรระวังสำคัญ:** ในการคำนวณสถิติการชาร์จ (`reports.ts` และ `dashboardView.ts`) ต้องตรวจสอบ `r.kind === "charge"` เท่านั้น ห้ามนำ `r.kwh` หรือ `r.net` ของแถว `trip` มารวม เพราะจะทำให้ยอดค่าใช้จ่ายซ้ำซ้อน

### 3. การแปลงหน่วยอัตราสิ้นเปลือง (Consumption Normalization)
- หากเก็บเป็น `kWh/100km` (เช่น `13.2` ถึง `25.0`): ให้คูณ `10` เพื่อแปลงเป็น `Wh/km` (เช่น `13.2 * 10 = 132 Wh/km`)
- หากเก็บเป็น `Wh/km` อยู่แล้ว (`val > 50`): ให้ใช้ค่านั้นได้ทันที

### 4. Non-Blocking Async Webhook (`ctx.waitUntil`)
- เมื่อ LINE ส่ง Webhook เข้ามา Worker ต้องตรวจสอบลายเซ็นและตอบ `200 OK` กลับไปยัง LINE ทันทีภายในไม่กี่วินาที
- งานที่ใช้เวลานาน (ดาวน์โหลดภาพ, เรียก Gemini OCR, อัปโหลด Google Drive, บันทึก Sheets, ส่ง Flex Reply) ให้ห่อด้วย `ctx.waitUntil(handleImageEvent(...))`

### 5. Graceful Fallbacks & Defensive Resilience
- **Google Drive**: หากสิทธิ์โฟลเดอร์ยังไม่ได้รับอนุญาต ระบบจะข้ามการอัปโหลดไฟล์ และยังคงบันทึกข้อมูลลง Google Sheets ต่อไปโดยไม่เกิด Crash
- **LINE Flex Message**: หากโครงสร้าง JSON ของ Flex เกิดข้อผิดพลาด ตัวระบบจะดักจับและส่งข้อความตัวอักษรธรรมดา (Plain Text Fallback) ให้อัตโนมัติทันที
- **Push vs Broadcast**: ระบบส่งรายงานจะลองส่ง Push หา `LINE_USER_ID` ก่อน หากไม่พบคอนฟิกจะ Broadcast ไปยังผู้ติดตามทุกคนทันที

---

## 6. Current Status & Completed Tasks

| ส่วนงาน / ฟีเจอร์ | สถานะ | ไฟล์ที่เกี่ยวข้อง | คำอธิบาย |
| :--- | :---: | :--- | :--- |
| **Cloudflare Worker Core** | ✅ เสร็จสมบูรณ์ | `src/index.ts`, `wrangler.toml` | REST API, Router, CORS, Webhook endpoints |
| **Gemini Vision OCR** | ✅ เสร็จสมบูรณ์ | `src/gemini.ts` | สกัดข้อมูลหน้าปัดรถยนต์ และสลิปบิลทุกค่าย |
| **Google Sheets Sync** | ✅ เสร็จสมบูรณ์ | `src/sheets.ts` | Sync ข้อมูลสองทางผ่าน Service Account JWT |
| **Google Drive Backup** | ✅ เสร็จสมบูรณ์ | `src/drive.ts` | บันทึกรูปสลิปต้นฉบับลงโฟลเดอร์อัตโนมัติ |
| **Interactive Flex Cards** | ✅ เสร็จสมบูรณ์ | `src/line.ts` | การ์ดตอบกลับการชาร์จ/เดินทาง พร้อมปุ่มลัด |
| **Scheduled Reports (Cron)**| ✅ เสร็จสมบูรณ์ | `src/reports.ts`, `src/index.ts` | สรุปรายสัปดาห์ (อาทิตย์ 20:00) และรายเดือน (วันที่ 1) |
| **Executive Web Dashboard**| ✅ เสร็จสมบูรณ์ | `src/dashboardView.ts` | 6 KPI, 2x2 Data Viz, CRUD Modal, Reports View |

### ข้อมูลระบบ Production ปัจจุบัน:
- **Worker URL**: `https://ev-log-bot.eb-book.workers.dev/`
- **Dashboard URL**: `https://ev-log-bot.eb-book.workers.dev/dashboard`
- **System Health & Test Tool**: `https://ev-log-bot.eb-book.workers.dev/health`
- **Google Drive Storage**: โฟลเดอร์ `1MQJN7bk8GNUyxdfH4rECRwrR7gPeYE-e`
- **Service Account Email**: `ev-sheets-bot@ev-book-508212.iam.gserviceaccount.com`

---

## 7. Pending Tasks & Next Steps

อ้างอิงตาม [ROADMAP.md](file:///d:/ev/ROADMAP.md) รายการพัฒนาในอนาคตถูกจัดลำดับความสำคัญไว้ดังนี้:

### 🔋 แผนที่ 2: Predictive Battery Health & Telemetry Pro (ทำแล้ว รอสะสมข้อมูล)
- [x] **SoH / Usable Capacity**: `battery.ts` → `analyzeBattery(rows, opts)` เป็น pure function ผลลัพธ์แนบอยู่ใน `/api/data` ที่ `data.battery` และมี `GET /api/battery`
  - วิธีหลัก: Σ(km × kWh/100km) ÷ Σ SOC ที่ลดลง ของทริปที่มี SOC ครบ
  - ตรวจสอบไขว้จากการชาร์จ: **ต้องตัดแถวที่ kWh = ΔSOC × ความจุ (68.8/68.5 หรือ ÷ efficiency)** เพราะเป็นค่าคำนวณ ไม่ใช่ค่ามิเตอร์
  - ฝั่ง client คำนวณ % เทียบสเปกและ EFC จาก `state.batteryCapacity` เพื่อให้ปรับค่าในหน้าตั้งค่าได้
- [x] **Degradation Curve**: แยกเป็นช่วงละ ~60% SOC ความชันจะคำนวณเมื่อมี ≥ 4 ช่วงและครอบคลุม ≥ 3,000 km
- [x] **Dynamic Range Predictor**: ใช้อัตรากินไฟจริงตามช่วงความเร็ว (≥ 60 km) ถ้าข้อมูลไม่พอใช้ค่าเฉลี่ยคูณตัวปรับ
- [x] **DC Charging Profiler**: ความเร็วเฉลี่ยต่อครั้ง และจุดตัด SOC ที่แนะนำ (ใช้ข้อมูลจริงเมื่อมี SOC จบ ≤85% และ >85% อย่างละ ≥ 2 ครั้ง)

### ⚡ แผนที่ 3: Smart TOU & Home Wallbox IoT (พักไว้: ที่บ้านยังไม่มีมิเตอร์ TOU)
- [x] **TOU What-If Calculator**: `tou.ts` → `analyzeTou(rows)` แนบใน `/api/data` ที่ `data.tou` แสดงผลในหน้า `/cost-analysis`
  - แยก kWh การชาร์จบ้านตามนาทีที่ชาร์จจริง On-Peak = จ.-ศ. 09:00-22:00 (ไม่ได้นับวันหยุดราชการ)
  - ช่วงเวลาชาร์จ: ถ้าโน้ตมี "HH:MM - HH:MM" ใช้ช่วงนั้น, ถ้าเวลาที่บันทึกอยู่ในช่วง 04:00-12:00 ถือเป็นเวลาจบ, นอกนั้นถือเป็นเวลาเริ่ม, ถ้าไม่มีระยะเวลาประมาณจาก kWh ÷ กำลังชาร์จบ้านที่วัดได้
  - การคิดเงินทำฝั่ง client (อัตราและการใช้ไฟของบ้านปรับได้ บันทึกใน localStorage `ev_rate_onpeak`, `ev_rate_offpeak`, `ev_tou_*`)
- [ ] **TOU Charging Cost Classifier / LINE Reminder 22:00**: รอเปลี่ยนเป็นมิเตอร์ TOU
- [ ] **Solar Self-Consumption Estimator**
- [ ] **Smart Meter Webhook Integration**: ไม่ต้องรอมิเตอร์ TOU

### 🚗 แผนที่ 4: Multi-Car Fleet Management & Expense Export (ระดับความสำคัญ: ถัดไป)
- [ ] **Multi-Vehicle Profile Switcher**: เพิ่มตัวเลือกสลับโปรไฟล์รถยนต์ที่แถบเมนู (เช่น คันที่ 1: XPENG G6, คันที่ 2: BYD / Tesla) พร้อมแยกชีตหรือแท็ก
- [ ] **Expense & Tax Export (PDF / Excel)**: พัฒนาระบบส่งออกรายงานค่าใช้จ่ายประจำเดือนเป็นเอกสารมาตรฐานสำหรับเบิกจ่ายภาษีหรือค่าเดินทางบริษัท

---

## 8. Commands & Setup

### การติดตั้งและพัฒนาในเครื่อง (Local Development)
```bash
# 1. เข้าสู่โฟลเดอร์ Cloudflare Worker
cd d:\ev\cloudflare-worker

# 2. ติดตั้ง Dependencies
npm install

# 3. ตรวจสอบ Type Safety
npx tsc --noEmit

# 4. รันระบบจำลองในเครื่อง (Local Worker Emulator)
npm run dev
```

### การตั้งค่า Secrets & Environment Variables (Cloudflare)
หากต้องการอัปเดตหรือตั้งค่า Secret ตัวแปรใหม่บน Cloudflare Worker:
```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put LINE_CHANNEL_SECRET
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
npx wrangler secret put SPREADSHEET_ID
npx wrangler secret put GOOGLE_CLIENT_EMAIL
npx wrangler secret put GOOGLE_PRIVATE_KEY
```

### การ Deploy ขึ้น Production
```bash
cd d:\ev\cloudflare-worker
npx wrangler deploy
```

### คำสั่งทดสอบระบบ (Diagnostic & Test Endpoints)
```bash
# ตรวจสอบสถานะการเชื่อมต่อ Service Account และความพร้อมของระบบ
curl -s "https://ev-log-bot.eb-book.workers.dev/health"

# ทดสอบสั่งส่งรายงานสรุปประจำสัปดาห์ (Weekly Digest) เข้า LINE ทันที
curl -s "https://ev-log-bot.eb-book.workers.dev/api/cron/trigger?type=weekly"

# ทดสอบสั่งส่งรายงานสรุปประจำเดือน (Monthly Digest) เข้า LINE ทันที
curl -s "https://ev-log-bot.eb-book.workers.dev/api/cron/trigger?type=monthly"

# ดึงข้อมูล Raw JSON ของแดชบอร์ด
curl -s "https://ev-log-bot.eb-book.workers.dev/api/data"

# ดึงผลวิเคราะห์แบตเตอรี่ (SoH, Range, DC Profiler)
curl -s "https://ev-log-bot.eb-book.workers.dev/api/battery"
```
