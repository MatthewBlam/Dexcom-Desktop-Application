import { BrowserWindow, screen, session } from "electron";
import path from "path";
import { WindowBounds } from "../shared/types";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
declare const WIDGET_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const WIDGET_WINDOW_VITE_NAME: string;

const SECURE_PREFS = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  backgroundThrottling: false,
} as const;

export function installProductionCSP(): void {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) return;
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"],
      },
    });
  });
}

export function createMainWindow(bounds: WindowBounds, startHidden = false): BrowserWindow {
  const win = new BrowserWindow({
    minWidth: 700,
    minHeight: 600,
    width: bounds.width,
    height: bounds.height,
    show: false,
    autoHideMenuBar: true,
    center: true,
    title: "Dexcom",
    frame: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      ...SECURE_PREFS,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  if (!startHidden) {
    win.show();
  }
  return win;
}

export function createWidgetWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const widget = new BrowserWindow({
    width,
    height,
    center: true,
    resizable: false,
    movable: false,
    autoHideMenuBar: true,
    frame: false,
    title: "Dexcom Widget",
    alwaysOnTop: true,
    transparent: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      ...SECURE_PREFS,
    },
  });

  widget.setIgnoreMouseEvents(true, { forward: true });

  widget.webContents.once("did-finish-load", () => {
    widget.show();
  });

  if (WIDGET_WINDOW_VITE_DEV_SERVER_URL) {
    widget.loadURL(WIDGET_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    widget.loadFile(path.join(__dirname, `../renderer/${WIDGET_WINDOW_VITE_NAME}/index.html`));
  }

  return widget;
}
