# ⚡ EV Trip & Charge Log - Cloudflare Worker (24/7 Serverless)

ระบบสกัดข้อมูลหน้าปัดรถยนต์ EV และข้อมูลการชาร์จไฟจากรูปถ่ายผ่าน **LINE Bot** รันบน **Cloudflare Workers (Free Tier)** เชื่อมต่อกับ **Google Gemini 1.5 Flash Vision** และบันทึกลง **Google Sheets** โดยตรง

> ✅ **ทำงานตลอด 24 ชั่วโมง โดยไม่ต้องเปิดคอมพิวเตอร์ทิ้งไว้**  
> ✅ **ฟรี 100%** ไม่เกินโควต้า 100,000 requests/วัน ของ Cloudflare Free  
> ✅ ไม่ต้องใช้ ngrok / tunnel ไม่หมดอายุ ไม่ต้องเปิด Port  

---

## 🏗️ แผนผังการทำงาน (Architecture)

```text
📱 ถ่ายรูปเรือนไมล์/หน้าจอชาร์จ ➔ ส่งเข้าห้องแชท LINE
  │
  ▼
⚡ Cloudflare Worker (Endpoint: https://ev-log-bot.<your-subdomain>.workers.dev/callback)
  ├─ 1. ตรวจสอบ LINE Signature ด้วย HMAC-SHA256 (Web Crypto)
  ├─ 2. ตอบกลับ HTTP 200 OK ให้ LINE ทันที (ป้องกัน Timeout)
  ├─ 3. Background Task (ctx.waitUntil):
  │     ├─ ดาวน์โหลด Binary รูปภาพจาก LINE Content API
  │     ├─ ส่งเข้า Google Gemini 1.5 Flash Vision REST API (Auto Classify + Extract)
  │     ├─ คำนวณระยะทาง, พลังงาน kWh, ค่าไฟสุทธิ, ค่าไฟตามมิเตอร์ (Efficiency 90%)
  │     ├─ สร้าง Google OAuth2 Access Token ผ่าน Web Crypto (RSA-SHA256)
  │     ├─ บันทึกแถวใหม่ลง Google Sheets (แท็บ Trips หรือ Charging)
  │     └─ ส่ง Flex Message สรุปผลกลับเข้าแชท LINE ของผู้ใช้ทันที 🎉
```

---

## 🚀 ขั้นตอนการติดตั้งและ Deploy สู่ Cloudflare (ใช้เวลา 3 นาที)

### 1. ติดตั้ง Dependencies ในโฟลเดอร์นี้
เปิด Terminal เข้ามาที่โฟลเดอร์ `d:\ev\cloudflare-worker`:
```bash
cd d:\ev\cloudflare-worker
npm install
```

### 2. ล็อกอินเข้า Cloudflare ผ่าน CLI
```bash
npx wrangler login
```
*(เบราว์เซอร์จะเปิดขึ้นมา ให้กดยืนยัน Authorize)*

### 3. ตั้งค่า Secrets (API Keys & Credentials)
รันคำสั่งเหล่านี้ทีละคำสั่ง แล้ววางค่าที่ต้องการ:

```bash
# 1. Google Gemini API Key (จาก https://aistudio.google.com/)
npx wrangler secret put GEMINI_API_KEY

# 2. LINE Channel Secret (จาก LINE Developers Console)
npx wrangler secret put LINE_CHANNEL_SECRET

# 3. LINE Channel Access Token (จาก LINE Developers Console)
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN

# 4. Google Spreadsheet ID (ดูจาก URL ของ Google Sheet)
# ตัวอย่าง: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
# Spreadsheet ID คือ "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
npx wrangler secret put SPREADSHEET_ID

# 5. Service Account Email (จากไฟล์ service_account.json คีย์ "client_email")
npx wrangler secret put GOOGLE_CLIENT_EMAIL

# 6. Service Account Private Key (จากไฟล์ service_account.json คีย์ "private_key")
npx wrangler secret put GOOGLE_PRIVATE_KEY
```

> **💡 ทริก:** สำหรับ `GOOGLE_PRIVATE_KEY` ให้คัดลอกค่าจาก `service_account.json` รวมทั้ง `-----BEGIN PRIVATE KEY-----` จนถึง `-----END PRIVATE KEY-----` แล้ววางลงไปได้เลย

---

### 4. สั่ง Deploy ขึ้น Cloudflare
```bash
npm run deploy
```

เมื่อ Deploy เสร็จ คุณจะได้ URL ทันที เช่น:
```text
https://ev-log-bot.your-name.workers.dev
```

---

### 5. ตั้งค่า Webhook ใน LINE Developers Console
1. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/) -> เลือก Provider & Channel ของคุณ
2. ไปที่แท็บ **Messaging API**
3. ที่หัวข้อ **Webhook settings**:
   - **Webhook URL**: ใส่ URL ที่ได้จากขั้นตอนที่ 4 ตามด้วย `/callback`  
     ตัวอย่าง: `https://ev-log-bot.your-name.workers.dev/callback`
   - กดปุ่ม **Update** แล้วกด **Verify** (จะขึ้น Success)
   - เปิดสวิตช์ **Use webhook** ให้เป็นสีเขียว
4. เลื่อนลงมาที่ **Auto-reply messages** กด **Edit** แล้วปิด Auto-reply ของ LINE Official Account เพื่อไม่ให้ส่งข้อความซ้ำซ้อน

---

## 🧪 การทดสอบใช้งาน
1. เพิ่ม LINE Bot เป็นเพื่อนในโทรศัพท์มือถือ
2. ถ่ายรูปหรือส่งภาพหน้าจอเรือนไมล์ หรือหน้าจอแอปพลิเคชันชาร์จไฟ
3. ภายใน 2-3 วินาที บอทจะตอบกลับเป็นการ์ดสรุปยอด (Flex Message) พร้อมบันทึกข้อมูลลง Google Sheets เรียบร้อยครับ!
