import asyncio
import json
import os
import signal
import sys

import uvicorn
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from .glucose_service import GlucoseService
from .models import GlucoseReading, HealthResponse, LoginRequest

app = FastAPI()
service = GlucoseService()
ws_clients: set[WebSocket] = set()
_secret: str | None = None


class SecretMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if _secret:
            auth = request.headers.get("authorization", "")
            if auth != f"Bearer {_secret}":
                return JSONResponse(status_code=403, content={"detail": "Forbidden"})
        return await call_next(request)


app.add_middleware(SecretMiddleware)


def configure_secret(secret: str) -> None:
    global _secret
    _secret = secret


async def broadcast_reading(reading: GlucoseReading) -> None:
    data = reading.model_dump_json()
    disconnected: list[WebSocket] = []
    for ws in list(ws_clients):
        try:
            await ws.send_text(data)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        ws_clients.discard(ws)


async def handle_error(exc: Exception) -> None:
    data = json.dumps({"error": f"{type(exc).__name__}: {exc}"})
    disconnected: list[WebSocket] = []
    for ws in list(ws_clients):
        try:
            await ws.send_text(data)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        ws_clients.discard(ws)


service.on_reading = broadcast_reading
service.on_error = handle_error


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", authenticated=service.authenticated)


@app.post("/login")
async def login(req: LoginRequest) -> dict[str, str]:
    try:
        await service.login(req.username, req.password, req.region)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    await service.start_polling()
    return {"status": "ok"}


@app.get("/glucose/history")
async def glucose_history(minutes: int = 1440, max_count: int = 288):
    readings = await service.get_readings_history(minutes, max_count)
    return [r.model_dump() for r in readings]


@app.post("/pause")
async def pause() -> dict[str, str]:
    service.pause()
    return {"status": "paused"}


@app.post("/resume")
async def resume() -> dict[str, str]:
    service.resume()
    return {"status": "resumed"}


@app.post("/shutdown")
async def shutdown() -> dict[str, str]:
    await service.stop_polling()
    asyncio.get_event_loop().call_later(0.5, _force_exit)
    return {"status": "shutting_down"}


def _force_exit() -> None:
    os._exit(0)


@app.websocket("/ws/glucose")
async def glucose_ws(ws: WebSocket) -> None:
    if _secret:
        token = ws.query_params.get("token", "")
        if token != _secret:
            await ws.close(code=1008)
            return
    await ws.accept()
    ws_clients.add(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        ws_clients.discard(ws)


async def main(secret: str | None = None) -> None:
    if secret:
        configure_secret(secret)

    config = uvicorn.Config(
        app,
        host="127.0.0.1",
        port=0,
        log_level="warning",
        loop="asyncio",
        http="h11",
        ws="websockets",
    )
    server = uvicorn.Server(config)

    if not config.loaded:
        config.load()
    server.lifespan = config.lifespan_class(config)

    await server.startup()
    if not server.servers:
        sys.exit(1)

    port = server.servers[0].sockets[0].getsockname()[1]
    print(f"PORT:{port}", flush=True)

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(server.shutdown()))

    await server.main_loop()
    await server.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
