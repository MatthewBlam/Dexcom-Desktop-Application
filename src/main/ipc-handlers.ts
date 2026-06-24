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
    await ctx.startPythonBackend(credentials);
  });

  ipcMain.handle(IpcChannels.AUTH_LOGOUT, async () => {
    ctx.storage.resetCredentials();
    ctx.trayManager.reset();
    await ctx.stopPython();
  });

  ipcMain.handle(IpcChannels.SETTINGS_GET, () => {
    return ctx.storage.getSettings();
  });

  ipcMain.handle(IpcChannels.SETTINGS_SAVE, (_e, settings: Settings) => {
    ctx.storage.saveSettings(settings);
    ctx.pushToWidget(PushChannels.SETTINGS, settings);
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

  ipcMain.handle(IpcChannels.TRAY_SET_WIDGET_STATE, (_e, open: boolean) => {
    if (open) {
      ctx.trayManager.showCloseWidgetMenu();
    } else {
      ctx.trayManager.showOpenWidgetMenu();
    }
  });
}
