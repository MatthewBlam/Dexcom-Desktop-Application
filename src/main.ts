import { app, BrowserWindow, powerMonitor } from "electron";
import electronSquirrelStartup from "electron-squirrel-startup";
import { Reading, Credentials } from "./shared/types";
import { PushChannels } from "./shared/ipc-channels";
import { PythonBackend } from "./main/python-backend";
import { Storage } from "./main/storage";
import { createMainWindow, createWidgetWindow, installProductionCSP } from "./main/windows";
import { TrayManager } from "./main/tray";
import { buildAppMenu } from "./main/menu";
import { registerIpcHandlers } from "./main/ipc-handlers";

if (electronSquirrelStartup) {
  app.quit();
}

// --- State ---

let Python: PythonBackend | null = null;
let Win: BrowserWindow;
let Widget: BrowserWindow;
let widgetOpen = false;
let recentReadings: Reading[] = [];

const storage = new Storage();
const trayManager = new TrayManager((channel, ...args) => Win?.webContents.send(channel, ...args));

// --- Push helpers ---

function pushToRenderer(channel: string, ...args: any[]) {
  Win.webContents.send(channel, ...args);
}

function pushToWidget(channel: string, ...args: any[]) {
  if (widgetOpen) {
    Widget.webContents.send(channel, ...args);
  }
}

// --- Widget management ---

function openWidget(focus: string | null) {
  if (!widgetOpen) {
    Widget = createWidgetWindow();
    widgetOpen = true;
    if (focus !== "NOFOCUS") {
      Widget.webContents.once("did-finish-load", () => {
        Win.focus();
      });
    }
    Widget.on("close", () => {
      widgetOpen = false;
      pushToRenderer(PushChannels.CLOSE_WIDGET);
    });
  }
}

// --- Python backend ---

async function startPythonBackend(credentials: Credentials) {
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
    storage.saveCredentials(credentials);
    pushToRenderer(PushChannels.AUTH_SUCCESS);
    Python!
      .getHistory(1440)
      .then((readings) => {
        recentReadings = readings;
        pushToRenderer(PushChannels.HISTORY_BACKFILL, readings);
        pushToWidget(PushChannels.HISTORY_BACKFILL, readings);
      })
      .catch((err) => {
        console.error("[main] Failed to fetch history backfill:", err);
      });
  };

  Python.onAuthError = (error: string) => {
    storage.resetCredentials();
    pushToRenderer(PushChannels.AUTH_ERROR, error);
  };

  Python.onProcessError = () => {
    pushToRenderer(PushChannels.PYTHON_ERROR);
    Win.show();
    Win.restore();
    Win.focus();
  };

  Python.onProcessKilled = () => {
    pushToRenderer(PushChannels.PYTHON_KILLED);
  };

  await Python.start(credentials);
}

// --- IPC ---

registerIpcHandlers({
  storage,
  trayManager,
  startPythonBackend,
  stopPython: async () => {
    if (Python) await Python.stop();
  },
  getHistory: async () => {
    return recentReadings;
  },
  pushToRenderer,
  pushToWidget,
  openWidget,
  closeWidget: () => {
    if (widgetOpen) Widget.close();
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
  const wasOpenedAsHidden = app.getLoginItemSettings().wasOpenedAsHidden;
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
  if (Python?.running) {
    e.preventDefault();
    Python.stop().then(() => app.quit());
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    Win = createMainWindow(storage.getWinWindowBounds());
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
buildAppMenu();

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
