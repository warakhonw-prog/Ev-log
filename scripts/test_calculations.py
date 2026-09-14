import sys
from pathlib import Path

# Fix Windows console encoding
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from models.schemas import (
    TripExtractionResult,
    TripRecord,
    ChargingExtractionResult,
    ChargingRecord,
)


def test_trip_calculations():
    print("Testing Trip calculations...")
    extracted = TripExtractionResult(
        odo_start=12450.0,
        odo_end=12505.0,
        distance_km=None,  # ควรคำนวณ 12505 - 12450 = 55.0 km
        duration_min=48,
        avg_consumption=14.5,
        soc_start=85.0,  # ควรแปลงเป็น 0.85
        soc_end=73.0,  # ควรแปลงเป็น 0.73
        note="Morning commute",
    )

    record = TripRecord.from_extraction(extracted)

    assert record.distance_km == 55.0, f"Expected 55.0, got {record.distance_km}"
    assert record.soc_start == 0.85, f"Expected 0.85, got {record.soc_start}"
    assert record.soc_end == 0.73, f"Expected 0.73, got {record.soc_end}"

    # Energy_kWh = (55.0 * 14.5) / 100 = 7.975
    assert record.energy_kwh == 7.975, f"Expected 7.975, got {record.energy_kwh}"

    # Cost_Net_THB = 7.975 * 4.90 = 39.08
    assert record.cost_net_thb == 39.08, f"Expected 39.08, got {record.cost_net_thb}"

    # Cost_Grid_THB = (7.975 / 0.90) * 4.90 = 43.42
    assert record.cost_grid_thb == 43.42, f"Expected 43.42, got {record.cost_grid_thb}"

    row = record.to_sheet_row()
    assert len(row) == 14, f"Expected 14 columns, got {len(row)}"
    print("✅ Trip calculations PASSED!")


def test_charging_calculations():
    print("Testing Charging calculations...")
    extracted = ChargingExtractionResult(
        start_datetime="2026-09-08 22:00:00",
        end_datetime="2026-09-09 06:00:00",
        soc_start=30.0,  # 30% -> 0.30
        soc_end=80.0,  # 80% -> 0.80
        location="Home Wallbox",
    )

    record = ChargingRecord.from_extraction(extracted)

    assert record.soc_start == 0.30, f"Expected 0.30, got {record.soc_start}"
    assert record.soc_end == 0.80, f"Expected 0.80, got {record.soc_end}"

    # Net_kWh = 68.8 * 0.50 = 34.40
    assert record.net_kwh == 34.40, f"Expected 34.40, got {record.net_kwh}"

    # Grid_kWh = 34.40 / 0.90 = 38.22
    assert record.grid_kwh == 38.22, f"Expected 38.22, got {record.grid_kwh}"

    # Cost_Net_THB = 34.40 * 4.90 = 168.56
    assert record.cost_net_thb == 168.56, f"Expected 168.56, got {record.cost_net_thb}"

    # Cost_Grid_THB = 38.22 * 4.90 = 187.28
    assert record.cost_grid_thb == 187.28, f"Expected 187.28, got {record.cost_grid_thb}"

    row = record.to_sheet_row()
    assert len(row) == 10, f"Expected 10 columns, got {len(row)}"
    print("✅ Charging calculations PASSED!")


if __name__ == "__main__":
    test_trip_calculations()
    test_charging_calculations()
    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
