import { spawn, ChildProcess } from "child_process";
import crypto from "crypto";
import path from "path";
import WebSocket from "ws";
import { Reading, Credentials, ConnectionStatus } from "../shared/types";
import { createLogger } from "./logger";

const log = createLogger("data");

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;

function isValidReading(obj: unknown): obj is Reading {
  if (typeof obj !== "object" || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.value === "number" &&
    typeof r.mmol_l === "number" &&
    typeof r.trend === "number" &&
    typeof r.trend_direction === "string" &&
    typeof r.trend_description === "string" &&
    typeof r.trend_arrow === "string" &&
    Array.isArray(r.date_time) &&
    r.date_time.length === 2 &&
    typeof r.date_time[0] === "string" &&
    typeof r.date_time[1] === "string" &&
    typeof r.trend_reliable === "boolean"
  );
}

const PORT_TIMEOUT_MS = 15_000;
const SHUTDOWN_TIMEOUT_MS = 5_000;
const WS_RECONNECT_DELAY_MS = 5_000;
const HEALTH_CHECK_INTERVAL_MS = 30_000;
const HEALTH_CHECK_MAX_FAILURES = 3;

export class PythonBackend {
  private process: ChildProcess | null = null;
  private port: number | null = null;
  private ws: WebSocket | null = null;
  private credentials: Credentials | null = null;
  private stopping = false;
  private processErrorFired = false;
  private _connectionStatus: ConnectionStatus = "disconnected";
  private secret: string | null = null;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private healthCheckFailures = 0;

  onReading: ((reading: Reading) => void) | null = null;
  onConnectionStatusChange: ((status: ConnectionStatus) => void) | null = null;
  onAuthSuccess: (() => void) | null = null;
  onAuthError: ((error: string) => void) | null = null;
  onProcessError: (() => void) | null = null;
  onProcessKilled: (() => void) | null = null;

  get running(): boolean {
    return this.process !== null && this.process.exitCode === null;
  }

  get connectionStatus(): ConnectionStatus {
    return this._connectionStatus;
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    if (status !== this._connectionStatus) {
      this._connectionStatus = status;
      this.onConnectionStatusChange?.(status);
    }
  }

  private fireProcessError(): void {
    if (this.stopping || this.processErrorFired) return;
    this.processErrorFired = true;
    this.onProcessError?.();
  }

  async start(credentials: Credentials): Promise<void> {
    if (this.running) {
      await this.stop();
    }

    this.stopping = false;
    this.processErrorFired = false;
    this.credentials = credentials;
    this.secret = crypto.randomBytes(32).toString("hex");

    const { exe, args, cwd } = this.resolvePythonPath();
    this.process = spawn(exe, [...args, "--secret", this.secret], {
      shell: false,
      cwd,
    });

    this.process.stderr?.on("data", (chunk: Buffer) => {
      log.error("python-backend stderr:", chunk.toString());
    });

    this.process.on("error", (err) => {
      log.error("python-backend spawn error:", err.message);
      this.process = null;
      this.port = null;
      this.fireProcessError();
    });

    this.process.on("exit", (code) => {
      log.info(`python-backend process exited with code ${code}`);
      this.port = null;
      this.closeWebSocket();
      this.stopHealthCheck();
      this.fireProcessError();
    });

    try {
      this.port = await this.waitForPort();
    } catch (err) {
      this.kill();
      throw err;
    }

    if (this.stopping) return;

    try {
      await this.login(credentials);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.stopping = true;
      this.kill();
      this.onAuthError?.(message);
      return;
    }

    if (this.stopping) return;

    this.connectWebSocket();
    this.startHealthCheck();
    this.onAuthSuccess?.();
  }

  async stop(): Promise<void> {
    this.stopping = true;
    this.closeWebSocket();
    this.stopHealthCheck();

    if (!this.running) {
      this.process = null;
      this.port = null;
      this.onProcessKilled?.();
      return;
    }

    try {
      await this.httpPost("/shutdown");
    } catch {
      // Server may already be gone
    }

    await this.waitForExit();
    this.onProcessKilled?.();
  }

  pause(): void {
    if (this.port) {
      this.httpPost("/pause").catch(() => {});
    }
  }

  async resume(): Promise<void> {
    if (!this.port || this.stopping) return;
    try {
      await this.httpGet("/health");
      await this.httpPost("/resume");
    } catch {
      this.fireProcessError();
    }
  }

  private resolvePythonPath(): { exe: string; args: string[]; cwd?: string } {
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      return {
        exe: "python3",
        args: ["-m", "dexcom_server"],
        cwd: path.resolve(__dirname, "..", "..", "python"),
      };
    }

    const ext = process.platform === "win32" ? ".exe" : "";
    const exe = path.join(process.resourcesPath, `dexcom${ext}`);
    return { exe, args: [] };
  }

  private waitForPort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Timed out waiting for Python server port"));
      }, PORT_TIMEOUT_MS);

      const stdout = this.process?.stdout;
      if (!stdout) {
        clearTimeout(timer);
        reject(new Error("No stdout on spawned process"));
        return;
      }

      let buffer = "";
      const cleanup = () => {
        clearTimeout(timer);
        stdout.removeListener("data", onData);
        stdout.removeListener("close", onClose);
      };

      const onClose = () => {
        cleanup();
        reject(new Error("Python process exited before reporting port"));
      };

      const onData = (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        for (const line of lines) {
          const match = line.match(/^PORT:(\d+)$/);
          if (match) {
            cleanup();
            resolve(parseInt(match[1], 10));
            return;
          }
        }
        buffer = lines[lines.length - 1];
      };

      stdout.on("data", onData);
      stdout.on("close", onClose);
    });
  }

  private async login(credentials: Credentials): Promise<void> {
    const resp = await this.httpPost("/login", {
      username: credentials.user,
      password: credentials.password,
      region: credentials.region,
    });

    if (resp.status !== "ok") {
      throw new Error(resp.error ?? resp.message ?? "Login failed");
    }
  }

  private connectWebSocket(): void {
    if (!this.port || this.stopping) return;

    const url = this.secret
      ? `ws://127.0.0.1:${this.port}/ws/glucose?token=${this.secret}`
      : `ws://127.0.0.1:${this.port}/ws/glucose`;
    this.ws = new WebSocket(url);

    this.ws.on("open", () => {
      this.setConnectionStatus("connected");
    });

    this.ws.on("message", (data: WebSocket.Data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.error) {
          log.warn("python-backend server error:", parsed.error);
          this.onConnectionStatusChange?.("error");
          return;
        }
        if (!isValidReading(parsed)) {
          log.warn("python-backend malformed reading, skipping:", parsed);
          return;
        }
        this.onReading?.(parsed);
      } catch (err) {
        log.error("python-backend failed to parse WS message:", err);
      }
    });

    this.ws.on("close", () => {
      if (this.running && !this.stopping) {
        this.setConnectionStatus("reconnecting");
        setTimeout(() => this.connectWebSocket(), WS_RECONNECT_DELAY_MS);
      }
    });

    this.ws.on("error", (err) => {
      log.error("python-backend WebSocket error:", err.message);
    });
  }

  private closeWebSocket(): void {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.terminate();
      this.ws = null;
    }
    this.setConnectionStatus("disconnected");
  }

  private startHealthCheck(): void {
    this.healthCheckFailures = 0;
    this.healthCheckTimer = setInterval(async () => {
      if (this.stopping) return;
      try {
        await this.httpGet("/health");
        this.healthCheckFailures = 0;
      } catch {
        this.healthCheckFailures++;
        if (this.healthCheckFailures >= HEALTH_CHECK_MAX_FAILURES) {
          this.stopHealthCheck();
          this.fireProcessError();
        }
      }
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  async getHistory(minutes: number): Promise<Reading[]> {
    return this.httpGet(`/glucose/history?minutes=${minutes}&max_count=288`);
  }

  private async httpGet(urlPath: string): Promise<any> {
    const url = `http://127.0.0.1:${this.port}${urlPath}`;
    const headers: Record<string, string> = {};
    if (this.secret) {
      headers["Authorization"] = `Bearer ${this.secret}`;
    }
    const resp = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
    const json = await resp.json();
    if (!resp.ok) {
      throw new Error(json.detail ?? `HTTP ${resp.status}`);
    }
    return json;
  }

  private async httpPost(urlPath: string, body?: object): Promise<any> {
    const url = `http://127.0.0.1:${this.port}${urlPath}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.secret) {
      headers["Authorization"] = `Bearer ${this.secret}`;
    }
    const options: RequestInit = {
      method: "POST",
      headers,
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    options.signal = AbortSignal.timeout(15_000);
    const resp = await fetch(url, options);
    const json = await resp.json();
    if (!resp.ok && !json.status) {
      throw new Error(json.detail ?? `HTTP ${resp.status}`);
    }
    return json;
  }

  private waitForExit(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.running) {
        this.process = null;
        this.port = null;
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        this.kill();
        resolve();
      }, SHUTDOWN_TIMEOUT_MS);

      this.process!.once("exit", () => {
        clearTimeout(timer);
        this.process = null;
        this.port = null;
        resolve();
      });
    });
  }

  private kill(): void {
    if (this.process && this.process.exitCode === null) {
      this.process.kill("SIGKILL");
    }
    this.process = null;
    this.port = null;
  }
}
