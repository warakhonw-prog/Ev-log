import json
import re
import io
import logging
from typing import Union
from pathlib import Path
from PIL import Image

from config.settings import GEMINI_API_KEY, GEMINI_MODEL
from models.schemas import (
    TripExtractionResult,
    ChargingExtractionResult,
    ScreenClassificationResult,
)

logger = logging.getLogger("VisionExtractor")


class VisionExtractor:
    """บริการสกัดข้อมูลหน้าจอ EV ด้วย Gemini Vision API (รองรับ google-genai SDK ตัวล่าสุด)"""

    def __init__(self, api_key: str = None, model_name: str = None):
        self.api_key = api_key or GEMINI_API_KEY
        self.model_name = model_name or GEMINI_MODEL or "gemini-1.5-flash"

        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY ยังไม่ได้กำหนด กรุณาระบุในไฟล์ .env (เช่น GEMINI_API_KEY=AIzaSy...)"
            )

        try:
            from google import genai

            self.client = genai.Client(api_key=self.api_key)
            self.use_modern_sdk = True
        except Exception as e:
            logger.warning(f"Using legacy google.generativeai: {e}")
            import google.generativeai as legacy_genai

            legacy_genai.configure(api_key=self.api_key)
            self.model = legacy_genai.GenerativeModel(self.model_name)
            self.use_modern_sdk = False

    @staticmethod
    def _load_image(image_input: Union[str, Path, bytes, Image.Image]) -> Image.Image:
        """แปลง input ชนิดต่างๆ ให้เป็น PIL.Image"""
        if isinstance(image_input, Image.Image):
            return image_input
        elif isinstance(image_input, bytes):
            return Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, (str, Path)):
            return Image.open(str(image_input))
        else:
            raise ValueError(f"รูปแบบไฟล์รูปภาพไม่ถูกต้อง: {type(image_input)}")

    @staticmethod
    def _clean_json_response(raw_text: str) -> dict:
        """ทำความสะอาด response จาก Gemini และ parse JSON อย่างปลอดภัย"""
        text = raw_text.strip()
        text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"^```\s*", "", text)
        text = re.sub(r"```$", "", text).strip()

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            text = match.group(0)

        return json.loads(text)

    def _generate(self, prompt: str, image: Image.Image) -> str:
        """ส่ง prompt และรูปภาพไปยังโมเดล Gemini"""
        if self.use_modern_sdk:
            from google.genai import types

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[image, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )
            return response.text
        else:
            response = self.model.generate_content([prompt, image])
            return response.text

    def classify_screen(
        self, image_input: Union[str, Path, bytes, Image.Image]
    ) -> ScreenClassificationResult:
        """จำแนกประเภทภาพอัตโนมัติ (ว่าเป็นหน้าจอ Trip, Charging หรืออื่นๆ)"""
        img = self._load_image(image_input)
        prompt = """
        Analyze this screenshot from an Electric Vehicle (EV) dashboard, instrument cluster, or EV companion smartphone app.
        Determine whether this image is:
        1. "trip": Showing trip distance, odometer, consumption (kWh/100km or km/kWh), trip duration, energy used, etc.
        2. "charging": Showing charging status, battery %, SoC, charging power (kW), charging duration, scheduled charge, or charging session summary.
        3. "unknown": Not related to an EV dashboard/charging or unreadable.

        Respond ONLY with a JSON object in this exact format:
        {
            "screen_type": "trip" | "charging" | "unknown",
            "confidence": 0.0 to 1.0,
            "reason": "Brief explanation of what was detected"
        }
        """
        raw_text = self._generate(prompt, img)
        data = self._clean_json_response(raw_text)
        return ScreenClassificationResult(**data)

    def extract_trip(
        self, image_input: Union[str, Path, bytes, Image.Image]
    ) -> TripExtractionResult:
        """สกัดข้อมูล Trip จากภาพหน้าจอเรือนไมล์ หรือแอปพลิเคชันรถยนต์"""
        img = self._load_image(image_input)
        prompt = """
        You are an expert OCR and EV telemetry extractor.
        Analyze this EV dashboard, center console screen, or EV companion app screenshot.
        Extract trip telemetry accurately.
        
        Values to look for:
        - Odometer start / Odometer end (total accumulated mileage of the car in km)
        - Trip Distance (km)
        - Trip Duration / Elapsed Time (convert to total integer minutes)
        - Average Electricity Consumption (normalized to kWh/100km. If given in km/kWh, convert to kWh/100km using: 100 / value)
        - Battery State of Charge at start (soc_start) as percentage 0-100 or decimal 0.0-1.0
        - Battery State of Charge at end (soc_end) as percentage 0-100 or decimal 0.0-1.0
        - Note: Any useful text (e.g. driving mode 'Eco/Sport', route name, temperature, trip title like 'Since Start', 'Since Last Charge', etc.)

        Return ONLY a JSON object:
        {
            "odo_start": number or null,
            "odo_end": number or null,
            "distance_km": number or null,
            "duration_min": integer or null,
            "avg_consumption": number or null,
            "soc_start": number or null,
            "soc_end": number or null,
            "note": string or null
        }
        """
        raw_text = self._generate(prompt, img)
        data = self._clean_json_response(raw_text)
        return TripExtractionResult(**data)

    def extract_charging(
        self, image_input: Union[str, Path, bytes, Image.Image]
    ) -> ChargingExtractionResult:
        """สกัดข้อมูลการชาร์จจากภาพหน้าจอการชาร์จ หรือแอปพลิเคชันสถานีชาร์จ"""
        img = self._load_image(image_input)
        prompt = """
        You are an expert OCR and EV charging data extractor.
        Analyze this EV charging screen, EV app charging session, or wallbox screen.
        Extract charging session data accurately.

        Values to look for:
        - Start Date/Time of charging session in 'YYYY-MM-DD HH:MM:SS' format if available, else null
        - End Date/Time of charging session in 'YYYY-MM-DD HH:MM:SS' format if available, else null
        - Initial Battery SoC before charge (soc_start) as number (0-100 or 0.0-1.0)
        - Target or Final Battery SoC after charge (soc_end) as number (0-100 or 0.0-1.0)
        - Location or Charger type (e.g. 'Home AC (2.4 kW)', 'Home Wallbox', 'DC Fast Charge', 'PTT EV Station', 'PEA Volta', 'EA Anywhere', etc.)

        Return ONLY a JSON object:
        {
            "start_datetime": "YYYY-MM-DD HH:MM:SS" or null,
            "end_datetime": "YYYY-MM-DD HH:MM:SS" or null,
            "soc_start": number or null,
            "soc_end": number or null,
            "location": string or null
        }
        """
        raw_text = self._generate(prompt, img)
        data = self._clean_json_response(raw_text)
        return ChargingExtractionResult(**data)

    def process_image_auto(
        self, image_input: Union[str, Path, bytes, Image.Image], forced_type: str = None
    ) -> tuple[str, Union[TripExtractionResult, ChargingExtractionResult]]:
        """วิเคราะห์ภาพโดยจำแนกประเภทอัตโนมัติ (หรือระบุ forced_type='trip'|'charging')"""
        if forced_type in ["trip", "charging"]:
            target_type = forced_type
        else:
            classification = self.classify_screen(image_input)
            target_type = (
                classification.screen_type
                if classification.screen_type != "unknown"
                else "trip"
            )

        if target_type == "charging":
            result = self.extract_charging(image_input)
        else:
            result = self.extract_trip(image_input)

        return target_type, result
