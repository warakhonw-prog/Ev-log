import os
from typing import Optional
import gspread
from google.oauth2.service_account import Credentials
from config.settings import (
    SPREADSHEET_NAME,
    SPREADSHEET_ID,
    GOOGLE_SERVICE_ACCOUNT_FILE,
)
from models.schemas import TripRecord, ChargingRecord

# Google Drive & Sheets Scopes
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

TRIP_HEADERS = [
    "Trip_ID",
    "Date",
    "Time",
    "Odo_Start",
    "Odo_End",
    "Distance_km",
    "Duration_min",
    "Avg_Consumption",
    "SoC_Start",
    "SoC_End",
    "Energy_kWh",
    "Cost_Net_THB",
    "Cost_Grid_THB",
    "Note",
]

CHARGING_HEADERS = [
    "Charge_ID",
    "Start_DateTime",
    "End_DateTime",
    "SoC_Start",
    "SoC_End",
    "Net_kWh",
    "Grid_kWh",
    "Cost_Net_THB",
    "Cost_Grid_THB",
    "Location",
]


class GoogleSheetsService:
    """บริการเชื่อมต่อและจัดการ Google Sheets สำหรับ EV Trip & Charge Log"""

    def __init__(
        self,
        service_account_path: Optional[str] = None,
        spreadsheet_name: Optional[str] = None,
        spreadsheet_id: Optional[str] = None,
    ):
        self.sa_path = service_account_path or GOOGLE_SERVICE_ACCOUNT_FILE
        self.sheet_name = spreadsheet_name or SPREADSHEET_NAME
        self.sheet_id = spreadsheet_id or SPREADSHEET_ID

        if not os.path.exists(self.sa_path):
            raise FileNotFoundError(
                f"ไม่พบไฟล์ Service Account ที่ '{self.sa_path}' "
                "กรุณาดาวน์โหลดไฟล์ JSON จาก Google Cloud Console แล้ววางไว้ในโฟลเดอร์โปรเจกต์"
            )

        creds = Credentials.from_service_account_file(self.sa_path, scopes=SCOPES)
        self.client = gspread.authorize(creds)
        self._spreadsheet = None

    @property
    def spreadsheet(self) -> gspread.Spreadsheet:
        if self._spreadsheet is None:
            if self.sheet_id:
                self._spreadsheet = self.client.open_by_key(self.sheet_id)
            else:
                self._spreadsheet = self.client.open(self.sheet_name)
        return self._spreadsheet

    def initialize_tables(self) -> dict[str, str]:
        """สร้างหรือตรวจสอบแท็บ Trips และ Charging พร้อมใส่ Header แถวแรก"""
        results = {}

        # 1. แท็บ Trips
        try:
            trips_sheet = self.spreadsheet.worksheet("Trips")
            results["Trips"] = "Found existing worksheet"
        except gspread.WorksheetNotFound:
            trips_sheet = self.spreadsheet.add_worksheet(
                title="Trips", rows=1000, cols=len(TRIP_HEADERS)
            )
            trips_sheet.append_row(TRIP_HEADERS, value_input_option="USER_ENTERED")
            results["Trips"] = "Created new worksheet with headers"

        # ตรวจสอบ header
        first_row = trips_sheet.row_values(1)
        if not first_row:
            trips_sheet.append_row(TRIP_HEADERS, value_input_option="USER_ENTERED")

        # 2. แท็บ Charging
        try:
            charging_sheet = self.spreadsheet.worksheet("Charging")
            results["Charging"] = "Found existing worksheet"
        except gspread.WorksheetNotFound:
            charging_sheet = self.spreadsheet.add_worksheet(
                title="Charging", rows=1000, cols=len(CHARGING_HEADERS)
            )
            charging_sheet.append_row(
                CHARGING_HEADERS, value_input_option="USER_ENTERED"
            )
            results["Charging"] = "Created new worksheet with headers"

        first_row_chg = charging_sheet.row_values(1)
        if not first_row_chg:
            charging_sheet.append_row(
                CHARGING_HEADERS, value_input_option="USER_ENTERED"
            )

        return results

    def append_trip(self, record: TripRecord) -> dict:
        """บันทึกข้อมูล Trip ลงตาราง Trips"""
        sheet = self.spreadsheet.worksheet("Trips")
        row_data = record.to_sheet_row()
        res = sheet.append_row(row_data, value_input_option="USER_ENTERED")
        return {
            "status": "success",
            "table": "Trips",
            "trip_id": record.trip_id,
            "response": res,
        }

    def append_charging(self, record: ChargingRecord) -> dict:
        """บันทึกข้อมูล Charging ลงตาราง Charging"""
        sheet = self.spreadsheet.worksheet("Charging")
        row_data = record.to_sheet_row()
        res = sheet.append_row(row_data, value_input_option="USER_ENTERED")
        return {
            "status": "success",
            "table": "Charging",
            "charge_id": record.charge_id,
            "response": res,
        }
