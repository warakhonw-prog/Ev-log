import io
import os
import logging
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Header, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse, HTMLResponse
import uvicorn

from linebot.v3 import WebhookHandler
from linebot.v3.exceptions import InvalidSignatureError
from linebot.v3.messaging import (
    Configuration,
    ApiClient,
    MessagingApi,
    MessagingApiBlob,
    ReplyMessageRequest,
    TextMessage,
    FlexMessage,
    FlexContainer,
)
from linebot.v3.webhooks import MessageEvent, ImageMessageContent, TextMessageContent

from config.settings import (
    LINE_CHANNEL_ACCESS_TOKEN,
    LINE_CHANNEL_SECRET,
    GEMINI_API_KEY,
    GOOGLE_SERVICE_ACCOUNT_FILE,
    HOST,
    PORT,
)
from models.schemas import (
    TripRecord,
    ChargingRecord,
    TripExtractionResult,
    ChargingExtractionResult,
)
from services.vision_extractor import VisionExtractor
from services.sheets_service import GoogleSheetsService
from services.line_notifier import LineMessageFormatter

# Setup Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EV-Log-Bot")

app = FastAPI(
    title="EV Trip & Charge Log AI Webhook",
    description="Automated EV telemetry extraction via Gemini Vision & Google Sheets integration",
    version="1.0.0",
)

# LINE Bot Setup
handler = WebhookHandler(LINE_CHANNEL_SECRET) if LINE_CHANNEL_SECRET else None
line_config = (
    Configuration(access_token=LINE_CHANNEL_ACCESS_TOKEN)
    if LINE_CHANNEL_ACCESS_TOKEN
    else None
)


def get_vision_extractor() -> VisionExtractor:
    return VisionExtractor()


def get_sheets_service() -> GoogleSheetsService:
    return GoogleSheetsService()


@app.get("/", response_class=HTMLResponse)
async def root():
    """หน้า Dashboard ตรวจสอบสถานะระบบ"""
    gemini_status = "✅ Configured" if GEMINI_API_KEY else "❌ Missing GEMINI_API_KEY"
    sa_status = (
        "✅ Found"
        if os.path.exists(GOOGLE_SERVICE_ACCOUNT_FILE)
        else "❌ Missing service_account.json"
    )
    line_status = (
        "✅ Configured"
        if (LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET)
        else "⚠️ Waiting for LINE Token & Secret"
    )

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>🚗 EV Trip & Charge Log System</title>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; }}
            .card {{ max-width: 600px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }}
            h1 {{ color: #38bdf8; font-size: 24px; margin-top: 0; }}
            .status-item {{ display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155; }}
            .status-title {{ font-weight: 500; }}
            .btn {{ display: inline-block; background: #0284c7; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-top: 20px; }}
            .btn:hover {{ background: #0369a1; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h1>🚗 EV Trip & Charge Log API Server</h1>
            <p style="color: #94a3b8;">ระบบสกัดข้อมูลหน้าจอ EV อัตโนมัติด้วย Gemini Vision & Google Sheets</p>
            <div class="status-item">
                <span class="status-title">Google Gemini Vision API:</span>
                <span>{gemini_status}</span>
            </div>
            <div class="status-item">
                <span class="status-title">Google Service Account:</span>
                <span>{sa_status}</span>
            </div>
            <div class="status-item">
                <span class="status-title">LINE Messaging API:</span>
                <span>{line_status}</span>
            </div>
            <div style="margin-top: 25px;">
                <p>📍 <strong>LINE Webhook URL:</strong> <code>https://&lt;your-domain&gt;/callback</code></p>
                <p>🧪 <strong>Manual Test Endpoint:</strong> <code>POST /upload</code></p>
                <a class="btn" href="/docs">ดู API Documentation (Swagger)</a>
            </div>
        </div>
    </body>
    </html>
    """


@app.post("/callback")
async def line_webhook(
    request: Request, x_line_signature: Optional[str] = Header(None)
):
    """Webhook Endpoint สำหรับรับ Event จาก LINE Bot"""
    if not handler or not line_config:
        logger.error("LINE credentials are not configured in .env")
        raise HTTPException(status_code=500, detail="LINE credentials not configured")

    if not x_line_signature:
        raise HTTPException(
            status_code=400, detail="Missing X-Line-Signature header"
        )

    body = await request.body()
    body_text = body.decode("utf-8")

    try:
        handler.handle(body_text, x_line_signature)
    except InvalidSignatureError:
        logger.error("Invalid LINE signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    return JSONResponse(content={"status": "OK"})


def process_image_and_reply(reply_token: str, image_bytes: bytes):
    """ฟังก์ชันประมวลผลรูปภาพและส่งคำตอบกลับไปยังผู้ใช้ใน LINE"""
    try:
        extractor = get_vision_extractor()
        detected_type, result = extractor.process_image_auto(image_bytes)

        sheets = get_sheets_service()

        if detected_type == "charging" or isinstance(result, ChargingExtractionResult):
            record = ChargingRecord.from_extraction(result)
            sheets.append_charging(record)
            reply_text = LineMessageFormatter.format_charging_text(record)
            flex_dict = LineMessageFormatter.format_flex_bubble(record)
        else:
            record = TripRecord.from_extraction(result)
            sheets.append_trip(record)
            reply_text = LineMessageFormatter.format_trip_text(record)
            flex_dict = LineMessageFormatter.format_flex_bubble(record)

        # ส่งคำตอบกลับผ่าน LINE API
        with ApiClient(line_config) as api_client:
            line_bot_api = MessagingApi(api_client)
            try:
                # ลองส่งแบบ Flex Message ก่อนเพื่อความสวยงาม
                flex_container = FlexContainer.from_dict(flex_dict)
                line_bot_api.reply_message(
                    ReplyMessageRequest(
                        reply_token=reply_token,
                        messages=[
                            FlexMessage(
                                alt_text="บันทึกข้อมูล EV สำเร็จ",
                                contents=flex_container,
                            )
                        ],
                    )
                )
            except Exception as e_flex:
                logger.warning(f"Flex message failed, falling back to text: {e_flex}")
                line_bot_api.reply_message(
                    ReplyMessageRequest(
                        reply_token=reply_token,
                        messages=[TextMessage(text=reply_text)],
                    )
                )

        logger.info(f"Successfully processed image and logged {detected_type}")

    except Exception as e:
        logger.error(f"Error processing image: {e}", exc_info=True)
        try:
            with ApiClient(line_config) as api_client:
                line_bot_api = MessagingApi(api_client)
                line_bot_api.reply_message(
                    ReplyMessageRequest(
                        reply_token=reply_token,
                        messages=[
                            TextMessage(
                                text=f"⚠️ เกิดข้อผิดพลาดในการประมวลผลภาพ:\n{str(e)}"
                            )
                        ],
                    )
                )
        except Exception as e_reply:
            logger.error(f"Failed to send error reply to LINE: {e_reply}")


if handler:

    @handler.add(MessageEvent, message=ImageMessageContent)
    def handle_image_message(event):
        """เมื่อผู้ใช้ส่งรูปภาพเข้ามาในแชท LINE"""
        message_id = event.message.id
        reply_token = event.reply_token

        with ApiClient(line_config) as api_client:
            blob_api = MessagingApiBlob(api_client)
            image_content = blob_api.get_message_content(message_id)

        # รันการประมวลผลทันที
        process_image_and_reply(reply_token, image_content)

    @handler.add(MessageEvent, message=TextMessageContent)
    def handle_text_message(event):
        """เมื่อผู้ใช้พิมพ์ข้อความเข้ามา"""
        text = event.message.text.strip().lower()
        reply_token = event.reply_token

        if text in ["help", "วิธีใช้", "เมนู", "คำแนะนำ"]:
            guide = (
                "🚗 [วิธีใช้งาน EV Trip & Charge Log Bot]\n"
                "1. ถ่ายรูปหรือแคปภาพหน้าจอเรือนไมล์รถ EV (Trip info)\n"
                "2. หรือถ่ายรูปหน้าจอการชาร์จไฟ / แอป Wallbox\n"
                "3. ส่งรูปภาพเข้ามาในแชทนี้ได้ทันที!\n\n"
                "🤖 บอทจะใช้ Gemini AI อ่านข้อมูล คำนวณค่าไฟ และบันทึกลง Google Sheets ให้โดยอัตโนมัติครับ"
            )
        else:
            guide = "กรุณาส่ง 'รูปภาพหน้าจอเรือนไมล์' หรือ 'หน้าจอการชาร์จไฟ' เพื่อให้ AI บันทึกข้อมูลครับ 📸"

        with ApiClient(line_config) as api_client:
            line_bot_api = MessagingApi(api_client)
            line_bot_api.reply_message(
                ReplyMessageRequest(
                    reply_token=reply_token,
                    messages=[TextMessage(text=guide)],
                )
            )


@app.post("/upload")
async def upload_image_test(
    file: UploadFile = File(...),
    log_type: Optional[str] = Form(None),
    save_to_sheets: bool = Form(True),
):
    """
    REST API สำหรับทดสอบ Upload รูปภาพตรงผ่าน Swagger / Postman / cURL
    โดยไม่ต้องมี LINE Bot
    """
    try:
        content = await file.read()
        extractor = get_vision_extractor()
        detected_type, result = extractor.process_image_auto(
            content, forced_type=log_type
        )

        response_payload = {
            "detected_type": detected_type,
            "extracted_data": result.model_dump(),
            "saved_to_sheets": False,
        }

        if save_to_sheets:
            try:
                sheets = get_sheets_service()
                if detected_type == "charging":
                    record = ChargingRecord.from_extraction(result)
                    sheet_res = sheets.append_charging(record)
                    response_payload["record"] = record.model_dump()
                else:
                    record = TripRecord.from_extraction(result)
                    sheet_res = sheets.append_trip(record)
                    response_payload["record"] = record.model_dump()

                response_payload["saved_to_sheets"] = True
                response_payload["sheet_response"] = sheet_res
            except Exception as e_sheet:
                response_payload["sheet_error"] = str(e_sheet)

        return JSONResponse(content=response_payload)

    except Exception as e:
        logger.error(f"Error in /upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def main():
    uvicorn.run("webhook.app:app", host=HOST, port=PORT, reload=True)


if __name__ == "__main__":
    main()
