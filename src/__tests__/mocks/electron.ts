import { vi } from "vitest";

export const _mockState = {
  encryptionAvailable: true,
};

export const app = {
  getPath: vi.fn().mockReturnValue("/tmp/test-electron"),
  setLoginItemSettings: vi.fn(),
  on: vi.fn(),
  quit: vi.fn(),
  relaunch: vi.fn(),
  whenReady: vi.fn().mockResolvedValue(undefined),
};

export const safeStorage = {
  isEncryptionAvailable: vi.fn(() => _mockState.encryptionAvailable),
  encryptString: vi.fn((str: string) => {
    return Buffer.from(`encrypted:${str}`);
  }),
  decryptString: vi.fn((buf: Buffer) => {
    const str = buf.toString();
    if (str.startsWith("encrypted:")) {
      return str.slice("encrypted:".length);
    }
    throw new Error("Decryption failed");
  }),
};

export const ipcMain = {
  handle: vi.fn(),
  on: vi.fn(),
};

export const BrowserWindow = vi.fn();

export default {
  app,
  safeStorage,
  ipcMain,
  BrowserWindow,
};
