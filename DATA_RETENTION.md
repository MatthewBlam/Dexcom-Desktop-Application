# Data Retention Policy

## Glucose Readings

All glucose readings are stored **in-memory only** during the current application session.

- The app retains up to **300 most recent readings** in memory.
- On login, up to 24 hours of historical readings are fetched from Dexcom's servers.
- When the app is quit, all readings are discarded.
- The single most recent reading is persisted to `config.json` for tray display on next launch, but is overwritten as soon as new data arrives.

## Credentials

- Dexcom account credentials are encrypted using the operating system's keychain (`safeStorage`) and stored in `config.json`.
- Credentials are never stored in plaintext.

## Settings & Preferences

- User settings (unit, sensor type, thresholds, launch-at-login) are persisted to `config.json`.
- Widget position, window bounds, and history layout preferences are also persisted.
- The config file has owner-only permissions (`0600`).

## Logs

- Application logs are written to `~/Library/Application Support/dexcom/logs/main.log`.
- Logs rotate automatically at 1 MB.
- Logs contain operational events (startup, connection status, errors) but never contain credentials or glucose values.

## No Server-Side Storage

This application does not operate its own server. All data is fetched directly from Dexcom's Share API via the `pydexcom` library. No user data is transmitted to any third party.
