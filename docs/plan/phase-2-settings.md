# Phase 2 — Settings & Platform Connections

**Goal:** Settings panel works. Platform credentials stored securely. Discord and Telegram services connect and return data.

**Version range:** `v0.2.x`

**Depends on:** Phase 1

---

## Tasks

### Settings Panel
- [x] `SettingsPanel.tsx` — tab layout (Platforms, AI, Preferences)
- [x] `CredentialsForm.tsx` — Discord token + Telegram token inputs (masked), save, test connection buttons
- [x] `AiProviderForm.tsx` — provider selector (Grok/Claude/OpenAI/Gemini), API key, model name, temperature slider
- [x] `AppPreferencesForm.tsx` — refresh intervals, panel layout persistence toggle
- [x] IPC channels: `settings:saveCredentials`, `settings:loadCredentials`, `settings:testConnection`, `settings:saveAiConfig`, `settings:loadAiConfig`, `settings:savePreferences`, `settings:loadPreferences`, `settings:getPlatformStatus`, `settings:connectPlatform`, `settings:disconnectPlatform`
- [x] Credential storage in SQLite `api_credentials` table via `credentials.repository.ts`

### Discord Service
- [x] `src/main/services/discord.service.ts`
- [x] Connect with discord.js v14 bot client
- [x] Methods: `connect()`, `disconnect()`, `getStats()`, `testConnection()`
- [x] Event listener for connection errors
- [x] Error handling + status tracking
- [x] IPC handlers registered via platform-manager

### Telegram Service
- [x] `src/main/services/telegram.service.ts`
- [x] Connect with node-telegram-bot-api (polling mode)
- [x] Methods: `connect()`, `disconnect()`, `getStats()`, `testConnection()`
- [x] Event listener for polling errors
- [x] Error handling + status tracking
- [x] IPC handlers registered via platform-manager

### Platform Manager
- [x] `src/main/services/platform-manager.ts`
- [x] Unified interface over Discord + Telegram
- [x] `connect()`, `disconnect()`, `testConnection()`, `getStatus()`, `disconnectAll()`
- [x] Reads credentials from repository, delegates to platform services
- [x] Connection status reporting for StatusBar

### Status Bar Integration
- [x] `connection.store.ts` — Zustand store polling platform status
- [x] StatusBar reads connection state from main process via IPC
- [x] Green/yellow/red dots for Discord and Telegram based on ConnectionStatus
- [x] Polls every 5 seconds for live updates

## Acceptance Criteria

- [x] Settings panel renders with all 3 tabs (Platforms, AI, Preferences)
- [x] Tokens save to DB and persist across restarts
- [x] "Test Connection" returns success/failure for both platforms
- [x] StatusBar shows colored dots based on connection state
- [x] Platform services connect/disconnect via IPC
- [x] AI provider config saves to app_settings table
- [x] App preferences save to app_settings table

## Tag

```bash
git tag v0.2.0  # settings panel + credentials + platform services
```
