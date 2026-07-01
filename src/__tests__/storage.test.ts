import { describe, it, expect, vi, beforeEach } from "vitest";
import { _mockState } from "./mocks/electron";
import { Storage } from "../main/storage";
import { DEFAULT_READING, DEFAULT_SETTINGS } from "../shared/types";

let fileData: Record<string, any> = {};

const mockReadFileSync = vi.fn<(path: string, enc?: string) => string>(
  () => JSON.stringify(fileData)
);
const mockWriteFileSync = vi.fn<(path: string, data: string, opts?: object) => void>(
  (_p, content) => { fileData = JSON.parse(content as string); }
);
const mockChmodSync = vi.fn<(path: string, mode: number) => void>();

vi.mock("fs", () => ({
  default: {
    readFileSync: (p: string, e?: string) => mockReadFileSync(p, e),
    writeFileSync: (p: string, d: string, o?: object) => mockWriteFileSync(p, d, o),
    chmodSync: (p: string, m: number) => mockChmodSync(p, m),
  },
  readFileSync: (p: string, e?: string) => mockReadFileSync(p, e),
  writeFileSync: (p: string, d: string, o?: object) => mockWriteFileSync(p, d, o),
  chmodSync: (p: string, m: number) => mockChmodSync(p, m),
}));

function setupFs(data: Record<string, any> = {}) {
  fileData = { ...data };
  mockReadFileSync.mockImplementation(() => JSON.stringify(fileData));
  mockWriteFileSync.mockImplementation((_p, content) => {
    fileData = JSON.parse(content as string);
  });
  mockChmodSync.mockReset();
}

function createStorage() {
  return new Storage();
}

describe("Storage", () => {
  beforeEach(() => {
    setupFs();
    _mockState.encryptionAvailable = true;
  });

  describe("get/set operations", () => {
    it("returns default window bounds when none stored", () => {
      const storage = createStorage();
      expect(storage.getWinWindowBounds()).toEqual({ width: 800, height: 500 });
    });

    it("persists and retrieves window bounds", () => {
      const storage = createStorage();
      storage.saveWinWindowBounds({ width: 1024, height: 768 });
      expect(storage.getWinWindowBounds()).toEqual({ width: 1024, height: 768 });
    });

    it("returns default widget position when none stored", () => {
      const storage = createStorage();
      expect(storage.getWidgetPosition()).toEqual(["0px", "0px"]);
    });

    it("persists and retrieves widget position", () => {
      const storage = createStorage();
      storage.saveWidgetPosition(["100px", "200px"]);
      expect(storage.getWidgetPosition()).toEqual(["100px", "200px"]);
    });

    it("returns default widget open state", () => {
      const storage = createStorage();
      expect(storage.getWidgetOpen()).toBe(false);
    });

    it("returns default reading when none stored", () => {
      const storage = createStorage();
      expect(storage.getCurrentReading()).toEqual(DEFAULT_READING);
    });

    it("persists and retrieves current reading", () => {
      const storage = createStorage();
      const reading = { ...DEFAULT_READING, value: 120, mmol_l: 6.7 };
      storage.saveCurrentReading(reading);
      expect(storage.getCurrentReading()).toEqual(reading);
    });

    it("returns default history split", () => {
      const storage = createStorage();
      expect(storage.getHistorySplit()).toBe(75);
    });

    it("returns default history time range", () => {
      const storage = createStorage();
      expect(storage.getHistoryTimeRange()).toBe(180);
    });

    it("returns default history graph height", () => {
      const storage = createStorage();
      expect(storage.getHistoryGraphHeight()).toBe(300);
    });
  });

  describe("settings", () => {
    it("returns default settings when none stored", () => {
      const storage = createStorage();
      expect(storage.getSettings()).toEqual(DEFAULT_SETTINGS);
    });

    it("merges stored settings with defaults", () => {
      setupFs({ settings: { sensor: "G6", high: 180 } });
      const storage = createStorage();
      const settings = storage.getSettings();
      expect(settings.sensor).toBe("G6");
      expect(settings.high).toBe(180);
      expect(settings.unit).toBe("mg/dl");
      expect(settings.low).toBe(70);
    });

    it("resets settings to defaults", () => {
      setupFs({ settings: { sensor: "G6" } });
      const storage = createStorage();
      storage.resetSettings();
      expect(storage.getSettings()).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe("credentials", () => {
    it("returns undefined when no credentials stored", () => {
      const storage = createStorage();
      expect(storage.getCredentials()).toBeUndefined();
    });

    it("encrypts and decrypts credentials round-trip", () => {
      const storage = createStorage();
      const creds = { user: "test@example.com", password: "pass123", region: "us" as const };
      storage.saveCredentials(creds);
      expect(storage.getCredentials()).toEqual(creds);
    });

    it("throws when encryption is not available", () => {
      _mockState.encryptionAvailable = false;
      const storage = createStorage();
      expect(() =>
        storage.saveCredentials({ user: "test", password: "pass", region: "us" as const })
      ).toThrow("OS encryption is not available");
    });

    it("resets credentials", () => {
      const storage = createStorage();
      const creds = { user: "test@example.com", password: "pass123", region: "us" as const };
      storage.saveCredentials(creds);
      storage.resetCredentials();
      expect(storage.getCredentials()).toBeUndefined();
    });

    it("returns undefined and clears on decryption failure", () => {
      setupFs({ credentials_encrypted: "not-valid-base64-!!!" });
      const storage = createStorage();
      expect(storage.getCredentials()).toBeUndefined();
    });
  });

  describe("legacy credential migration (SEC-00A)", () => {
    it("deletes legacy plaintext credentials on construction", () => {
      setupFs({ credentials: { user: "old", password: "old" } });
      createStorage();
      expect(fileData["credentials"]).toBeUndefined();
    });

    it("preserves other data when deleting legacy credentials", () => {
      setupFs({
        credentials: { user: "old", password: "old" },
        "widget-open": true,
      });
      createStorage();
      expect(fileData["credentials"]).toBeUndefined();
      expect(fileData["widget-open"]).toBe(true);
    });
  });

  describe("file permissions (SEC-00B)", () => {
    it("sets chmod 0o600 on construction", () => {
      createStorage();
      expect(mockChmodSync).toHaveBeenCalledWith(expect.any(String), 0o600);
    });

    it("writes with mode 0o600", () => {
      const storage = createStorage();
      mockWriteFileSync.mockClear();
      storage.saveWidgetOpen(true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { mode: 0o600 }
      );
    });
  });
});
