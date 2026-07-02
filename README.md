<!-- PROJECT LOGO -->
<div align="center">
  <a href="https://github.com/MatthewBlam/Dexcom-macOS/releases/tag/v1.0.0">
    <img src="src/graphics/app-icon-1024.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Dexcom Desktop Application</h3>

  <p align="center">
    View and monitor your Dexcom blood glucose readings on the computer. Not affiliated with Dexcom, Inc.
    <br />
    <br />
    Download here: <a href="https://github.com/MatthewBlam/Dexcom-macOS/releases/tag/v1.0.0">v1.0.0</a>
  </p>
</div>

[Demo](https://dexcom-macos.vercel.app/)

## Architecture

Electron app with a FastAPI Python backend that streams glucose readings via WebSocket.

```
src/
  main.ts                  # Electron main process orchestrator
  preload.ts               # Typed context bridge (DexcomApi)
  main/                    # Main process modules
    windows.ts             #   Window creation (main + widget)
    ipc-handlers.ts        #   IPC handler registration
    python-backend.ts      #   FastAPI child process management
    storage.ts             #   Settings + encrypted credential storage
    tray.ts                #   System tray management
    menu.ts                #   Native menu template
    logger.ts              #   Rotating file logger (electron-log)
    launch-agent.ts        #   macOS LaunchAgent login item management
  shared/                  # Shared between main & renderer
    types.ts               #   Domain types (Reading, Settings, Credentials)
    ipc-channels.ts        #   Typed IPC channel constants
    reading-utils.ts       #   Reading formatting + range utilities
    preload.d.ts           #   Window.api type declarations
  renderer/                # Main renderer (login + display)
    App.tsx, Login.tsx, Display.tsx
  widget/                  # Floating widget renderer
    Widget.tsx
  components/              # Shared React components
    Dexcom.tsx, History.tsx, GlucoseGraph.tsx, Settings.tsx, ...
  contexts/                # React contexts
    SettingsContext.tsx, HistoryContext.tsx
  hooks/                   # Custom React hooks
    useAuth.ts, useConnectionManager.ts, useSettingsManager.ts, ...
  __tests__/               # Vitest + React Testing Library

python/
  entry.py                 # PyInstaller entry point
  dexcom_server/
    main.py                # FastAPI app (HTTP + WebSocket)
    glucose_service.py     # Async glucose polling via pydexcom
    models.py              # Pydantic models
  tests/                   # pytest tests
  requirements.txt
```

**IPC**: Typed per-operation channels (`ipcMain.handle`/`ipcRenderer.invoke` for request-response, `webContents.send`/`ipcRenderer.on` for push).

**Python backend**: FastAPI server spawned as a child process. Communicates via HTTP (login, health, pause/resume, shutdown) and WebSocket (glucose streaming). No credentials in CLI args; port discovered via stdout.

**Storage**: `safeStorage` for encrypted credentials, plain JSON for settings. Zero external dependencies (replaced `electron-store`).

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18, < 24
- [Python](https://www.python.org/) >= 3.12
- npm

## Development

```bash
# Install Node dependencies
npm install

# Install Python dependencies
cd python && pip install -r requirements.txt && cd ..

# Start in development mode (spawns Python source directly)
npm start
```

## Building

```bash
# Build Python binary + package the app
npm run make
```

This compiles the Python backend with PyInstaller and packages the Electron app.

## Scripts

| Command                | Description                    |
| ---------------------- | ------------------------------ |
| `npm start`            | Start dev mode with hot reload |
| `npm test`             | Run tests (Vitest)             |
| `npm run test:watch`   | Run tests in watch mode        |
| `npm run lint`         | Run ESLint                     |
| `npm run build:python` | Compile Python backend binary  |
| `npm run package`      | Build + package (no installer) |
| `npm run make`         | Build + create distributable   |

## Tech Stack

| Layer             | Technology                                      |
| ----------------- | ----------------------------------------------- |
| Desktop framework | Electron 42                                     |
| Frontend          | React 19, Tailwind CSS 4, Recharts 3, Motion 12 |
| Build             | Vite 8, TypeScript 6, Electron Forge 7          |
| Backend           | FastAPI, uvicorn, pydexcom                      |
| Testing           | Vitest, React Testing Library, pytest           |
| Linting           | ESLint 10 (flat config), typescript-eslint      |
