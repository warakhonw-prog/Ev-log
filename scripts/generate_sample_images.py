from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SAMPLES_DIR = BASE_DIR / "samples"
SAMPLES_DIR.mkdir(exist_ok=True)


def create_trip_sample():
    """สร้างภาพจำลองหน้าปัดเรือนไมล์ EV (Trip A)"""
    width, height = 800, 480
    img = Image.new("RGB", (width, height), color="#0b0f19")
    draw = ImageDraw.Draw(img)

    # วาดกรอบหน้าจอ
    draw.rounded_rectangle([20, 20, width - 20, height - 20], radius=15, outline="#1e293b", width=3)

    # หัวข้อ
    draw.text((40, 40), "🚗 EV TRIP COMPUTER - TRIP A", fill="#38bdf8")
    draw.line([(40, 70), (width - 40, 70)], fill="#334155", width=2)

    # ข้อมูล Trip
    draw.text((50, 110), "Trip Distance:", fill="#94a3b8")
    draw.text((250, 100), "55.0 km", fill="#f8fafc")

    draw.text((50, 170), "Avg Consumption:", fill="#94a3b8")
    draw.text((250, 160), "14.5 kWh/100km", fill="#4ade80")

    draw.text((50, 230), "Trip Duration:", fill="#94a3b8")
    draw.text((250, 220), "48 min", fill="#f8fafc")

    draw.text((50, 290), "Battery SoC:", fill="#94a3b8")
    draw.text((250, 280), "73% (Started at 85%)", fill="#facc15")

    draw.text((50, 350), "Total Odometer:", fill="#94a3b8")
    draw.text((250, 340), "12,505 km (Start: 12,450 km)", fill="#cbd5e1")

    draw.text((50, 410), "Driving Mode: NORMAL | Temp: 32°C", fill="#64748b")

    path = SAMPLES_DIR / "dashboard_sample.png"
    img.save(path)
    print(f"Created sample trip image: {path}")


def create_charging_sample():
    """สร้างภาพจำลองหน้าจอการชาร์จไฟ EV"""
    width, height = 800, 480
    img = Image.new("RGB", (width, height), color="#0f172a")
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle([20, 20, width - 20, height - 20], radius=15, outline="#1e293b", width=3)

    draw.text((40, 40), "⚡ CHARGING SESSION COMPLETED", fill="#22c55e")
    draw.line([(40, 70), (width - 40, 70)], fill="#334155", width=2)

    draw.text((50, 110), "Location / Charger:", fill="#94a3b8")
    draw.text((250, 100), "Home Wallbox (7.4 kW)", fill="#f8fafc")

    draw.text((50, 170), "Battery Level:", fill="#94a3b8")
    draw.text((250, 160), "30% ➔ 80%", fill="#38bdf8")

    draw.text((50, 230), "Energy Delivered:", fill="#94a3b8")
    draw.text((250, 220), "34.40 kWh (Net into Battery)", fill="#4ade80")

    draw.text((50, 290), "Start Time:", fill="#94a3b8")
    draw.text((250, 280), "2026-09-08 22:00:00", fill="#cbd5e1")

    draw.text((50, 350), "End Time:", fill="#94a3b8")
    draw.text((250, 340), "2026-09-09 06:00:00", fill="#cbd5e1")

    draw.text((50, 410), "Status: Complete | Efficiency: 90%", fill="#64748b")

    path = SAMPLES_DIR / "charging_sample.png"
    img.save(path)
    print(f"Created sample charging image: {path}")


if __name__ == "__main__":
    create_trip_sample()
    create_charging_sample()
