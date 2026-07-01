import asyncio
import datetime
from collections import OrderedDict
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from dexcom_server.glucose_service import (
    GlucoseService,
    _convert_reading,
    _format_dedup_id,
    _format_time,
    _is_auth_error,
    BASE_POLL_INTERVAL,
    SEEN_IDS_MAX,
)
from dexcom_server.models import GlucoseReading


class TestFormatTime:
    def test_formats_date_correctly(self):
        dt = datetime.datetime(2025, 6, 15, 14, 30, 45)
        date_str, time_str = _format_time(dt)
        assert date_str == "25/06/15"

    def test_formats_pm_time(self):
        dt = datetime.datetime(2025, 6, 15, 14, 30, 0)
        _, time_str = _format_time(dt)
        assert time_str == "2:30 pm"

    def test_formats_am_time(self):
        dt = datetime.datetime(2025, 6, 15, 9, 5, 0)
        _, time_str = _format_time(dt)
        assert time_str == "9:05 am"

    def test_formats_noon(self):
        dt = datetime.datetime(2025, 1, 1, 12, 0, 0)
        _, time_str = _format_time(dt)
        assert time_str == "12:00 pm"

    def test_formats_midnight(self):
        dt = datetime.datetime(2025, 1, 1, 0, 0, 0)
        _, time_str = _format_time(dt)
        assert time_str == "12:00 am"

    def test_strips_leading_zero_from_hour(self):
        dt = datetime.datetime(2025, 1, 1, 8, 30, 0)
        _, time_str = _format_time(dt)
        assert not time_str.startswith("0")


class TestFormatDedupId:
    def test_includes_seconds(self):
        dt = datetime.datetime(2025, 6, 27, 10, 30, 45)
        dedup_id = _format_dedup_id(dt)
        assert dedup_id == "25/06/27, 10:30:45 am"

    def test_different_seconds_produce_different_ids(self):
        dt1 = datetime.datetime(2025, 6, 27, 10, 30, 0)
        dt2 = datetime.datetime(2025, 6, 27, 10, 30, 15)
        assert _format_dedup_id(dt1) != _format_dedup_id(dt2)


class TestConvertReading:
    def _make_raw(self, value=120, mmol_l=6.7, trend=4, dt=None):
        raw = SimpleNamespace()
        raw.value = value
        raw.mmol_l = mmol_l
        raw.trend = trend
        raw.trend_direction = "Flat"
        raw.trend_description = "steady"
        raw.trend_arrow = "→"
        raw.datetime = dt or datetime.datetime(2025, 6, 27, 10, 30, 0)
        return raw

    def test_converts_normal_reading(self):
        raw = self._make_raw()
        reading = _convert_reading(raw)
        assert reading.value == 120
        assert reading.mmol_l == 6.7
        assert reading.trend == 4
        assert reading.trend_direction == "Flat"
        assert reading.date_time == ["25/06/27", "10:30 am"]
        assert reading.trend_reliable is True

    def test_generates_id_with_seconds(self):
        raw = self._make_raw(dt=datetime.datetime(2025, 6, 27, 10, 30, 45))
        reading = _convert_reading(raw)
        assert reading.id == "25/06/27, 10:30:45 am"

    def test_none_reading_returns_unavailable(self):
        reading = _convert_reading(None)
        assert reading.value == -1
        assert reading.mmol_l == -1
        assert reading.trend == 0
        assert reading.trend_direction == "Unavailable"
        assert reading.trend_reliable is False

    def test_trend_0_preserves_value_marks_unreliable(self):
        raw = self._make_raw(trend=0)
        reading = _convert_reading(raw)
        assert reading.value == 120
        assert reading.mmol_l == 6.7
        assert reading.trend_reliable is False

    def test_trend_8_preserves_value_marks_unreliable(self):
        raw = self._make_raw(trend=8)
        reading = _convert_reading(raw)
        assert reading.value == 120
        assert reading.trend_reliable is False

    def test_trend_9_preserves_value_marks_unreliable(self):
        raw = self._make_raw(trend=9)
        reading = _convert_reading(raw)
        assert reading.value == 120
        assert reading.trend_reliable is False

    def test_normal_trend_preserves_values(self):
        for trend in (1, 2, 3, 4, 5, 6, 7):
            raw = self._make_raw(trend=trend)
            reading = _convert_reading(raw)
            assert reading.value == 120, f"trend {trend} should preserve value"
            assert reading.trend_reliable is True

    def test_empty_trend_description_becomes_empty_string(self):
        raw = self._make_raw()
        raw.trend_description = None
        reading = _convert_reading(raw)
        assert reading.trend_description == ""

    def test_none_reading_uses_utc(self):
        reading = _convert_reading(None)
        assert reading.date_time[0] != "Unavailable"
        assert reading.date_time[1] != "Unavailable"


class TestIsAuthError:
    def test_detects_auth_in_exception_name(self):
        class AuthenticationError(Exception):
            pass
        assert _is_auth_error(AuthenticationError("fail"))

    def test_detects_auth_in_message(self):
        assert _is_auth_error(Exception("authentication failed"))

    def test_detects_session_in_message(self):
        assert _is_auth_error(Exception("session expired"))

    def test_rejects_unrelated_error(self):
        assert not _is_auth_error(Exception("network timeout"))


class TestGlucoseService:
    def test_initial_state(self):
        svc = GlucoseService()
        assert not svc.authenticated
        assert svc.on_reading is None
        assert svc.on_error is None

    @pytest.mark.asyncio
    async def test_login_sets_authenticated(self):
        svc = GlucoseService()
        with patch("dexcom_server.glucose_service.Dexcom") as MockDexcom:
            MockDexcom.return_value = MagicMock()
            await svc.login("user", "pass", "us")
            assert svc.authenticated

    @pytest.mark.asyncio
    async def test_login_stores_credentials(self):
        svc = GlucoseService()
        with patch("dexcom_server.glucose_service.Dexcom") as MockDexcom:
            MockDexcom.return_value = MagicMock()
            await svc.login("user", "pass", "ous")
            assert svc._username == "user"
            assert svc._password == "pass"
            assert svc._region == "ous"

    @pytest.mark.asyncio
    async def test_get_current_reading_requires_auth(self):
        svc = GlucoseService()
        with pytest.raises(RuntimeError, match="Not authenticated"):
            await svc.get_current_reading()

    @pytest.mark.asyncio
    async def test_get_readings_history_requires_auth(self):
        svc = GlucoseService()
        with pytest.raises(RuntimeError, match="Not authenticated"):
            await svc.get_readings_history()

    def test_pause_resume(self):
        svc = GlucoseService()
        assert not svc._paused
        svc.pause()
        assert svc._paused
        svc.resume()
        assert not svc._paused

    def test_seen_ids_is_ordered_dict(self):
        svc = GlucoseService()
        assert isinstance(svc._seen_ids, OrderedDict)

    def test_add_seen_id_evicts_oldest(self):
        svc = GlucoseService()
        for i in range(SEEN_IDS_MAX + 10):
            svc._add_seen_id(f"id-{i}")
        assert len(svc._seen_ids) == SEEN_IDS_MAX
        assert "id-0" not in svc._seen_ids
        assert f"id-{SEEN_IDS_MAX + 9}" in svc._seen_ids

    @pytest.mark.asyncio
    async def test_try_reauth_succeeds(self):
        svc = GlucoseService()
        with patch("dexcom_server.glucose_service.Dexcom") as MockDexcom:
            MockDexcom.return_value = MagicMock()
            await svc.login("user", "pass", "us")
            svc._dexcom = None
            result = await svc._try_reauth()
            assert result is True
            assert svc.authenticated

    @pytest.mark.asyncio
    async def test_try_reauth_respects_max_attempts(self):
        svc = GlucoseService()
        svc._username = "user"
        svc._password = "pass"
        svc._region = "us"
        svc._reauth_attempts = 3
        result = await svc._try_reauth()
        assert result is False

    @pytest.mark.asyncio
    async def test_poll_loop_calls_on_reading(self):
        svc = GlucoseService()
        callback = AsyncMock()
        svc.on_reading = callback

        raw = SimpleNamespace()
        raw.value = 120
        raw.mmol_l = 6.7
        raw.trend = 4
        raw.trend_direction = "Flat"
        raw.trend_description = "steady"
        raw.trend_arrow = "→"
        raw.datetime = datetime.datetime(2025, 6, 27, 10, 30, 0)

        mock_dexcom = MagicMock()
        mock_dexcom.get_current_glucose_reading = MagicMock(return_value=raw)
        svc._dexcom = mock_dexcom

        await svc.start_polling()
        await asyncio.sleep(0.1)
        await svc.stop_polling()

        assert callback.call_count >= 1
        reading = callback.call_args[0][0]
        assert isinstance(reading, GlucoseReading)
        assert reading.value == 120

    @pytest.mark.asyncio
    async def test_poll_loop_skips_when_paused(self):
        svc = GlucoseService()
        callback = AsyncMock()
        svc.on_reading = callback

        mock_dexcom = MagicMock()
        svc._dexcom = mock_dexcom
        svc.pause()

        await svc.start_polling()
        await asyncio.sleep(0.1)
        await svc.stop_polling()

        assert callback.call_count == 0

    @pytest.mark.asyncio
    async def test_poll_loop_calls_on_error(self):
        svc = GlucoseService()
        error_callback = AsyncMock()
        svc.on_error = error_callback

        mock_dexcom = MagicMock()
        mock_dexcom.get_current_glucose_reading = MagicMock(
            side_effect=Exception("network error")
        )
        svc._dexcom = mock_dexcom

        await svc.start_polling()
        await asyncio.sleep(0.1)
        await svc.stop_polling()

        assert error_callback.call_count >= 1

    @pytest.mark.asyncio
    async def test_poll_loop_resets_interval_on_success(self):
        svc = GlucoseService()
        svc._poll_interval = 300

        raw = SimpleNamespace()
        raw.value = 120
        raw.mmol_l = 6.7
        raw.trend = 4
        raw.trend_direction = "Flat"
        raw.trend_description = "steady"
        raw.trend_arrow = "→"
        raw.datetime = datetime.datetime(2025, 6, 27, 10, 30, 0)

        mock_dexcom = MagicMock()
        mock_dexcom.get_current_glucose_reading = MagicMock(return_value=raw)
        svc._dexcom = mock_dexcom
        svc.on_reading = AsyncMock()

        await svc.start_polling()
        await asyncio.sleep(0.1)
        await svc.stop_polling()

        assert svc._poll_interval == BASE_POLL_INTERVAL
