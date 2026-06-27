# Implementation Progress

## Phase 0: Foundation — Types, IPC, Storage Migration ✅

**Status:** Complete

### Changes made:

**`src/shared/types.ts`**
- Added 6 new fields to `Settings` interface: `criticalLow`, `criticalLowMMOLL`, `notificationsEnabled`, `launchAtLogin`, `widgetSize`, `widgetOpacity`
- Added defaults to `DEFAULT_SETTINGS`: criticalLow=55, criticalLowMMOLL=3.0, notificationsEnabled=true, launchAtLogin=false, widgetSize="medium", widgetOpacity=1.0
- Added `ConnectionStatus` type: `"connected" | "reconnecting" | "disconnected"`

**`src/shared/ipc-channels.ts`**
- Added `HISTORY_GET: "history:get"` to `IpcChannels`
- Added `CONNECTION_STATUS: "push:connection-status"` and `HISTORY_BACKFILL: "push:history-backfill"` to `PushChannels`
- Added corresponding entries in `InvokeMap` and `PushMap`

**`src/preload.ts`**
- Added `getHistory(minutes)` invoke method
- Added `onConnectionStatus(cb)` and `onHistoryBackfill(cb)` push listeners

**`src/main/storage.ts`**
- Fixed `getSettings()` to merge stored settings with `DEFAULT_SETTINGS` so existing users get new default fields on upgrade

**`src/contexts/SettingsContext.tsx`**
- Added state variables: `criticalLowSetting`, `criticalLowSettingMMOLL`, `notificationsEnabledSetting`, `launchAtLoginSetting`, `widgetSizeSetting`, `widgetOpacitySetting` — all with getters/setters exposed in context value

### Verification:
- TypeScript compiles with zero errors (`npx tsc --noEmit` clean)

---

## Phase 1: Glucose Trend Graph + History Backfill + Sparkline + Relative Time ✅

**Status:** Complete

### Changes made:

**Python backend — new history endpoint**
- `python/dexcom_server/glucose_service.py` — Added `get_readings_history(minutes, max_count)` method using `get_glucose_readings` via executor
- `python/dexcom_server/main.py` — Added `GET /glucose/history` endpoint with `minutes` and `max_count` query params

**Main process — fetch + forward history**
- `src/main/python-backend.ts` — Added public `httpGet` method and `getHistory(minutes)` convenience method
- `src/main/ipc-handlers.ts` — Added `getHistory` to `AppContext` interface, registered `HISTORY_GET` handler
- `src/main.ts` — Wired `getHistory` into IPC context; on `onAuthSuccess`, fetches 24h history and pushes via `HISTORY_BACKFILL`

**Renderer — backfill + relative time**
- `src/shared/reading-utils.ts` — Added `parseReadingDateTime()` and `getRelativeTime()` utilities
- `src/shared/preload.d.ts` — Added `getHistory`, `onConnectionStatus`, `onHistoryBackfill` to `DexcomApi` interface
- `src/main/App.tsx` — Subscribed to `onHistoryBackfill`, sorts readings newest-first into history context

**New components**
- `src/components/GlucoseGraph.tsx` — Recharts `LineChart` with threshold reference lines (high/low/criticalLow), color-coded dots per reading range, responsive container, time-range filtering
- `src/components/Sparkline.tsx` — Inline SVG sparkline (~120x30px) showing last 12 readings, color-coded endpoint dot

**History component — collapsed/expanded modal**
- `src/components/History.tsx` — Complete rewrite:
  - **Collapsed state**: bottom bar showing latest reading value + trend arrow (left) and "Updated Xm ago" (right), clickable to expand
  - **Expanded state**: animated modal with time range selector (1h/3h/6h/12h/24h), GlucoseGraph, scrollable list of HistoryListItems
  - Uses `AnimatePresence` + `motion` for enter/exit animations

**Display changes**
- `src/main/Display.tsx` — Added `historyExpanded` state, Sparkline below gauge, changed `History open={true}`, passes `expanded`/`onToggleExpanded` props

**New dependency**
- `recharts` — installed for glucose trend graph

### Verification:
- TypeScript compiles with zero errors (`npx tsc --noEmit` clean)
- Vite config build error is pre-existing and unrelated

## Phase 2: Native OS Notifications ✅

**Status:** Complete

### Changes made:

**New: `src/main/notification-manager.ts`**
- `NotificationManager` class using Electron's `Notification` API
- State machine tracks `currentAlertState: "normal" | "high" | "low" | "criticalLow"`
- Transition-based firing: only fires on state change (no spam for repeated readings in same state)
- Critical low repeat: `setInterval` every 3 minutes re-fires notification until glucose rises above critical low
- Recovering notification: fires when returning to normal from low/criticalLow states
- `silent: true` on all notifications (no sound alerts)
- Respects `notificationsEnabled` setting
- Methods: `evaluate(reading)`, `updateSettings(settings)`, `dispose()`

**`src/main.ts`**
- Instantiate `NotificationManager` with initial settings after storage is created
- Call `notificationManager.evaluate(reading)` in `Python.onReading` callback
- Pass `updateNotificationSettings` into IPC handler context
- Call `notificationManager.dispose()` on `before-quit`

**`src/main/ipc-handlers.ts`**
- Added `updateNotificationSettings` to `AppContext` interface
- Call `ctx.updateNotificationSettings(settings)` in `SETTINGS_SAVE` handler

**`src/components/Settings.tsx`**
- Added "Critical Low" threshold row below existing Low row (left column)
  - ValueBox: range 40–70 mg/dL (step 5), comparison against `lowState` to validate criticalLow < low
  - ValueBoxMMOLL: range 2.0–4.0 mmol/L (step 0.5), comparison against `lowMMOLLState`
- Added "Notifications" toggle (right column, between High and Unit)
  - Custom toggle switch with green active state, On/Off label
  - Follows existing UI patterns (focus-visible outline, cursor-pointer, select-none)
- Updated `saveSettings()` to include `criticalLow`, `criticalLowMMOLL`, `notificationsEnabled`
- Props extended with `criticalLowState`, `criticalLowMMOLLState`, `notificationsEnabledState` + setters

**`src/main/App.tsx`**
- Added form-layer state: `criticalLowState`, `criticalLowMMOLLState`, `notificationsEnabledState`
- Destructured `criticalLowSetting`, `setCriticalLowSetting`, `criticalLowSettingMMOLL`, `setCriticalLowSettingMMOLL`, `notificationsEnabledSetting`, `setNotificationsEnabledSetting` from settings context
- Updated `applySettings()` to include criticalLow and notifications fields (both context + form state)
- Passed new props to `<Settings>` component

### Verification:
- TypeScript compiles with zero errors (`npx tsc --noEmit` clean)

## Phase 3: Rate of Change ✅

**Status:** Complete

### Changes made:

**`src/shared/reading-utils.ts`**
- Added `RateOfChange` interface: `{ value: number, formatted: string, severity: "stable" | "moderate" | "rapid" }`
- Added `calculateRateOfChange(readings, unit)` function
  - Uses last 2 readings, computes time delta via `parseReadingDateTime()`
  - Returns rate in mg/dL/min or mmol/L/min depending on unit
  - Severity thresholds: stable (|rate| < 1 mg/dL/min), moderate (1–2), rapid (>2); mmol/L thresholds divided by 18
  - Returns null for insufficient readings, unavailable values, or invalid timestamps

**New: `src/components/RateOfChange.tsx`**
- Inline component using `useHistoryContext()` and `useSettingsContext()`
- Displays formatted rate with unit label (e.g., "+2.5 mg/dL/min")
- Color-coded by severity: green (stable), yellow (moderate), red (rapid)
- Returns null when rate cannot be computed

**`src/components/History.tsx`**
- Imported and placed `<RateOfChange />` in the collapsed bottom bar, after the trend arrow
- Layout: `[bullet] [value] [trend arrow] [rate of change] ... [Updated Xm ago]`

### Verification:
- TypeScript compiles with zero errors (`npx tsc --noEmit` clean)

## Phase 4: Last Updated Timestamp ✅

**Status:** Complete

### Changes made:

**New: `src/components/LastUpdated.tsx`**
- Receives `dateTime: [string, string]` prop
- Uses `useState` + `useEffect` with `setInterval` (every 10s) to recompute relative time via `getRelativeTime()`
- Displays "Updated just now", "Updated Xs ago", "Updated Xm ago", etc.
- Styled as `text-xs text-dex-text-muted ml-auto`
- Cleans up interval on unmount and resets on dateTime change

**`src/components/History.tsx`**
- Replaced static `useMemo`-based `relativeTime` with live-updating `<LastUpdated />` component
- Removed `useMemo` import and `getRelativeTime` import (no longer needed directly)
- Bottom bar layout: `[bullet] [value] [trend arrow] [rate of change] ... [Updated Xm ago]`

### Verification:
- TypeScript compiles with zero errors (`npx tsc --noEmit` clean)

## Phase 5: WebSocket Connection Status ✅

**Status:** Complete

### Changes made:

**`src/main/python-backend.ts`**
- Added `_connectionStatus: ConnectionStatus` private field (default: `"disconnected"`)
- Added `onConnectionStatusChange` callback property
- Added `connectionStatus` public getter
- Added `setConnectionStatus()` private method (only fires callback on actual change)
- WebSocket `open` event → `"connected"`
- WebSocket `close` event (when reconnecting) → `"reconnecting"`
- `closeWebSocket()` → `"disconnected"`

**`src/main.ts`**
- Set `Python.onConnectionStatusChange` callback to push status to renderer and widget via `PushChannels.CONNECTION_STATUS`

**New: `src/components/ConnectionIndicator.tsx`**
- 6px colored dot: green (connected), yellow (reconnecting), red (disconnected)
- Tooltip on hover showing status label
- Uses `bg-dex-green`/`bg-dex-yellow`/`bg-dex-red` with `rounded-full`

**`src/main/App.tsx`**
- Added `connectionStatus` state (default: `"disconnected"`)
- Subscribed to `onConnectionStatus` push channel in event setup
- Passed `connectionStatus` prop to `<Display>`

**`src/main/Display.tsx`**
- Added `connectionStatus: ConnectionStatus` to `DisplayProps`
- Placed `<ConnectionIndicator>` between Settings and Widget buttons in top bar

### Verification:
- TypeScript compiles with zero errors (`npx tsc --noEmit` clean)

## Phase 6: Smooth Value Transition Animation ✅

**Status:** Complete

### Changes made:

**New: `src/hooks/useAnimatedValue.ts`**
- `useAnimatedValue(target, durationMs = 500)` custom hook
- Uses `requestAnimationFrame` to interpolate from previous value to new target
- Cubic ease-out easing: `1 - (1 - progress)^3`
- Skips animation when value is -1 (unavailable reading)
- Cleans up animation frame on unmount or when target changes

**`src/components/Dexcom.tsx`**
- Imported `useAnimatedValue` hook
- **DexcomG6**: Parses `mg_dl`/`mmol_l` string props to numbers (-1 for `"--"`), passes through `useAnimatedValue()`, displays `Math.round()` for mg/dL or `.toFixed(1)` for mmol/L, shows `"--"` when unavailable
- **DexcomG7**: Same animated value pattern applied identically
- Range detection still uses raw prop values (not animated) so color transitions are immediate

### Verification:
- TypeScript compiles with zero errors (`npx tsc --noEmit` clean)

## Phase 7: Launch at Login ✅

**Status:** Complete

### Changes made:

**`src/main/windows.ts`**
- Added optional `startHidden` parameter (default `false`) to `createMainWindow()`
- `win.show()` is now conditional — skipped when `startHidden` is true (tray-only mode on auto-launch)

**`src/main.ts`**
- On app ready, checks `app.getLoginItemSettings().wasOpenedAsHidden`
- Passes result to `createMainWindow()` so the window stays hidden when launched at login

**`src/main/ipc-handlers.ts`**
- In `SETTINGS_SAVE` handler, reads previous settings before saving
- When `launchAtLogin` changes, calls `app.setLoginItemSettings({ openAtLogin, openAsHidden: true })`

**`src/components/Settings.tsx`**
- Added `launchAtLoginState` and `setLaunchAtLoginState` to `SettingsProps`
- Added `launchAtLogin` to the `saveSettings()` payload
- Added "Launch at Login" toggle in the left column below the Sensor row
- Uses the same toggle switch pattern as Notifications (green active, On/Off label)

**`src/main/App.tsx`**
- Added `launchAtLoginState` form-layer state (default: `false`)
- Destructured `launchAtLoginSetting`/`setLaunchAtLoginSetting` from settings context
- Updated `applySettings()` to sync both context and form state for `launchAtLogin`
- Passed `launchAtLoginState` and `setLaunchAtLoginState` props to `<Settings>`

### Verification:
- TypeScript compiles with zero errors (`npx tsc --noEmit` clean)

## Phase 8: Widget Settings (Size + Opacity) ✅

**Status:** Complete

### Changes made:

**`src/components/Settings.tsx`**
- Added `widgetSizeState`, `widgetOpacityState` + setter props to `SettingsProps`
- Added `widgetSize` and `widgetOpacity` to `saveSettings()` payload
- Added "Widget Size" control in the left column (below Launch at Login) — 3-option `SegmentedButton3` with Small/Medium/Large options mapping to 85px/125px/175px
- Added "Widget Opacity" control in the right column (below Unit) — range slider with min=0.3, max=1.0, step=0.05, percentage display
- New `SegmentedButton3` component supporting 3 options, following same style as existing `SegmentedButton`
- Slider styled with `accent-dex-green` and custom WebKit thumb (green circle with drop shadow)

**`src/widget/Widget.tsx`**
- Destructured `widgetSizeSetting`, `setWidgetSizeSetting`, `widgetOpacitySetting`, `setWidgetOpacitySetting` from settings context
- Updated `applySettings()` to sync `widgetSize` and `widgetOpacity` from pushed settings
- Added `sizeMap` lookup: `{ small: 85, medium: 125, large: 175 }`
- Replaced hardcoded `size-[125px]` class with dynamic `style={{ width: widgetPixelSize, height: widgetPixelSize, opacity: widgetOpacitySetting }}`

**`src/main/App.tsx`**
- Destructured `widgetSizeSetting`, `setWidgetSizeSetting`, `widgetOpacitySetting`, `setWidgetOpacitySetting` from settings context
- Added `widgetSizeState` form-layer state (default: `"medium"`)
- Added `widgetOpacityState` form-layer state (default: `1.0`)
- Updated `applySettings()` to sync both context and form state for `widgetSize` and `widgetOpacity`
- Passed all 4 new props to `<Settings>` component

### Verification:
- TypeScript compiles with zero errors (`npx tsc --noEmit` clean)
