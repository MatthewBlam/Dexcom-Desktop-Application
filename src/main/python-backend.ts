import { spawn, ChildProcess } from "child_process";
import path from "path";
import WebSocket from "ws";
import { Reading, Credentials } from "../shared/types";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;

const PORT_TIMEOUT_MS = 10_000;
const SHUTDOWN_TIMEOUT_MS = 5_000;
const WS_RECONNECT_DELAY_MS = 5_000;

export class PythonBackend {
  private process: ChildProcess | null = null;
  private port: number | null = null;
  private ws: WebSocket | null = null;
  private credentials: Credentials | null = null;
  private stopping = false;

  onReading: ((reading: Reading) => void) | null = null;
  onAuthSuccess: (() => void) | null = null;
  onAuthError: ((error: string) => void) | null = null;
  onProcessError: (() => void) | null = null;
  onProcessKilled: (() => void) | null = null;

  get running(): boolean {
    return this.process !== null && this.process.exitCode === null;
  }

  async start(credentials: Credentials): Promise<void> {
    if (this.running) {
      await this.stop();
    }

    this.stopping = false;
    this.credentials = credentials;

    const { exe, args, cwd } = this.resolvePythonPath();
    this.process = spawn(exe, args, { shell: false, cwd });

    this.process.stderr?.on("data", (chunk: Buffer) => {
      console.error("[python-backend stderr]", chunk.toString());
    });

    this.process.on("error", (err) => {
      console.error("[python-backend] spawn error:", err.message);
      this.process = null;
      this.port = null;
      if (!this.stopping) {
        this.onProcessError?.();
      }
    });

    this.process.on("exit", (code) => {
      console.log(`[python-backend] process exited with code ${code}`);
      this.port = null;
      this.closeWebSocket();
      if (!this.stopping) {
        this.onProcessError?.();
      }
    });

    try {
      this.port = await this.waitForPort();
    } catch (err) {
      this.kill();
      throw err;
    }

    try {
      await this.login(credentials);
      this.connectWebSocket();
      this.onAuthSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.onAuthError?.(message);
    }
  }

  async stop(): Promise<void> {
    this.stopping = true;
    this.closeWebSocket();

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

  resume(): void {
    if (this.port) {
      this.httpPost("/resume").catch(() => {});
    }
  }

  private resolvePythonPath(): { exe: string; args: string[]; cwd?: string } {
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      return {
        exe: "python3",
        args: ["-m", "dexcom_server.main"],
        cwd: path.resolve(__dirname, "..", "..", "python"),
      };
    }

    const exe = path.join(process.resourcesPath, "dexcom");
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
    const region = credentials.ous ? "ous" : "us";
    const resp = await this.httpPost("/login", {
      username: credentials.user,
      password: credentials.password,
      region,
    });

    if (resp.status !== "ok") {
      throw new Error(resp.error ?? resp.message ?? "Login failed");
    }
  }

  private connectWebSocket(): void {
    if (!this.port || this.stopping) return;

    this.ws = new WebSocket(`ws://127.0.0.1:${this.port}/ws/glucose`);

    this.ws.on("message", (data: WebSocket.Data) => {
      try {
        const reading: Reading = JSON.parse(data.toString());
        this.onReading?.(reading);
      } catch (err) {
        console.error("[python-backend] failed to parse WS message:", err);
      }
    });

    this.ws.on("close", () => {
      if (this.running && !this.stopping) {
        setTimeout(() => this.connectWebSocket(), WS_RECONNECT_DELAY_MS);
      }
    });

    this.ws.on("error", (err) => {
      console.error("[python-backend] WebSocket error:", err.message);
    });
  }

  private closeWebSocket(): void {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
  }

  private async httpPost(urlPath: string, body?: object): Promise<any> {
    const url = `http://127.0.0.1:${this.port}${urlPath}`;
    const options: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

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
