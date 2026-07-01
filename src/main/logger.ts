import log from "electron-log/main";
import { app } from "electron";
import path from "path";

export type LogCategory = "auth" | "settings" | "data" | "system";

export interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export function initLogger(): void {
  log.transports.file.resolvePathFn = () =>
    path.join(app.getPath("userData"), "logs", "main.log");
  log.transports.file.maxSize = 1024 * 1024;
  log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}";
  log.initialize();
}

export function createLogger(category: LogCategory): Logger {
  const scoped = log.scope(category);
  return {
    info: (message: string, ...args: unknown[]) => scoped.info(message, ...args),
    warn: (message: string, ...args: unknown[]) => scoped.warn(message, ...args),
    error: (message: string, ...args: unknown[]) => scoped.error(message, ...args),
  };
}
