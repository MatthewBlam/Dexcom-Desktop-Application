import type { ConnectionStatus, Credentials, Reading, Settings } from "./types";

// Request-response channels (ipcRenderer.invoke ↔ ipcMain.handle)
export const IpcChannels = {
    // Settings
    SETTINGS_GET: "settings:get",
    SETTINGS_SAVE: "settings:save",

    // App lifecycle
    APP_DOM_READY: "app:dom-ready",
    APP_RESTART: "app:restart",

    // Auth
    AUTH_LOGIN: "auth:login",
    AUTH_LOGOUT: "auth:logout",

    // Widget management
    WIDGET_OPEN: "widget:open",
    WIDGET_CLOSE: "widget:close",
    WIDGET_GET_POSITION: "widget:get-position",
    WIDGET_SAVE_POSITION: "widget:save-position",
    WIDGET_GET_OPEN_STATE: "widget:get-open-state",
    WIDGET_SAVE_OPEN_STATE: "widget:save-open-state",
    WIDGET_SET_IGNORE_MOUSE: "widget:set-ignore-mouse",

    // Reading
    READING_GET_CURRENT: "reading:get-current",
    READING_SAVE: "reading:save",

    // History
    HISTORY_GET: "history:get",
    HISTORY_GET_SPLIT: "history:get-split",
    HISTORY_SAVE_SPLIT: "history:save-split",
    HISTORY_GET_TIME_RANGE: "history:get-time-range",
    HISTORY_SAVE_TIME_RANGE: "history:save-time-range",
    HISTORY_GET_GRAPH_HEIGHT: "history:get-graph-height",
    HISTORY_SAVE_GRAPH_HEIGHT: "history:save-graph-height",

    // Tray
    TRAY_RESET: "tray:reset",
    TRAY_SET_WIDGET_STATE: "tray:set-widget-state",
} as const;

// Push channels (main → renderer via webContents.send)
export const PushChannels = {
    READING: "push:reading",
    AUTH_SUCCESS: "push:auth-success",
    AUTH_ERROR: "push:auth-error",
    PYTHON_ERROR: "push:python-error",
    PYTHON_KILLED: "push:python-killed",
    CLOSE_WIDGET: "push:close-widget",
    TRAY_OPEN_WIDGET: "push:tray-open-widget",
    TRAY_CLOSE_WIDGET: "push:tray-close-widget",
    LOG: "push:log",
    SETTINGS: "push:settings",
    CONNECTION_STATUS: "push:connection-status",
    HISTORY_BACKFILL: "push:history-backfill",
} as const;

// Type maps for invoke channels
export interface InvokeMap {
    [IpcChannels.SETTINGS_GET]: { args: void; result: Settings };
    [IpcChannels.SETTINGS_SAVE]: { args: Settings; result: void };
    [IpcChannels.APP_DOM_READY]: { args: void; result: { settings: Settings; hasCredentials: boolean } };
    [IpcChannels.APP_RESTART]: { args: void; result: void };
    [IpcChannels.AUTH_LOGIN]: { args: Credentials; result: void };
    [IpcChannels.AUTH_LOGOUT]: { args: void; result: void };
    [IpcChannels.WIDGET_OPEN]: { args: string | null; result: void };
    [IpcChannels.WIDGET_CLOSE]: { args: void; result: void };
    [IpcChannels.WIDGET_GET_POSITION]: { args: void; result: string[] };
    [IpcChannels.WIDGET_SAVE_POSITION]: { args: string[]; result: void };
    [IpcChannels.WIDGET_GET_OPEN_STATE]: { args: void; result: boolean };
    [IpcChannels.WIDGET_SAVE_OPEN_STATE]: { args: boolean; result: void };
    [IpcChannels.WIDGET_SET_IGNORE_MOUSE]: { args: [boolean, object | null]; result: void };
    [IpcChannels.READING_GET_CURRENT]: { args: void; result: Reading };
    [IpcChannels.READING_SAVE]: { args: Reading; result: void };
    [IpcChannels.TRAY_RESET]: { args: void; result: void };
    [IpcChannels.TRAY_SET_WIDGET_STATE]: { args: boolean; result: void };
    [IpcChannels.HISTORY_GET]: { args: number; result: Reading[] };
    [IpcChannels.HISTORY_GET_SPLIT]: { args: void; result: number };
    [IpcChannels.HISTORY_SAVE_SPLIT]: { args: number; result: void };
    [IpcChannels.HISTORY_GET_TIME_RANGE]: { args: void; result: number };
    [IpcChannels.HISTORY_SAVE_TIME_RANGE]: { args: number; result: void };
    [IpcChannels.HISTORY_GET_GRAPH_HEIGHT]: { args: void; result: number };
    [IpcChannels.HISTORY_SAVE_GRAPH_HEIGHT]: { args: number; result: void };
}

// Type maps for push channels
export interface PushMap {
    [PushChannels.READING]: Reading;
    [PushChannels.AUTH_SUCCESS]: void;
    [PushChannels.AUTH_ERROR]: string | null;
    [PushChannels.PYTHON_ERROR]: void;
    [PushChannels.PYTHON_KILLED]: void;
    [PushChannels.CLOSE_WIDGET]: void;
    [PushChannels.TRAY_OPEN_WIDGET]: void;
    [PushChannels.TRAY_CLOSE_WIDGET]: void;
    [PushChannels.LOG]: any[];
    [PushChannels.SETTINGS]: Settings;
    [PushChannels.CONNECTION_STATUS]: ConnectionStatus;
    [PushChannels.HISTORY_BACKFILL]: Reading[];
}
