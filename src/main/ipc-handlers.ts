import { app, BrowserWindow, ipcMain } from "electron";
import { Credentials, Reading, Settings } from "../shared/types";
import { IpcChannels, PushChannels } from "../shared/ipc-channels";
import type { Storage } from "./storage";
import type { TrayManager } from "./tray";

export interface AppContext {
  storage: Storage;
  trayManager: TrayManager;
  startPythonBackend: (credentials: Credentials) => Promise<void>;
  stopPython: () => Promise<void>;
  getHistory: (minutes: number) => Promise<Reading[]>;
  pushToRenderer: (channel: string, ...args: any[]) => void;
  pushToWidget: (channel: string, ...args: any[]) => void;
  openWidget: (focus: string | null) => void;
  closeWidget: () => void;
}

export function registerIpcHandlers(ctx: AppContext): void {
  ipcMain.handle(IpcChannels.APP_DOM_READY, () => {
    const settings = ctx.storage.getSettings();
    const credentials = ctx.storage.getCredentials();
    if (credentials) {
      console.log("Logging in with stored:", credentials.user);
      ctx.startPythonBackend(credentials).catch((err) => {
        console.error("Failed to start Python backend:", err);
        ctx.pushToRenderer(PushChannels.AUTH_ERROR, String(err));
      });
    }
    return { settings, hasCredentials: !!credentials };
  });

  ipcMain.handle(IpcChannels.APP_RESTART, () => {
    app.relaunch();
    app.quit();
  });

  ipcMain.handle(IpcChannels.AUTH_LOGIN, async (_e, credentials: Credentials) => {
    console.log("Logging in with:", credentials.user);
    try {
      await ctx.startPythonBackend(credentials);
    } catch (err) {
      console.error("Failed to start Python backend:", err);
      ctx.pushToRenderer(PushChannels.AUTH_ERROR, err instanceof Error ? err.message : String(err));
    }
  });

  ipcMain.handle(IpcChannels.AUTH_LOGOUT, async () => {
    try {
      ctx.storage.resetCredentials();
      ctx.trayManager.reset();
    } finally {
      await ctx.stopPython();
    }
  });

  ipcMain.handle(IpcChannels.SETTINGS_GET, () => {
    return ctx.storage.getSettings();
  });

  ipcMain.handle(IpcChannels.SETTINGS_SAVE, (_e, settings: Settings) => {
    try {
      const prev = ctx.storage.getSettings();
      ctx.storage.saveSettings(settings);
      ctx.pushToWidget(PushChannels.SETTINGS, settings);
      if (settings.launchAtLogin !== prev.launchAtLogin) {
        app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  });

  ipcMain.handle(IpcChannels.WIDGET_OPEN, (_e, focus: string | null) => {
    ctx.trayManager.showCloseWidgetMenu();
    ctx.openWidget(focus);
  });

  ipcMain.handle(IpcChannels.WIDGET_CLOSE, () => {
    ctx.trayManager.showOpenWidgetMenu();
    ctx.closeWidget();
  });

  ipcMain.handle(IpcChannels.WIDGET_GET_POSITION, () =>
    ctx.storage.getWidgetPosition()
  );

  ipcMain.handle(IpcChannels.WIDGET_SAVE_POSITION, (_e, position: string[]) =>
    ctx.storage.saveWidgetPosition(position)
  );

  ipcMain.handle(IpcChannels.WIDGET_GET_OPEN_STATE, () =>
    ctx.storage.getWidgetOpen()
  );

  ipcMain.handle(IpcChannels.WIDGET_SAVE_OPEN_STATE, (_e, open: boolean) =>
    ctx.storage.saveWidgetOpen(open)
  );

  ipcMain.handle(IpcChannels.WIDGET_SET_IGNORE_MOUSE, (event, ignore: boolean, options?: Electron.IgnoreMouseEventsOptions) => {
    BrowserWindow.fromWebContents(event.sender)?.setIgnoreMouseEvents(ignore, options);
  });

  ipcMain.handle(IpcChannels.READING_GET_CURRENT, () =>
    ctx.storage.getCurrentReading()
  );

  ipcMain.handle(IpcChannels.READING_SAVE, (_e, reading: Reading) =>
    ctx.storage.saveCurrentReading(reading)
  );

  ipcMain.handle(IpcChannels.TRAY_RESET, () => ctx.trayManager.reset());

  ipcMain.handle(IpcChannels.HISTORY_GET_SPLIT, () =>
    ctx.storage.getHistorySplit()
  );

  ipcMain.handle(IpcChannels.HISTORY_SAVE_SPLIT, (_e, percent: number) =>
    ctx.storage.saveHistorySplit(percent)
  );

  ipcMain.handle(IpcChannels.HISTORY_GET_TIME_RANGE, () =>
    ctx.storage.getHistoryTimeRange()
  );

  ipcMain.handle(IpcChannels.HISTORY_SAVE_TIME_RANGE, (_e, minutes: number) =>
    ctx.storage.saveHistoryTimeRange(minutes)
  );

  ipcMain.handle(IpcChannels.HISTORY_GET_GRAPH_HEIGHT, () =>
    ctx.storage.getHistoryGraphHeight()
  );

  ipcMain.handle(IpcChannels.HISTORY_SAVE_GRAPH_HEIGHT, (_e, height: number) =>
    ctx.storage.saveHistoryGraphHeight(height)
  );

  ipcMain.handle(IpcChannels.HISTORY_GET, async (_e, minutes: number) => {
    try {
      return await ctx.getHistory(minutes);
    } catch (err) {
      console.error("Failed to get history:", err);
      return [];
    }
  });

  ipcMain.handle(IpcChannels.TRAY_SET_WIDGET_STATE, (_e, open: boolean) => {
    if (open) {
      ctx.trayManager.showCloseWidgetMenu();
    } else {
      ctx.trayManager.showOpenWidgetMenu();
    }
  });
}
