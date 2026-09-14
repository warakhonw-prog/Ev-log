from typing import Union
from models.schemas import TripRecord, ChargingRecord


class LineMessageFormatter:
    """จัดรูปแบบข้อความตอบกลับผู้ใช้ผ่าน LINE (ทั้งแบบ Text และ Flex Message)"""

    @staticmethod
    def format_trip_text(record: TripRecord) -> str:
        dist_str = f"{record.distance_km:.1f} กม." if record.distance_km is not None else "N/A"
        duration_str = f"{record.duration_min} นาที" if record.duration_min is not None else "N/A"
        cons_str = (
            f"{record.avg_consumption:.1f} kWh/100km"
            if record.avg_consumption is not None
            else "N/A"
        )
        soc_s = f"{int(record.soc_start * 100)}%" if record.soc_start is not None else "-"
        soc_e = f"{int(record.soc_end * 100)}%" if record.soc_end is not None else "-"
        energy_str = f"{record.energy_kwh:.2f} kWh" if record.energy_kwh is not None else "N/A"
        cost_net = f"฿{record.cost_net_thb:.2f}" if record.cost_net_thb is not None else "N/A"
        cost_grid = f"฿{record.cost_grid_thb:.2f}" if record.cost_grid_thb is not None else "N/A"

        return (
            "🚗 [บันทึกการเดินทางสำเร็จ]\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            f"🆔 Trip ID: {record.trip_id}\n"
            f"📅 วันที่: {record.date} {record.time}\n"
            f"🛣️ ระยะทาง: {dist_str}\n"
            f"⏱️ เวลาที่ใช้: {duration_str}\n"
            f"⚡ อัตราสิ้นเปลือง: {cons_str}\n"
            f"🔋 แบตเตอรี่: {soc_s} ➔ {soc_e}\n"
            f"🔌 ไฟที่ใช้: {energy_str}\n"
            f"💰 ค่าไฟสุทธิ: {cost_net}\n"
            f"📊 ค่าไฟรวม Loss: {cost_grid}\n"
            f"📝 หมายเหตุ: {record.note or '-'}\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "✅ ข้อมูลถูกบันทึกลง Google Sheets แล้ว"
        )

    @staticmethod
    def format_charging_text(record: ChargingRecord) -> str:
        soc_s = f"{int(record.soc_start * 100)}%" if record.soc_start is not None else "-"
        soc_e = f"{int(record.soc_end * 100)}%" if record.soc_end is not None else "-"
        net_str = f"{record.net_kwh:.2f} kWh" if record.net_kwh is not None else "N/A"
        grid_str = f"{record.grid_kwh:.2f} kWh" if record.grid_kwh is not None else "N/A"
        cost_net = f"฿{record.cost_net_thb:.2f}" if record.cost_net_thb is not None else "N/A"
        cost_grid = f"฿{record.cost_grid_thb:.2f}" if record.cost_grid_thb is not None else "N/A"

        return (
            "⚡ [บันทึกการชาร์จไฟสำเร็จ]\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            f"🆔 Charge ID: {record.charge_id}\n"
            f"📍 สถานที่: {record.location}\n"
            f"🔋 ระดับแบต: {soc_s} ➔ {soc_e}\n"
            f"📥 ไฟเข้าแบตเตอรี่: {net_str}\n"
            f"🔌 ไฟจากมิเตอร์ (Grid): {grid_str}\n"
            f"💰 ค่าไฟสุทธิ: {cost_net}\n"
            f"🧾 ค่าไฟตามมิเตอร์: {cost_grid}\n"
            f"⏰ เริ่ม: {record.start_datetime or '-'}\n"
            f"⏰ สิ้นสุด: {record.end_datetime or '-'}\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "✅ ข้อมูลถูกบันทึกลง Google Sheets แล้ว"
        )

    @staticmethod
    def format_flex_bubble(record: Union[TripRecord, ChargingRecord]) -> dict:
        """สร้าง Flex Message JSON สำหรับส่งผ่าน LINE Messaging API"""
        if isinstance(record, TripRecord):
            title = "🚗 บันทึกการเดินทาง (Trip Log)"
            theme_color = "#1DB446"
            items = [
                {"name": "ระยะทาง", "val": f"{record.distance_km or 0:.1f} km"},
                {"name": "เวลาเดินทาง", "val": f"{record.duration_min or 0} min"},
                {"name": "อัตราสิ้นเปลือง", "val": f"{record.avg_consumption or 0:.1f} kWh/100km"},
                {
                    "name": "แบตเตอรี่",
                    "val": f"{int((record.soc_start or 0)*100)}% ➔ {int((record.soc_end or 0)*100)}%",
                },
                {"name": "พลังงานที่ใช้", "val": f"{record.energy_kwh or 0:.2f} kWh"},
                {"name": "ค่าไฟสุทธิ", "val": f"฿{record.cost_net_thb or 0:.2f}"},
                {"name": "ค่าไฟรวม Loss", "val": f"฿{record.cost_grid_thb or 0:.2f}"},
            ]
        else:
            title = "⚡ บันทึกการชาร์จไฟ (Charge Log)"
            theme_color = "#007AFF"
            items = [
                {"name": "สถานที่", "val": record.location},
                {
                    "name": "ระดับแบตเตอรี่",
                    "val": f"{int((record.soc_start or 0)*100)}% ➔ {int((record.soc_end or 0)*100)}%",
                },
                {"name": "ไฟเข้าแบต", "val": f"{record.net_kwh or 0:.2f} kWh"},
                {"name": "ไฟจากมิเตอร์", "val": f"{record.grid_kwh or 0:.2f} kWh"},
                {"name": "ค่าไฟตามมิเตอร์", "val": f"฿{record.cost_grid_thb or 0:.2f}"},
            ]

        body_contents = [
            {
                "type": "text",
                "text": title,
                "weight": "bold",
                "size": "lg",
                "color": theme_color,
            },
            {"type": "separator", "margin": "md"},
            {
                "type": "box",
                "layout": "vertical",
                "margin": "lg",
                "spacing": "sm",
                "contents": [
                    {
                        "type": "box",
                        "layout": "baseline",
                        "spacing": "sm",
                        "contents": [
                            {"type": "text", "text": item["name"], "color": "#aaaaaa", "size": "sm", "flex": 4},
                            {"type": "text", "text": str(item["val"]), "wrap": True, "color": "#333333", "size": "sm", "flex": 5, "weight": "bold", "align": "end"},
                        ],
                    }
                    for item in items
                ],
            },
        ]

        return {
            "type": "bubble",
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": body_contents,
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "Recorded to Google Sheets",
                        "size": "xs",
                        "color": "#999999",
                        "align": "center",
                    }
                ],
            },
        }
