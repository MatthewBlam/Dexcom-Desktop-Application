import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const PLIST_NAME = "com.electron.dexcom.plist";
const LAUNCH_AGENTS_DIR = join(homedir(), "Library", "LaunchAgents");
const PLIST_PATH = join(LAUNCH_AGENTS_DIR, PLIST_NAME);

const PLIST_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.electron.dexcom</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/open</string>
        <string>-a</string>
        <string>Dexcom</string>
        <string>--args</string>
        <string>--launched-at-login</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
`;

export function setLaunchAtLogin(enabled: boolean): void {
  if (enabled) {
    if (!existsSync(LAUNCH_AGENTS_DIR)) {
      mkdirSync(LAUNCH_AGENTS_DIR, { recursive: true });
    }
    writeFileSync(PLIST_PATH, PLIST_CONTENT, "utf-8");
  } else {
    if (existsSync(PLIST_PATH)) {
      unlinkSync(PLIST_PATH);
    }
  }
}

export function wasLaunchedAtLogin(): boolean {
  return process.argv.includes("--launched-at-login");
}
