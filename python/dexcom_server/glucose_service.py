import asyncio
import datetime
import random
from collections import OrderedDict
from collections.abc import Callable
from functools import partial
from typing import Any

from pydexcom import Dexcom

from .models import GlucoseReading

BASE_POLL_INTERVAL = 60
MAX_POLL_INTERVAL = 300
MAX_REAUTH_ATTEMPTS = 3
SEEN_IDS_MAX = 500
API_TIMEOUT = 30


def _format_time(dt: datetime.datetime) -> tuple[str, str]:
    date_str = dt.strftime("%y/%m/%d")
    time_str = dt.strftime("X%I:%M %p").replace("X0", "X").replace("X", "").lower()
    return date_str, time_str


def _format_dedup_id(dt: datetime.datetime) -> str:
    date_str = dt.strftime("%y/%m/%d")
    time_str = dt.strftime("X%I:%M:%S %p").replace("X0", "X").replace("X", "").lower()
    return f"{date_str}, {time_str}"


def _convert_reading(raw: Any) -> GlucoseReading:
    if raw is None:
        now = datetime.datetime.now(datetime.timezone.utc)
        date_str, time_str = _format_time(now)
        return GlucoseReading(
            id=_format_dedup_id(now),
            value=-1,
            mmol_l=-1,
            trend=0,
            trend_direction="Unavailable",
            trend_description="Unavailable",
            trend_arrow="Unavailable",
            date_time=[date_str, time_str],
            trend_reliable=False,
        )

    trend: int = raw.trend
    value: int = raw.value
    mmol_l: float = raw.mmol_l
    trend_reliable = trend not in (0, 8, 9)

    date_str, time_str = _format_time(raw.datetime)

    return GlucoseReading(
        id=_format_dedup_id(raw.datetime),
        value=value,
        mmol_l=mmol_l,
        trend=trend,
        trend_direction=raw.trend_direction,
        trend_description=raw.trend_description or "",
        trend_arrow=raw.trend_arrow,
        date_time=[date_str, time_str],
        trend_reliable=trend_reliable,
    )


def _is_auth_error(exc: Exception) -> bool:
    name = type(exc).__name__.lower()
    msg = str(exc).lower()
    return "auth" in name or "auth" in msg or "session" in msg or "login" in msg


class GlucoseService:
    def __init__(self) -> None:
        self._dexcom: Dexcom | None = None
        self._polling_task: asyncio.Task[None] | None = None
        self._paused: bool = False
        self._seen_ids: OrderedDict[str, None] = OrderedDict()
        self._username: str | None = None
        self._password: str | None = None
        self._region: str | None = None
        self._reauth_attempts: int = 0
        self._poll_interval: float = BASE_POLL_INTERVAL
        self.on_reading: Callable[[GlucoseReading], Any] | None = None
        self.on_error: Callable[[Exception], Any] | None = None

    @property
    def authenticated(self) -> bool:
        return self._dexcom is not None

    async def login(self, username: str, password: str, region: str) -> None:
        self._username = username
        self._password = password
        self._region = region
        loop = asyncio.get_running_loop()
        self._dexcom = await asyncio.wait_for(
            loop.run_in_executor(
                None, partial(Dexcom, username=username, password=password, region=region)
            ),
            timeout=API_TIMEOUT,
        )
        self._reauth_attempts = 0

    async def _try_reauth(self) -> bool:
        if not self._username or not self._password or not self._region:
            return False
        if self._reauth_attempts >= MAX_REAUTH_ATTEMPTS:
            return False
        self._reauth_attempts += 1
        try:
            await self.login(self._username, self._password, self._region)
            return True
        except Exception:
            return False

    async def get_current_reading(self) -> GlucoseReading:
        if self._dexcom is None:
            raise RuntimeError("Not authenticated")
        loop = asyncio.get_running_loop()
        raw = await asyncio.wait_for(
            loop.run_in_executor(None, self._dexcom.get_current_glucose_reading),
            timeout=API_TIMEOUT,
        )
        return _convert_reading(raw)

    async def get_readings_history(self, minutes: int = 1440, max_count: int = 288) -> list[GlucoseReading]:
        if self._dexcom is None:
            raise RuntimeError("Not authenticated")
        loop = asyncio.get_running_loop()
        raw = await asyncio.wait_for(
            loop.run_in_executor(
                None, partial(self._dexcom.get_glucose_readings, minutes=minutes, max_count=max_count)
            ),
            timeout=API_TIMEOUT,
        )
        return [_convert_reading(r) for r in (raw or [])]

    async def start_polling(self) -> None:
        if self._polling_task is not None and not self._polling_task.done():
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

    def _add_seen_id(self, reading_id: str) -> None:
        self._seen_ids[reading_id] = None
        while len(self._seen_ids) > SEEN_IDS_MAX:
            self._seen_ids.popitem(last=False)

    async def _poll_loop(self) -> None:
        while True:
            if not self._paused:
                try:
                    reading = await self.get_current_reading()
                    if reading.id not in self._seen_ids:
                        if self.on_reading:
                            await self.on_reading(reading)
                        self._add_seen_id(reading.id)
                    self._poll_interval = BASE_POLL_INTERVAL
                    self._reauth_attempts = 0
                except Exception as exc:
                    if _is_auth_error(exc) and await self._try_reauth():
                        self._poll_interval = BASE_POLL_INTERVAL
                    else:
                        self._poll_interval = min(self._poll_interval * 2, MAX_POLL_INTERVAL)
                        if not _is_auth_error(exc):
                            self._reauth_attempts = 0
                        if self.on_error:
                            try:
                                await self.on_error(exc)
                            except Exception:
                                pass
            await asyncio.sleep(self._poll_interval)
