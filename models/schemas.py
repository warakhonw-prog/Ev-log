import uuid
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from config.settings import BATTERY_CAPACITY_KWH, ELECTRICITY_RATE_THB, CHARGING_EFFICIENCY


class TripExtractionResult(BaseModel):
    """ผลลัพธ์ที่สกัดจากภาพเรือนไมล์หรือหน้าจอทริปรถ EV"""
    odo_start: Optional[float] = Field(None, description="เลขไมล์เริ่มต้น (กม.)")
    odo_end: Optional[float] = Field(None, description="เลขไมล์สิ้นสุด (กม.)")
    distance_km: Optional[float] = Field(None, description="ระยะทางทริป (กม.)")
    duration_min: Optional[int] = Field(None, description="ระยะเวลาเดินทาง (นาที)")
    avg_consumption: Optional[float] = Field(None, description="อัตราสิ้นเปลืองเฉลี่ย (kWh/100km)")
    soc_start: Optional[float] = Field(None, description="ระดับแบตเตอรี่เริ่มต้น (0.0-1.0 หรือ %)")
    soc_end: Optional[float] = Field(None, description="ระดับแบตเตอรี่สิ้นสุด (0.0-1.0 หรือ %)")
    note: Optional[str] = Field("Auto-extracted via Gemini Vision", description="หมายเหตุเพิ่มเติม")


class ChargingExtractionResult(BaseModel):
    """ผลลัพธ์ที่สกัดจากภาพหน้าจอการชาร์จรถ EV"""
    start_datetime: Optional[str] = Field(None, description="วันเวลาเริ่มชาร์จ (YYYY-MM-DD HH:MM:SS)")
    end_datetime: Optional[str] = Field(None, description="วันเวลาชาร์จเสร็จ (YYYY-MM-DD HH:MM:SS)")
    soc_start: Optional[float] = Field(None, description="ระดับแบตเตอรี่ก่อนชาร์จ (0.0-1.0 หรือ %)")
    soc_end: Optional[float] = Field(None, description="ระดับแบตเตอรี่หลังชาร์จ (0.0-1.0 หรือ %)")
    location: Optional[str] = Field("Home Wallbox", description="ประเภท/สถานที่ชาร์จ")


class ScreenClassificationResult(BaseModel):
    """ผลการจำแนกประเภทภาพถ่าย"""
    screen_type: Literal["trip", "charging", "unknown"] = Field(
        ..., description="ประเภทของหน้าจอที่พบในรูปภาพ"
    )
    confidence: float = Field(..., description="ความมั่นใจ 0.0 - 1.0")
    reason: str = Field(..., description="เหตุผลในการจำแนกประเภท")


class TripRecord(BaseModel):
    """ข้อมูลแถวสำหรับบันทึกลงตาราง Trips (พร้อมคำนวณสูตรสุทธิ)"""
    trip_id: str
    date: str
    time: str
    odo_start: Optional[float] = None
    odo_end: Optional[float] = None
    distance_km: Optional[float] = None
    duration_min: Optional[int] = None
    avg_consumption: Optional[float] = None
    soc_start: Optional[float] = None
    soc_end: Optional[float] = None
    energy_kwh: Optional[float] = None
    cost_net_thb: Optional[float] = None
    cost_grid_thb: Optional[float] = None
    note: str = ""

    @classmethod
    def from_extraction(
        cls,
        data: TripExtractionResult,
        rate: float = ELECTRICITY_RATE_THB,
        efficiency: float = CHARGING_EFFICIENCY,
    ) -> "TripRecord":
        now = datetime.now()
        trip_id = f"TRIP-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"

        # แปลง % SoC ให้อยู่ในรูป 0.0 - 1.0 (ถ้าเป็นค่า 0-100 ให้หาร 100)
        soc_s = data.soc_start
        if soc_s is not None and soc_s > 1.0:
            soc_s = round(soc_s / 100.0, 4)

        soc_e = data.soc_end
        if soc_e is not None and soc_e > 1.0:
            soc_e = round(soc_e / 100.0, 4)

        # ระยะทาง
        dist = data.distance_km
        if dist is None and data.odo_start is not None and data.odo_end is not None:
            dist = round(max(0.0, data.odo_end - data.odo_start), 2)

        # คำนวณ Energy_kWh = (distance_km * avg_consumption) / 100
        energy = None
        if dist is not None and data.avg_consumption is not None:
            energy = round((dist * data.avg_consumption) / 100.0, 3)

        # ค่าไฟ Cost_Net_THB และ Cost_Grid_THB
        cost_net = None
        cost_grid = None
        if energy is not None:
            cost_net = round(energy * rate, 2)
            cost_grid = round((energy / efficiency) * rate, 2)

        return cls(
            trip_id=trip_id,
            date=now.strftime("%Y-%m-%d"),
            time=now.strftime("%H:%M:%S"),
            odo_start=data.odo_start,
            odo_end=data.odo_end,
            distance_km=dist,
            duration_min=data.duration_min,
            avg_consumption=data.avg_consumption,
            soc_start=soc_s,
            soc_end=soc_e,
            energy_kwh=energy,
            cost_net_thb=cost_net,
            cost_grid_thb=cost_grid,
            note=data.note or "Auto-extracted via AI",
        )

    def to_sheet_row(self) -> list:
        return [
            self.trip_id,
            self.date,
            self.time,
            self.odo_start if self.odo_start is not None else "",
            self.odo_end if self.odo_end is not None else "",
            self.distance_km if self.distance_km is not None else "",
            self.duration_min if self.duration_min is not None else "",
            self.avg_consumption if self.avg_consumption is not None else "",
            f"{int(self.soc_start * 100)}%" if self.soc_start is not None else "",
            f"{int(self.soc_end * 100)}%" if self.soc_end is not None else "",
            self.energy_kwh if self.energy_kwh is not None else "",
            self.cost_net_thb if self.cost_net_thb is not None else "",
            self.cost_grid_thb if self.cost_grid_thb is not None else "",
            self.note,
        ]


class ChargingRecord(BaseModel):
    """ข้อมูลแถวสำหรับบันทึกลงตาราง Charging (พร้อมคำนวณสูตรสุทธิ)"""
    charge_id: str
    start_datetime: Optional[str] = None
    end_datetime: Optional[str] = None
    soc_start: Optional[float] = None
    soc_end: Optional[float] = None
    net_kwh: Optional[float] = None
    grid_kwh: Optional[float] = None
    cost_net_thb: Optional[float] = None
    cost_grid_thb: Optional[float] = None
    location: str = "Home Wallbox"

    @classmethod
    def from_extraction(
        cls,
        data: ChargingExtractionResult,
        battery_capacity: float = BATTERY_CAPACITY_KWH,
        rate: float = ELECTRICITY_RATE_THB,
        efficiency: float = CHARGING_EFFICIENCY,
    ) -> "ChargingRecord":
        now = datetime.now()
        charge_id = f"CHG-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"

        soc_s = data.soc_start
        if soc_s is not None and soc_s > 1.0:
            soc_s = round(soc_s / 100.0, 4)

        soc_e = data.soc_end
        if soc_e is not None and soc_e > 1.0:
            soc_e = round(soc_e / 100.0, 4)

        # Net_kWh = battery_capacity * (soc_end - soc_start)
        net_kwh = None
        grid_kwh = None
        cost_net = None
        cost_grid = None

        if soc_s is not None and soc_e is not None and soc_e >= soc_s:
            soc_diff = soc_e - soc_s
            net_kwh = round(battery_capacity * soc_diff, 2)
            grid_kwh = round(net_kwh / efficiency, 2)
            cost_net = round(net_kwh * rate, 2)
            cost_grid = round(grid_kwh * rate, 2)

        start_dt = data.start_datetime or now.strftime("%Y-%m-%d %H:%M:%S")
        end_dt = data.end_datetime or now.strftime("%Y-%m-%d %H:%M:%S")

        return cls(
            charge_id=charge_id,
            start_datetime=start_dt,
            end_datetime=end_dt,
            soc_start=soc_s,
            soc_end=soc_e,
            net_kwh=net_kwh,
            grid_kwh=grid_kwh,
            cost_net_thb=cost_net,
            cost_grid_thb=cost_grid,
            location=data.location or "Home Wallbox",
        )

    def to_sheet_row(self) -> list:
        return [
            self.charge_id,
            self.start_datetime or "",
            self.end_datetime or "",
            f"{int(self.soc_start * 100)}%" if self.soc_start is not None else "",
            f"{int(self.soc_end * 100)}%" if self.soc_end is not None else "",
            self.net_kwh if self.net_kwh is not None else "",
            self.grid_kwh if self.grid_kwh is not None else "",
            self.cost_net_thb if self.cost_net_thb is not None else "",
            self.cost_grid_thb if self.cost_grid_thb is not None else "",
            self.location,
        ]
