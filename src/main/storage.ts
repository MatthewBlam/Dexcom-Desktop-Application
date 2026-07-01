import { app, safeStorage } from "electron";
import fs from "fs";
import path from "path";
import {
  Reading,
  Settings,
  Credentials,
  WindowBounds,
  DEFAULT_READING,
  DEFAULT_SETTINGS,
} from "../shared/types";

const CONFIG_PATH = path.join(app.getPath("userData"), "config.json");

export class Storage {
  private data: Record<string, any>;

  constructor() {
    this.data = this.load();

    if (this.data["credentials"]) {
      delete this.data["credentials"];
      this.persist();
    }

    try {
      fs.chmodSync(CONFIG_PATH, 0o600);
    } catch {}
  }

  private load(): Record<string, any> {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    } catch {
      return {};
    }
  }

  private persist(): void {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.data, null, 2), { mode: 0o600 });
  }

  private get<T>(key: string, fallback: T): T {
    const value = this.data[key];
    if (value === undefined || value === null) {
      this.data[key] = fallback;
      this.persist();
      return fallback;
    }
    return value as T;
  }

  private set(key: string, value: any): void {
    this.data[key] = value;
    this.persist();
  }

  private remove(key: string): void {
    delete this.data[key];
    this.persist();
  }

  getWinWindowBounds(): WindowBounds {
    return this.get("win-bounds", { width: 800, height: 500 });
  }

  saveWinWindowBounds(bounds: WindowBounds): void {
    this.set("win-bounds", bounds);
  }

  getWidgetPosition(): string[] {
    return this.get("widget-position", ["0px", "0px"]);
  }

  saveWidgetPosition(position: string[]): void {
    this.set("widget-position", position);
  }

  getWidgetOpen(): boolean {
    return this.get("widget-open", false);
  }

  saveWidgetOpen(open: boolean): void {
    this.set("widget-open", open);
  }

  getCurrentReading(): Reading {
    return this.get("current-reading", DEFAULT_READING);
  }

  saveCurrentReading(reading: Reading): void {
    this.set("current-reading", reading);
  }

  getHistorySplit(): number {
    return this.get("history-split", 75);
  }

  saveHistorySplit(percent: number): void {
    this.set("history-split", percent);
  }

  getHistoryTimeRange(): number {
    return this.get("history-time-range", 180);
  }

  saveHistoryTimeRange(minutes: number): void {
    this.set("history-time-range", minutes);
  }

  getHistoryGraphHeight(): number {
    return this.get("history-graph-height", 300);
  }

  saveHistoryGraphHeight(height: number): void {
    this.set("history-graph-height", height);
  }

  getSettings(): Settings {
    const stored = this.data["settings"];
    if (!stored) return this.get("settings", DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  saveSettings(settings: Settings): void {
    this.set("settings", settings);
  }

  resetSettings(): void {
    this.remove("settings");
  }

  getCredentials(): Credentials | undefined {
    const encoded = this.data["credentials_encrypted"];
    if (!encoded) return undefined;
    try {
      const buffer = Buffer.from(encoded, "base64");
      const raw = safeStorage.isEncryptionAvailable()
        ? JSON.parse(safeStorage.decryptString(buffer))
        : JSON.parse(buffer.toString());
      if ("ous" in raw && !("region" in raw)) {
        raw.region = raw.ous ? "ous" : "us";
        delete raw.ous;
        this.saveCredentials(raw);
      }
      return raw as Credentials;
    } catch {
      this.remove("credentials_encrypted");
      return undefined;
    }
  }

  saveCredentials(credentials: Credentials): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Cannot save credentials: OS encryption is not available");
    }
    const json = JSON.stringify(credentials);
    this.set("credentials_encrypted", safeStorage.encryptString(json).toString("base64"));
  }

  resetCredentials(): void {
    this.remove("credentials_encrypted");
  }
}
