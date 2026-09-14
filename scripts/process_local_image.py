import sys
import argparse
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from services.vision_extractor import VisionExtractor
from services.sheets_service import GoogleSheetsService
from services.line_notifier import LineMessageFormatter
from models.schemas import TripRecord, ChargingRecord, ChargingExtractionResult


def main():
    parser = argparse.ArgumentParser(
        description="Process an EV dashboard or charging screen image via Gemini Vision"
    )
    parser.add_argument("image_path", type=str, help="Path to the image file")
    parser.add_argument(
        "--type",
        choices=["trip", "charging", "auto"],
        default="auto",
        help="Type of log (default: auto)",
    )
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Only display extracted data without appending to Google Sheets",
    )

    args = parser.parse_args()

    image_path = Path(args.image_path)
    if not image_path.exists():
        print(f"❌ Error: Image file not found at '{image_path}'")
        sys.exit(1)

    print(f"🔍 Analyzing image: {image_path.name} (Forced type: {args.type})...")

    try:
        extractor = VisionExtractor()
        forced = None if args.type == "auto" else args.type
        detected_type, result = extractor.process_image_auto(image_path, forced_type=forced)

        print(f"✨ Classification Detected: {detected_type.upper()}")
        print("\n📊 Raw Extraction Data:")
        print(result.model_dump_json(indent=2))

        if detected_type == "charging" or isinstance(result, ChargingExtractionResult):
            record = ChargingRecord.from_extraction(result)
            summary_text = LineMessageFormatter.format_charging_text(record)
        else:
            record = TripRecord.from_extraction(result)
            summary_text = LineMessageFormatter.format_trip_text(record)

        print("\n📋 Formatted Summary:")
        print(summary_text)

        if not args.no_save:
            print("\n💾 Appending data to Google Sheets...")
            sheets = GoogleSheetsService()
            if detected_type == "charging":
                sheets.append_charging(record)
            else:
                sheets.append_trip(record)
            print("✅ Successfully saved to Google Sheets!")
        else:
            print("\nℹ️ Skipped saving to Google Sheets (--no-save flag passed).")

    except Exception as e:
        print(f"\n❌ Error processing image: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
