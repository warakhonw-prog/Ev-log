# 🚗 EV Trip & Charge Log Application Specification (with Automated Vision AI Script)

เอกสารฉบับนี้จัดทำขึ้นสำหรับโปรแกรมเมอร์ หรือ AI Developer ในการสร้างระบบ **EV Trip & Charge Log** ทั้งในรูปแบบ AppSheet, Google Sheets Schema และสคริปต์ประมวลผลภาพอัตโนมัติด้วย Python (Gemini 1.5 Flash Vision API)

---

## 🎯 1. ภาพรวมระบบ (System Overview)
ระบบบันทึกข้อมูลการเดินทางและการชาร์จไฟฟ้าของรถยนต์ EV ประกอบด้วย:
1. **Google Sheets Database**: โครงสร้างฐานข้อมูลสำหรับเก็บข้อมูล Trip และ Charging
2. **AppSheet Application**: UI สำหรับบันทึก/ดูข้อมูลบนสมาร์ทโฟน
3. **Automated Vision AI Script (Python)**: สคริปต์สกัดข้อมูลจากภาพถ่ายหน้าจอเรือนไมล์ หรือหน้าจอแอปพลิเคชันรถยนต์โดยอัตโนมัติ แล้วบันทึกลง Google Sheets

---

## 📊 2. โครงสร้างฐานข้อมูล (Google Sheets Database Schema)

สร้างไฟล์ Google Sheets ชื่อ **`EV_Trip_Charge_Log`** มี 2 แท็บดังนี้:

### 🏷️ Table 1: `Trips` (ตารางบันทึกการเดินทาง)

| Column Name | Data Type | Formula / Initial Value | Description |
| :--- | :--- | :--- | :--- |
| `Trip_ID` | Key (Text) | `UNIQUEID()` | รหัสรายการเดินทาง |
| `Date` | Date | `TODAY()` | วันที่เดินทาง |
| `Time` | Time | `TIMENOW()` | เวลาที่บันทึก |
| `Odo_Start` | Number | User Input / AI Output | เลขไมล์เริ่มต้น (กม.) |
| `Odo_End` | Number | User Input / AI Output | เลขไมล์สิ้นสุด (กม.) |
| `Distance_km` | Decimal | `[Odo_End] - [Odo_Start]` | ระยะทางรวม (กม.) |
| `Duration_min` | Number | User Input / AI Output | เวลาที่ใช้เดินทาง (นาที) |
| `Avg_Consumption` | Decimal | User Input / AI Output | อัตราสิ้นเปลือง (kWh/100km) |
| `SoC_Start` | Percent | User Input / AI Output | ระดับแบตเตอรี่เริ่มต้น (%) |
| `SoC_End` | Percent | User Input / AI Output | ระดับแบตเตอรี่สิ้นสุด (%) |
| `Energy_kWh` | Decimal | `([Distance_km] * [Avg_Consumption]) / 100` | พลังงานไฟฟ้าที่ใช้ไป (kWh) |
| `Cost_Net_THB` | Price | `[Energy_kWh] * 4.90` | ค่าไฟสุทธิที่รถใช้ไป (บาท) |
| `Cost_Grid_THB` | Price | `([Energy_kWh] / 0.90) * 4.90` | ค่าไฟรวม Loss 10% (บาท) |
| `Note` | Text | User Input / AI Output | หมายเหตุ |

---

### ⚡ Table 2: `Charging` (ตารางบันทึกการชาร์จไฟ)

| Column Name | Data Type | Formula / Initial Value | Description |
| :--- | :--- | :--- | :--- |
| `Charge_ID` | Key (Text) | `UNIQUEID()` | รหัสรายการชาร์จไฟ |
| `Start_DateTime` | DateTime | User Input / AI Output | วันเวลาเริ่มชาร์จ |
| `End_DateTime` | DateTime | User Input / AI Output | วันเวลาชาร์จเสร็จ |
| `SoC_Start` | Percent | User Input / AI Output | แบตเตอรี่ก่อนชาร์จ (%) |
| `SoC_End` | Percent | User Input / AI Output | แบตเตอรี่หลังชาร์จ (%) |
| `Net_kWh` | Decimal | `68.8 * ([SoC_End] - [SoC_Start])` | ไฟเข้าแบตเตอรี่สุทธิ (แบต 68.8 kWh) |
| `Grid_kWh` | Decimal | `[Net_kWh] / 0.90` | พลังงานไฟฟ้าจากมิเตอร์ (Efficiency 90%) |
| `Cost_Net_THB` | Price | `[Net_kWh] * 4.90` | ค่าไฟสุทธิเข้าแบตเตอรี่ (บาท) |
| `Cost_Grid_THB` | Price | `[Grid_kWh] * 4.90` | ค่าไฟจริงตามมิเตอร์ (บาท) |
| `Location` | Enum | `Home AC (2.4 kW)`, `Home Wallbox`, `DC Fast Charge` | ประเภท/สถานที่ชาร์จ |

---

## ⚙️ 3. ค่าคงที่ในระบบ (Constants)
* **Battery Capacity**: 68.8 kWh
* **Electricity Cost**: 4.90 บาท/หน่วย (THB/kWh)
* **Charging Efficiency**: 90% (Loss 10%)

---

## 🤖 4. สคริปต์สกัดข้อมูลอัตโนมัติ (Python Vision AI Script)

ใช้สคริปต์ Python ร่วมกับ **Gemini 1.5 Flash Vision API** และ **gspread** เพื่ออ่านภาพถ่ายหน้าจอเรือนไมล์/แอปพลิเคชัน แล้วแปลงเป็นข้อมูลโครงสร้าง JSON จากนั้น Append ลง Google Sheets โดยอัตโนมัติ

### 🐍 Python Code Implementation:

```python
import json
from datetime import datetime
import google.generativeai as genai
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from PIL import Image

# 1. ตั้งค่า Google AI Studio API Key
genai.configure(api_key="YOUR_GEMINI_API_KEY")

# 2. ตั้งค่า Google Sheets Auth (Service Account)
scope = [
    "[https://spreadsheets.google.com/feeds](https://spreadsheets.google.com/feeds)",
    "[https://www.googleapis.com/auth/drive](https://www.googleapis.com/auth/drive)",
]
creds = ServiceAccountCredentials.from_json_keyfile_name(
    "service_account.json", scope
)
client = gspread.authorize(creds)
spreadsheet = client.open("EV_Trip_Charge_Log")


def process_ev_screen(image_path, log_type="trip"):
    """สกัดข้อมูลจากภาพถ่ายเรือนไมล์ หรือหน้าจอแอปพลิเคชันรถยนต์ EV

    และบันทึกลง Google Sheets
    :param image_path: Path ของไฟล์ภาพ
    :param log_type: 'trip' หรือ 'charging'
    """
    img = Image.open(image_path)
    model = genai.GenerativeModel("gemini-1.5-flash")

    if log_type == "trip":
        prompt = """
        Analyze this EV dashboard or car app screenshot and extract trip information.
        Return ONLY a JSON object with the following keys (use null if not found):
        {
            "odo_start": number or null,
            "odo_end": number or null,
            "distance_km": number or null,
            "duration_min": number or null,
            "avg_consumption": number or null,
            "soc_start": number (as decimal 0.0-1.0) or null,
            "soc_end": number (as decimal 0.0-1.0) or null,
            "note": string or null
        }
        Do not include markdown code block syntax outside the JSON.
        """
    else:  # charging
        prompt = """
        Analyze this EV charging screen or app screenshot and extract charging information.
        Return ONLY a JSON object with the following keys (use null if not found):
        {
            "start_datetime": "YYYY-MM-DD HH:MM:SS" or null,
            "end_datetime": "YYYY-MM-DD HH:MM:SS" or null,
            "soc_start": number (as decimal 0.0-1.0) or null,
            "soc_end": number (as decimal 0.0-1.0) or null,
            "location": string or null
        }
        Do not include markdown code block syntax outside the JSON.
        """

    response = model.generate_content([prompt, img])
    raw_text = response.text.strip().replace("```json", "").replace("```", "")
    data = json.loads(raw_text)

    print("Extracted Data:", data)

    # บันทึกลง Google Sheets
    if log_type == "trip":
        sheet = spreadsheet.worksheet("Trips")
        # เรียงลำดับ Column ตาม Table Schema:
        # Trip_ID, Date, Time, Odo_Start, Odo_End, Distance_km, Duration_min,
        # Avg_Consumption, SoC_Start, SoC_End, Energy_kWh, Cost_Net_THB, Cost_Grid_THB, Note
        row = [
            f"=UNIQUEID()",  # ให้ AppSheet/Sheet สร้าง ID
            datetime.now().strftime("%Y-%m-%d"),
            datetime.now().strftime("%H:%M:%S"),
            data.get("odo_start", ""),
            data.get("odo_end", ""),
            data.get("distance_km", ""),
            data.get("duration_min", ""),
            data.get("avg_consumption", ""),
            data.get("soc_start", ""),
            data.get("soc_end", ""),
            "",  # Energy_kWh (ให้สูตรคำนวณ)
            "",  # Cost_Net_THB (ให้สูตรคำนวณ)
            "",  # Cost_Grid_THB (ให้สูตรคำนวณ)
            data.get("note", "Auto-extracted via AI"),
        ]
        sheet.append_row(row, value_input_option="USER_ENTERED")
        print("Successfully appended to Trips table.")


# ตัวอย่างการใช้งาน
if __name__ == "__main__":
    process_ev_screen("dashboard_sample.png", log_type="trip")
```

---

## 🎯 5. สิ่งที่ต้องการให้ AI ดำเนินการ (Tasks to Execute)

1. **สร้างตารางบน Google Sheets ตามโครงสร้าง Table 1 และ Table 2**
2. **ติดตั้งสคริปต์ Python และกำหนดค่า API Key / Service Account สำหรับใช้งาน OCR**
3. **นำเสนอแนวทางการรับรูปภาพผ่าน LINE Bot / Webhook เพื่อส่งภาพข้ามไปยัง Python Script ตัวนี้เพื่อประมวลผลอัตโนมัติ**

