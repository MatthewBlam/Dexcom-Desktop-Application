# Dexcom macOS v1.0.0

The first official release of Dexcom macOS: an unofficial macOS app for viewing and monitoring Dexcom continuous glucose monitor readings on your computer.

_Make sure you have at least one Dexcom Share follower in order to use Dexcom macOS._

## Features

### Real-Time Glucose Monitoring

- Live glucose readings streamed from your Dexcom account via WebSocket
- Trend arrows and direction indicators matching the Dexcom mobile app
- Rate of change display
- Connection status indicator with automatic reconnection

### Glucose History

- Interactive glucose graph with configurable time ranges (1h, 3h, 6h, 12h, 24h)
- Color-coded readings based on your high/low thresholds (green, yellow, red)
- 24-hour history backfill on login

### Floating Widget

- Always-on-top draggable widget overlay showing your current reading
- Optional sparkline graph
- Optional trend indicator
- Adjustable opacity
- Remembers position between sessions

### System Tray

- Menu bar icon with current glucose value
- Quick access to open/close the widget
- Quit from the tray

### Settings

- Dexcom G6 and G7 themes
- mg/dL and mmol/L unit switching
- Configurable high and low thresholds
- Critical low threshold
- Launch at login (via macOS LaunchAgent)
- Widget indicator, sparkline, and opacity controls

### Multi-Region Support

- United States
- Japan
- Outside US (international)

### Security

- Credentials encrypted at rest using macOS Keychain (via Electron safeStorage)
- No credentials passed through CLI arguments
- Content Security Policy enforced in production

## System Requirements

- macOS (Apple Silicon and Intel)
- A Dexcom account with active sensor session
- Internet connection

## Installation

Download the DMG from the [releases page](https://github.com/MatthewBlam/Dexcom-macOS/releases/tag/v1.0.0), open it, and drag Dexcom to your Applications folder.

## Known Limitations

- The app is not code-signed or notarized. On first launch, right-click the app and select "Open" to bypass Gatekeeper, or go to System Settings > Privacy & Security and click "Open Anyway."
- "Launch at Login" registers as a background item (via LaunchAgent) rather than appearing under Login Items in System Settings. You may see a one-time "Background Items Added" notification.

## License

MIT
