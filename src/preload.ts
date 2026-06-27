import { ipcRenderer, contextBridge } from "electron";
import { IpcChannels, PushChannels } from "./shared/ipc-channels";

function onPush(channel: string, callback: (...args: any[]) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, handler);
    return () => { ipcRenderer.removeListener(channel, handler); };
}

contextBridge.exposeInMainWorld("api", {
    // Request-response (invoke)
    getSettings: () => ipcRenderer.invoke(IpcChannels.SETTINGS_GET),
    saveSettings: (settings: any) => ipcRenderer.invoke(IpcChannels.SETTINGS_SAVE, settings),
    domReady: () => ipcRenderer.invoke(IpcChannels.APP_DOM_READY),
    restart: () => ipcRenderer.invoke(IpcChannels.APP_RESTART),
    login: (credentials: any) => ipcRenderer.invoke(IpcChannels.AUTH_LOGIN, credentials),
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
    saveReading: (reading: any) => ipcRenderer.invoke(IpcChannels.READING_SAVE, reading),
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
    onReading: (cb: any) => onPush(PushChannels.READING, cb),
    onAuthSuccess: (cb: any) => onPush(PushChannels.AUTH_SUCCESS, cb),
    onAuthError: (cb: any) => onPush(PushChannels.AUTH_ERROR, cb),
    onPythonError: (cb: any) => onPush(PushChannels.PYTHON_ERROR, cb),
    onPythonKilled: (cb: any) => onPush(PushChannels.PYTHON_KILLED, cb),
    onCloseWidget: (cb: any) => onPush(PushChannels.CLOSE_WIDGET, cb),
    onTrayOpenWidget: (cb: any) => onPush(PushChannels.TRAY_OPEN_WIDGET, cb),
    onTrayCloseWidget: (cb: any) => onPush(PushChannels.TRAY_CLOSE_WIDGET, cb),
    onLog: (cb: any) => onPush(PushChannels.LOG, cb),
    onSettings: (cb: any) => onPush(PushChannels.SETTINGS, cb),
    onConnectionStatus: (cb: any) => onPush(PushChannels.CONNECTION_STATUS, cb),
    onHistoryBackfill: (cb: any) => onPush(PushChannels.HISTORY_BACKFILL, cb),
});
