import asyncio
import datetime
from collections.abc import Callable
from functools import partial
from typing import Any

from pydexcom import Dexcom

from .models import GlucoseReading


def _format_time(dt: datetime.datetime) -> tuple[str, str]:
    date_str = dt.strftime("%y/%m/%d")
    time_str = dt.strftime("X%I:%M %p").replace("X0", "X").replace("X", "").lower()
    return date_str, time_str


def _convert_reading(raw: Any) -> GlucoseReading:
    if raw is None:
        now = datetime.datetime.now()
        date_str, time_str = _format_time(now)
        return GlucoseReading(
            id=f"{date_str}, {time_str}",
            value=-1,
            mmol_l=-1,
            trend=0,
            trend_direction="Unavailable",
            trend_description="Unavailable",
            trend_arrow="Unavailable",
            date_time=[date_str, time_str],
        )

    trend: int = raw.trend
    value: int = raw.value
    mmol_l: float = raw.mmol_l

    if trend in (0, 8, 9):
        value = -1
        mmol_l = -1

    date_str, time_str = _format_time(raw.datetime)

    return GlucoseReading(
        id=f"{date_str}, {time_str}",
        value=value,
        mmol_l=mmol_l,
        trend=trend,
        trend_direction=raw.trend_direction,
        trend_description=raw.trend_description or "",
        trend_arrow=raw.trend_arrow,
        date_time=[date_str, time_str],
    )


class GlucoseService:
    def __init__(self) -> None:
        self._dexcom: Dexcom | None = None
        self._polling_task: asyncio.Task[None] | None = None
        self._paused: bool = False
        self._seen_ids: set[str] = set()
        self.on_reading: Callable[[GlucoseReading], Any] | None = None
        self.on_error: Callable[[Exception], Any] | None = None

    @property
    def authenticated(self) -> bool:
        return self._dexcom is not None

    async def login(self, username: str, password: str, region: str) -> None:
        loop = asyncio.get_running_loop()
        self._dexcom = await loop.run_in_executor(
            None, partial(Dexcom, username=username, password=password, region=region)
        )

    async def get_current_reading(self) -> GlucoseReading:
        if self._dexcom is None:
            raise RuntimeError("Not authenticated")
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, self._dexcom.get_current_glucose_reading)
        return _convert_reading(raw)

    async def start_polling(self) -> None:
        if self._polling_task is not None:
            return
        self._polling_task = asyncio.create_task(self._poll_loop())

    async def stop_polling(self) -> None:
        if self._polling_task is None:
            return
        self._polling_task.cancel()
        try:
            await self._polling_task
        except asyncio.CancelledError:
            pass
        self._polling_task = None

    def pause(self) -> None:
        self._paused = True

    def resume(self) -> None:
        self._paused = False

    async def _poll_loop(self) -> None:
        while True:
            if not self._paused:
                try:
                    reading = await self.get_current_reading()
                    if reading.id not in self._seen_ids:
                        self._seen_ids.add(reading.id)
                        if self.on_reading:
                            await self.on_reading(reading)
                except Exception as exc:
                    if self.on_error:
                        await self.on_error(exc)
            await asyncio.sleep(60)
