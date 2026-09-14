import os
from pathlib import Path
from dotenv import load_dotenv

# โหลดตัวแปรจาก .env (ค้นหาจาก base directory)
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# Google Sheets
SPREADSHEET_NAME = os.getenv("SPREADSHEET_NAME", "EV_Trip_Charge_Log")
SPREADSHEET_ID = os.getenv("SPREADSHEET_ID", "")
GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv(
    "GOOGLE_SERVICE_ACCOUNT_FILE", str(BASE_DIR / "service_account.json")
)

# Vehicle Constants ตามสเปก
BATTERY_CAPACITY_KWH = float(os.getenv("BATTERY_CAPACITY_KWH", "68.8"))
ELECTRICITY_RATE_THB = float(os.getenv("ELECTRICITY_RATE_THB", "4.90"))
CHARGING_EFFICIENCY = float(os.getenv("CHARGING_EFFICIENCY", "0.90"))

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "")
LINE_CHANNEL_SECRET = os.getenv("LINE_CHANNEL_SECRET", "")

# Webhook Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
