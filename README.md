# 🚗 EV Trip & Charge Log System (Vision AI + Google Sheets + LINE Bot)

ระบบบันทึกและคำนวณข้อมูลการเดินทาง (Trip) และการชาร์จไฟฟ้า (Charging) ของรถยนต์ EV โดยอัตโนมัติด้วย **Gemini 1.5 Flash Vision AI**, เชื่อมต่อฐานข้อมูล **Google Sheets**, รองรับการใช้งานผ่าน **AppSheet** บนมือถือ และสามารถถ่ายรูปส่งผ่าน **LINE Bot** เพื่อประมวลผลทันที

---

## 🌟 จุดเด่นของระบบ (Key Features)

1. **Auto-Vision OCR**: ถ่ายรูปหน้าปัดเรือนไมล์ หรือหน้าจอแอปชาร์จ ระบบจะจำแนกและดึงค่า Odometer, Distance, Duration, Consumption, SoC ให้อัตโนมัติ
2. **Auto Calculations**: คำนวณพลังงานที่ใช้ (kWh), ค่าไฟสุทธิ (Cost Net), ค่าไฟรวม Loss ตามมิเตอร์ (Cost Grid) ตามสูตรทางเทคนิคของ EV
3. **Multi-Platform Integration**:
   - **Google Sheets**: จัดเก็บข้อมูลแยกตาราง `Trips` และ `Charging`
   - **AppSheet**: แอปพลิเคชันสมาร์ทโฟนสำหรับตรวจสอบ ดูสถิติ และแก้ไขข้อมูล
   - **LINE Bot Webhook**: แค่ถ่ายรูปแล้วส่งเข้าแชท LINE ระบบจะบันทึกพร้อมตอบกลับเป็นการ์ดสรุปยอดทันที
4. **Standalone CLI**: สามารถรันคำสั่งทดสอบผ่านเครื่องคอมพิวเตอร์ได้ทันที

---

## 📐 ค่าคงที่ของระบบ (System Constants)

* **ความจุแบตเตอรี่ (Battery Capacity)**: `68.8 kWh`
* **อัตราค่าไฟฟ้า (Electricity Cost)**: `4.90 บาท/หน่วย` (THB/kWh)
* **ประสิทธิภาพการชาร์จ (Charging Efficiency)**: `90%` (Loss 10%)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
d:\ev\
│   EV_Log_App_Spec.md           # สเปกระบบตั้งต้น
│   README.md                    # คู่มือการติดตั้งและใช้งาน
│   requirements.txt             # ไลบรารีที่จำเป็น
│   .env.example                 # ตัวอย่างการตั้งค่า Environment Variables
│   .env                         # ไฟล์คอนฟิกจริง (API Keys, Token)
│   service_account.json         # Google Cloud Service Account Key
│
├───config/
│       settings.py              # โหลดคอนฟิกและค่าคงที่ของรถ EV
│
├───models/
│       schemas.py               # Pydantic Schemas และสูตรคำนวณอัตโนมัติ
│
├───services/
│       vision_extractor.py      # โมดูลสกัดข้อมูลภาพด้วย Gemini Vision
│       sheets_service.py        # โมดูลบันทึกข้อมูลลง Google Sheets
│       line_notifier.py         # จัดรูปแบบข้อความ Flex Message สำหรับ LINE
│
├───scripts/
│       setup_sheets.py          # สคริปต์สร้างแท็บและ Header ใน Google Sheets อัตโนมัติ
│       process_local_image.py   # CLI สำหรับรันอ่านภาพในเครื่อง
│       test_calculations.py     # Unit test ตรวจสอบความถูกต้องของสูตรคำนวณ
│
├───templates/
│       trips_template.csv       # ตัวอย่าง Template ตาราง Trips
│       charging_template.csv    # ตัวอย่าง Template ตาราง Charging
│
└───webhook/
        app.py                   # FastAPI Server รับ Webhook จาก LINE & Test Upload
```

---

## 🛠️ ขั้นตอนการติดตั้งและเริ่มต้นใช้งาน (Step-by-Step Setup)

### 1. ติดตั้ง Dependencies
```bash
pip install -r requirements.txt
```

### 2. ตั้งค่า `.env`
คัดลอกไฟล์ `.env.example` เป็น `.env`:
```bash
copy .env.example .env
```
เปิดไฟล์ `.env` แล้วระบุค่า:
* `GEMINI_API_KEY`: รับฟรีที่ [Google AI Studio](https://aistudio.google.com/)
* `SPREADSHEET_NAME`: ชื่อไฟล์ Google Sheets เช่น `EV_Trip_Charge_Log`
* `LINE_CHANNEL_ACCESS_TOKEN` และ `LINE_CHANNEL_SECRET`: จาก [LINE Developers Console](https://developers.line.biz/)

---

### 3. ตั้งค่า Google Sheets & Service Account
1. เข้า [Google Cloud Console](https://console.cloud.google.com/)
2. เปิดใช้งาน API: **Google Sheets API** และ **Google Drive API**
3. ไปที่ **IAM & Admin -> Service Accounts** สร้าง Service Account ใหม่
4. กดเข้าไปที่ Service Account -> เมนู **Keys** -> **Add Key** -> **Create new key (JSON)**
5. ดาวน์โหลดไฟล์มาไว้ที่โฟลเดอร์โปรเจกต์ `d:\ev\` แล้วตั้งชื่อว่า `service_account.json`
6. เปิด Google Sheets ขึ้นมา 1 ไฟล์ (ตั้งชื่อว่า `EV_Trip_Charge_Log`) แล้วกดปุ่ม **แชร์ (Share)** ให้อีเมล `xxx@xxx.iam.gserviceaccount.com` (สามารถแก้ไขได้ - Editor)
7. รันคำสั่งสร้างตารางและ Header อัตโนมัติ:
   ```bash
   python scripts/setup_sheets.py
   ```

---

### 4. ทดสอบประมวลผลรูปภาพในเครื่อง (Local Test)
ทดสอบอ่านรูปภาพหน้าจอเรือนไมล์ หรือการชาร์จ:
```bash
# ระบบจำแนกประเภทภาพอัตโนมัติ และบันทึกลง Google Sheets
python scripts/process_local_image.py "path/to/dashboard.jpg"

# หรือทดสอบอ่านภาพโดยยังไม่บันทึกข้อมูลลง Sheets
python scripts/process_local_image.py "path/to/dashboard.jpg" --no-save
```

---

### 5. รัน Webhook Server สำหรับ LINE Bot
1. รันเซิร์ฟเวอร์ FastAPI:
   ```bash
   python webhook/app.py
   ```
2. ใช้ Cloudflare Tunnel หรือ ngrok เพื่อเปิด Public HTTPS URL:
   ```bash
   ngrok http 8000
   ```
3. นำ URL ที่ได้ เช่น `https://xxxx.ngrok-free.app/callback` ไปใส่ในเมนู **Webhook URL** ใน LINE Developers Console แล้วกด **Verify**
4. เปิดห้องแชท LINE แล้วส่งรูปภาพหน้าจอเรือนไมล์หรือหน้าจอชาร์จไฟได้ทันที!

---

## 📱 การเชื่อมต่อกับ AppSheet (Mobile Application)

1. เข้าเว็บไซต์ [AppSheet](https://www.appsheet.com/)
2. เลือก **Create New App** -> **Start with your own data**
3. เลือก Data Source เป็น **Google Sheets** แล้วเลือกไฟล์ `EV_Trip_Charge_Log`
4. เพิ่ม Table เข้าสู่ระบบ:
   - ตาราง **`Trips`** (Key: `Trip_ID`)
   - ตาราง **`Charging`** (Key: `Charge_ID`)
5. กำหนด Column Type ตามตารางใน `EV_Log_App_Spec.md`:
   - `Cost_Net_THB`, `Cost_Grid_THB`: ประเภท Price (THB)
   - `Distance_km`, `Avg_Consumption`, `Net_kWh`, `Grid_kWh`: ประเภท Decimal
   - `SoC_Start`, `SoC_End`: ประเภท Percent
6. กด **Save** คุณจะได้ Mobile App พร้อมใช้งานบนสมาร์ทโฟนทันที!
