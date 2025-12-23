import warnings

# Silence urllib3 LibreSSL warning noise on macOS.
warnings.filterwarnings(
    "ignore",
    message=r"urllib3 v2 only supports OpenSSL 1\.1\.1\+",
)

from pydexcom import Dexcom
from time import sleep
import threading
import datetime
import sys
import os

os.set_blocking(sys.stdin.fileno(), False)  # Allow stdin input

def broadcast(*message):
    print(*message)
    sys.stdout.flush()


broadcast("PYTHON START")

TREND_DIRECTIONS = {
    0: "None",
    1: "DoubleUp",
    2: "SingleUp",
    3: "FortyFiveUp",
    4: "Flat",
    5: "FortyFiveDown",
    6: "SingleDown",
    7: "DoubleDown",
    8: "NotComputable",
    9: "RateOutOfRange",
}

TREND_DESCRIPTIONS = {
    0: "",
    1: "Rising Quickly",
    2: "Rising",
    3: "Rising Slightly",
    4: "Steady",
    5: "Falling Slightly",
    6: "Falling",
    7: "Falling Quickly",
    8: "Unable to Determine Trend",
    9: "Trend Unavailable",
}

TREND_ARROWS = {
    0: "",
    1: "↑↑",
    2: "↑",
    3: "↗",
    4: "→",
    5: "↘",
    6: "↓",
    7: "↓↓",
    8: "?",
    9: "-",
}

USERNAME = sys.argv[1]
PASSWORD = sys.argv[2]
OUS = eval(sys.argv[3].title())
# broadcast(USERNAME, PASSWORD, OUS)

auth_error = False

try:
    DEXCOM = Dexcom(username=USERNAME, password=PASSWORD, ous=OUS)  # `ous=True` if outside of US
    broadcast("AUTH SUCCESS")
except Exception as e:
    broadcast("AUTH ERROR:", e)
    auth_error = True

def get_reading():
    G = DEXCOM.get_current_glucose_reading()
    broadcast("API Response:", G)
    if G is None:
        now = datetime.datetime.now()
        date = now.strftime("%y/%m/%d")
        time = now.strftime("X%I:%M %p").replace("X0", "X").replace("X", "").lower()
        return {"id": f"{date}, {time}", "value": -1, "mmol_l": -1, "trend": 0, "trend_direction": "Unavailable", "trend_description": "Unavailable", "trend_arrow": "Unavailable", "date_time": "Unavailable"}
    value = G.value
    mmol_l = G.mmol_l
    trend = G.trend
    trend_direction = TREND_DIRECTIONS[trend]
    trend_description = TREND_DESCRIPTIONS[trend]
    trend_arrow = TREND_ARROWS[trend]
    if trend == 0 or trend == 8 or trend == 9:
        value = -1
        mmol_l = -1
    date = G.datetime.strftime("%y/%m/%d")
    time = G.datetime.strftime("X%I:%M %p").replace("X0", "X").replace("X", "").lower()
    return {"id": f"{date}, {time}", "value": value, "mmol_l": mmol_l, "trend": trend, "trend_direction": trend_direction, "trend_description": trend_description, "trend_arrow": trend_arrow, "date_time": [date, time]}


used_ids = []
def send_reading(reading):
    ID = reading["id"]
    if ID in used_ids:
        broadcast("DUPLICATE:", reading)
    else:
        broadcast("READING:", reading)
    used_ids.append(ID)


PAUSED = False
class Glucose(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        self.event = threading.Event()

    def run(self):
        while not self.event.is_set():
            if not PAUSED:
                broadcast(datetime.datetime.now().time().strftime("%I:%M %p"), "Checking Glucose")
                glucose_reading = get_reading()
                send_reading(glucose_reading)
                self.event.wait(timeout=60)
            self.event.wait(timeout=1)
        broadcast("BROKE GLUCOSE LOOP")


if not auth_error:
    thread = Glucose()
    thread.start()
    while True:
        terminate = False
        used_lines = []
        for line in sys.stdin.readlines():
            line = str(line).strip()
            if line in used_lines:
                continue
            if "PAUSE" in line:
                broadcast("PAUSING")
                PAUSED = True
            if "RESUME" in line:
                broadcast("RESUMING")
                PAUSED = False
            if "TERMINATE" in line:
                thread.event.set()
                terminate = True
                break
            used_lines.append(line)
        if terminate:
            break
        sleep(0.5)
    broadcast("CLOSING PYTHON")
