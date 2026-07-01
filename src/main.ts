import { app, BrowserWindow, powerMonitor } from "electron";
import { Reading, Credentials } from "./shared/types";
import { PushChannels } from "./shared/ipc-channels";
import { PythonBackend } from "./main/python-backend";
import { Storage } from "./main/storage";
import { createMainWindow, createWidgetWindow, installProductionCSP } from "./main/windows";
import { TrayManager } from "./main/tray";
import { buildAppMenu } from "./main/menu";
import { registerIpcHandlers } from "./main/ipc-handlers";
import { initLogger, createLogger } from "./main/logger";
import { wasLaunchedAtLogin } from "./main/launch-agent";

initLogger();
const log = createLogger("system");
const dataLog = createLogger("data");

log.info("App starting");

// --- State ---

let Python: PythonBackend | null = null;
let Win: BrowserWindow;
let Widget: BrowserWindow | null = null;
let widgetOpen = false;
let recentReadings: Reading[] = [];
let isQuitting = false;
let restartAttempts = 0;
let lastCredentials: Credentials | null = null;
let backendStarting = false;

const storage = new Storage();
const trayManager = new TrayManager((channel, ...args) => pushToRenderer(channel, ...args));

// --- Push helpers ---

function pushToRenderer(channel: string, ...args: any[]) {
  if (Win && !Win.isDestroyed()) {
    Win.webContents.send(channel, ...args);
  }
}

function pushToWidget(channel: string, ...args: any[]) {
  if (widgetOpen && Widget && !Widget.isDestroyed()) {
    Widget.webContents.send(channel, ...args);
  }
}

// --- Widget management ---

function ensureWidget() {
  if (!Widget || Widget.isDestroyed()) {
    Widget = createWidgetWindow();
    Widget.on("close", (e) => {
      if (!isQuitting) {
        e.preventDefault();
        Widget?.hide();
        widgetOpen = false;
        pushToRenderer(PushChannels.CLOSE_WIDGET);
      }
    });
  }
}

function openWidget(focus: string | null) {
  if (!widgetOpen) {
    ensureWidget();
    Widget!.show();
    widgetOpen = true;
    pushToWidget(PushChannels.SETTINGS, storage.getSettings());
    pushToWidget(PushChannels.READING, storage.getCurrentReading());
    if (focus !== "NOFOCUS") {
      Win.focus();
    }
  }
}

// --- Python backend ---

async function startPythonBackend(credentials: Credentials) {
  if (backendStarting) return;
  backendStarting = true;

  try {
    if (Python) {
      await Python.stop();
    }

    Python = new PythonBackend();

    Python.onReading = (reading: Reading) => {
      storage.saveCurrentReading(reading);
      recentReadings = [reading, ...recentReadings].slice(0, 300);
      pushToRenderer(PushChannels.READING, reading);
      pushToWidget(PushChannels.READING, reading);
      trayManager.update(reading, storage.getSettings().unit);
    };

    Python.onConnectionStatusChange = (status) => {
      pushToRenderer(PushChannels.CONNECTION_STATUS, status);
      pushToWidget(PushChannels.CONNECTION_STATUS, status);
    };

    Python.onAuthSuccess = () => {
      restartAttempts = 0;
      try {
        storage.saveCredentials(credentials);
      } catch (err) {
        log.error("Failed to save credentials:", err);
      }
      pushToRenderer(PushChannels.AUTH_SUCCESS);
      Python!
        .getHistory(1440)
        .then((readings) => {
          recentReadings = readings;
          pushToRenderer(PushChannels.HISTORY_BACKFILL, readings);
          pushToWidget(PushChannels.HISTORY_BACKFILL, readings);
        })
        .catch((err) => {
          dataLog.error("Failed to fetch history backfill:", err);
        });
    };

    Python.onAuthError = (error: string) => {
      storage.resetCredentials();
      pushToRenderer(PushChannels.AUTH_ERROR, error);
    };

    Python.onProcessError = () => {
      if (isQuitting) return;
      if (restartAttempts < 3 && lastCredentials) {
        restartAttempts++;
        const delay = Math.pow(2, restartAttempts - 1) * 1000;
        setTimeout(() => {
          if (lastCredentials && !isQuitting) {
            startPythonBackend(lastCredentials).catch(() => {
              pushToRenderer(PushChannels.PYTHON_ERROR);
              if (Win && !Win.isDestroyed()) {
                Win.show();
                Win.restore();
                Win.focus();
              }
            });
          }
        }, delay);
      } else {
        pushToRenderer(PushChannels.PYTHON_ERROR);
        if (Win && !Win.isDestroyed()) {
          Win.show();
          Win.restore();
          Win.focus();
        }
      }
    };

    Python.onProcessKilled = () => {
      pushToRenderer(PushChannels.PYTHON_KILLED);
    };

    lastCredentials = credentials;
    await Python.start(credentials);
  } finally {
    backendStarting = false;
  }
}

// --- IPC ---

registerIpcHandlers({
  storage,
  trayManager,
  startPythonBackend,
  stopPython: async () => {
    lastCredentials = null;
    recentReadings = [];
    if (Python) await Python.stop();
  },
  getHistory: async () => {
    return recentReadings;
  },
  pushToRenderer,
  pushToWidget,
  openWidget,
  closeWidget: () => {
    if (widgetOpen && Widget && !Widget.isDestroyed()) {
      Widget.hide();
      widgetOpen = false;
    }
  },
});

// --- Power management ---

powerMonitor.on("suspend", () => Python?.pause());
powerMonitor.on("resume", () => Python?.resume());
powerMonitor.on("lock-screen", () => Python?.pause());
powerMonitor.on("unlock-screen", () => Python?.resume());

// --- App lifecycle ---

app.on("ready", () => {
  installProductionCSP();
  buildAppMenu();
  const wasOpenedAsHidden = wasLaunchedAtLogin();
  Win = createMainWindow(storage.getWinWindowBounds(), wasOpenedAsHidden);
  Win.on("resized", () => {
    const bounds = Win.getBounds();
    storage.saveWinWindowBounds({ width: bounds.width, height: bounds.height });
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", (e) => {
  isQuitting = true;
  if (Widget && !Widget.isDestroyed()) {
    Widget.destroy();
    Widget = null;
  }
  if (Python?.running) {
    e.preventDefault();
    Python.stop()
      .then(() => app.quit())
      .catch(() => app.quit());
  }
});

app.on("activate", () => {
  if (Win.isDestroyed()) {
    Win = createMainWindow(storage.getWinWindowBounds());
    Win.on("resized", () => {
      const bounds = Win.getBounds();
      storage.saveWinWindowBounds({ width: bounds.width, height: bounds.height });
    });
  } else {
    Win.show();
  }
});

app.setAboutPanelOptions({
  applicationName: "Dexcom (unofficial)",
  applicationVersion: "1.0.0",
  version: "1.0.0",
  credits: "Matthew Blam",
});

app.whenReady().then(() => trayManager.init());

process.on("uncaughtException", (error) => {
  if ((error as NodeJS.ErrnoException).code === "EPIPE") return;
  log.error("Uncaught exception:", error);
  app.quit();
});
