import { ipcRenderer, contextBridge } from "electron";
import { IpcChannels, PushChannels } from "./shared/ipc-channels";
import type { Reading, Settings, Credentials, ConnectionStatus } from "./shared/types";
import type { DexcomApi } from "./shared/preload.d";

function onPush<T extends unknown[]>(channel: string, callback: (...args: T) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, ...args: T) => callback(...args);
    ipcRenderer.on(channel, handler);
    return () => { ipcRenderer.removeListener(channel, handler); };
}

const api: DexcomApi = {
    // Request-response (invoke)
    getSettings: () => ipcRenderer.invoke(IpcChannels.SETTINGS_GET),
    saveSettings: (settings: Settings) => ipcRenderer.invoke(IpcChannels.SETTINGS_SAVE, settings),
    domReady: () => ipcRenderer.invoke(IpcChannels.APP_DOM_READY),
    restart: () => ipcRenderer.invoke(IpcChannels.APP_RESTART),
    login: (credentials: Credentials) => ipcRenderer.invoke(IpcChannels.AUTH_LOGIN, credentials),
    logout: () => ipcRenderer.invoke(IpcChannels.AUTH_LOGOUT),
    openWidget: (focus?: string | null) => ipcRenderer.invoke(IpcChannels.WIDGET_OPEN, focus ?? null),
    closeWidget: () => ipcRenderer.invoke(IpcChannels.WIDGET_CLOSE),
    getWidgetPosition: () => ipcRenderer.invoke(IpcChannels.WIDGET_GET_POSITION),
    saveWidgetPosition: (position: string[]) => ipcRenderer.invoke(IpcChannels.WIDGET_SAVE_POSITION, position),
    getWidgetOpenState: () => ipcRenderer.invoke(IpcChannels.WIDGET_GET_OPEN_STATE),
    saveWidgetOpenState: (open: boolean) => ipcRenderer.invoke(IpcChannels.WIDGET_SAVE_OPEN_STATE, open),
    setIgnoreMouseEvents: (ignore: boolean, options: object | null) =>
        ipcRenderer.invoke(IpcChannels.WIDGET_SET_IGNORE_MOUSE, ignore, options),
    getCurrentReading: () => ipcRenderer.invoke(IpcChannels.READING_GET_CURRENT),
    saveReading: (reading: Reading) => ipcRenderer.invoke(IpcChannels.READING_SAVE, reading),
    resetTray: () => ipcRenderer.invoke(IpcChannels.TRAY_RESET),
    setTrayWidgetState: (open: boolean) => ipcRenderer.invoke(IpcChannels.TRAY_SET_WIDGET_STATE, open),
    getHistory: (minutes: number) => ipcRenderer.invoke(IpcChannels.HISTORY_GET, minutes),
    getHistorySplit: () => ipcRenderer.invoke(IpcChannels.HISTORY_GET_SPLIT),
    saveHistorySplit: (percent: number) => ipcRenderer.invoke(IpcChannels.HISTORY_SAVE_SPLIT, percent),
    getHistoryTimeRange: () => ipcRenderer.invoke(IpcChannels.HISTORY_GET_TIME_RANGE),
    saveHistoryTimeRange: (minutes: number) => ipcRenderer.invoke(IpcChannels.HISTORY_SAVE_TIME_RANGE, minutes),
    getHistoryGraphHeight: () => ipcRenderer.invoke(IpcChannels.HISTORY_GET_GRAPH_HEIGHT),
    saveHistoryGraphHeight: (height: number) => ipcRenderer.invoke(IpcChannels.HISTORY_SAVE_GRAPH_HEIGHT, height),

    // Push listeners (return unsubscribe)
    onReading: (cb: (reading: Reading) => void) => onPush(PushChannels.READING, cb),
    onAuthSuccess: (cb: () => void) => onPush(PushChannels.AUTH_SUCCESS, cb),
    onAuthError: (cb: (error: string | null) => void) => onPush(PushChannels.AUTH_ERROR, cb),
    onPythonError: (cb: () => void) => onPush(PushChannels.PYTHON_ERROR, cb),
    onPythonKilled: (cb: () => void) => onPush(PushChannels.PYTHON_KILLED, cb),
    onCloseWidget: (cb: () => void) => onPush(PushChannels.CLOSE_WIDGET, cb),
    onTrayOpenWidget: (cb: () => void) => onPush(PushChannels.TRAY_OPEN_WIDGET, cb),
    onTrayCloseWidget: (cb: () => void) => onPush(PushChannels.TRAY_CLOSE_WIDGET, cb),
    onLog: (cb: (messages: any[]) => void) => onPush(PushChannels.LOG, cb),
    onSettings: (cb: (settings: Settings) => void) => onPush(PushChannels.SETTINGS, cb),
    onConnectionStatus: (cb: (status: ConnectionStatus) => void) => onPush(PushChannels.CONNECTION_STATUS, cb),
    onHistoryBackfill: (cb: (readings: Reading[]) => void) => onPush(PushChannels.HISTORY_BACKFILL, cb),
};

contextBridge.exposeInMainWorld("api", api);
