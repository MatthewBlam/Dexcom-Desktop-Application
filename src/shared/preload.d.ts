import type { Credentials, Reading, Settings } from "./types";

export interface DexcomApi {
    // Settings
    getSettings(): Promise<Settings>;
    saveSettings(settings: Settings): Promise<void>;

    // App lifecycle
    domReady(): Promise<{ settings: Settings; hasCredentials: boolean }>;
    restart(): Promise<void>;

    // Auth
    login(credentials: Credentials): Promise<void>;
    logout(): Promise<void>;

    // Widget management
    openWidget(focus?: string | null): Promise<void>;
    closeWidget(): Promise<void>;
    getWidgetPosition(): Promise<string[]>;
    saveWidgetPosition(position: string[]): Promise<void>;
    getWidgetOpenState(): Promise<boolean>;
    saveWidgetOpenState(open: boolean): Promise<void>;
    setIgnoreMouseEvents(ignore: boolean, options: object | null): Promise<void>;

    // Reading
    getCurrentReading(): Promise<Reading>;
    saveReading(reading: Reading): Promise<void>;

    // Tray
    resetTray(): Promise<void>;
    setTrayWidgetState(open: boolean): Promise<void>;

    // Push event listeners (return unsubscribe function)
    onReading(callback: (reading: Reading) => void): () => void;
    onAuthSuccess(callback: () => void): () => void;
    onAuthError(callback: (error: string | null) => void): () => void;
    onPythonError(callback: () => void): () => void;
    onPythonKilled(callback: () => void): () => void;
    onCloseWidget(callback: () => void): () => void;
    onTrayOpenWidget(callback: () => void): () => void;
    onTrayCloseWidget(callback: () => void): () => void;
    onLog(callback: (messages: any[]) => void): () => void;
    onSettings(callback: (settings: Settings) => void): () => void;
}

declare global {
    interface Window {
        api: DexcomApi;
    }
}
