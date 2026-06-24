from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str
    region: str = "us"


class GlucoseReading(BaseModel):
    id: str
    value: int
    mmol_l: float
    trend: int
    trend_direction: str
    trend_description: str
    trend_arrow: str
    date_time: list[str]


class HealthResponse(BaseModel):
    status: str
    authenticated: bool
