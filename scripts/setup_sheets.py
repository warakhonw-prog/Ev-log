import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# เพิ่ม base directory เข้า path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from services.sheets_service import GoogleSheetsService
from config.settings import SPREADSHEET_NAME, SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_FILE


def main():
    print("=" * 60)
    print("🚀 Initializing Google Sheets Schema for EV Trip & Charge Log")
    print("=" * 60)
    print(f"📄 Target Sheet: {SPREADSHEET_NAME} (ID: {SPREADSHEET_ID or 'Auto-find'})")
    print(f"🔑 Service Account: {GOOGLE_SERVICE_ACCOUNT_FILE}")
    print("-" * 60)

    try:
        service = GoogleSheetsService()
        print(" Connected to Google Drive & Google Sheets API successfully.")

        results = service.initialize_tables()
        for table, status in results.items():
            print(f"✅ Table '{table}': {status}")

        print("-" * 60)
        print("🎉 Google Sheets schema setup completed successfully!")
        print(f"🔗 Open Sheet URL: https://docs.google.com/spreadsheets/d/{service.spreadsheet.id}")
        print("=" * 60)

    except FileNotFoundError as fnf:
        print(f"❌ File Error: {fnf}")
        print("\n💡 วิธีแก้ไข:")
        print("1. ไปที่ Google Cloud Console -> IAM & Admin -> Service Accounts")
        print("2. สร้าง Service Account และกด Create Key (JSON)")
        print("3. นำไฟล์ JSON ที่ดาวน์โหลดมา เปลี่ยนชื่อเป็น 'service_account.json' แล้ววางไว้ที่ d:\\ev\\")
        print("4. เปิด Google Sheets แล้วกด 'แชร์' (Share) ไปยังอีเมล client_email ของ Service Account")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
