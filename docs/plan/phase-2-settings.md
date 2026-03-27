# Phase 2 — Settings & Platform Connections

**Goal:** Settings panel works. Platform credentials stored securely. Discord and Telegram services connect and return data.

**Version range:** `v0.2.x`

**Depends on:** Phase 1

---

## Tasks

### Settings Panel
- [ ] `SettingsPanel.tsx` — tab layout (Platforms, AI, Agent, Preferences)
- [ ] `CredentialsForm.tsx` — Discord token + Telegram token inputs (masked), save, test connection buttons
- [ ] `AiProviderForm.tsx` — provider selector (Grok/Claude/OpenAI/Gemini), API key, model name, temperature slider
- [ ] `AppPreferences.tsx` — refresh intervals, panel layout persistence toggle
- [ ] IPC channels: `settings:get`, `settings:set`, `settings:test-connection`
- [ ] Credential storage in SQLite `api_credentials` table

### Discord Service
- [ ] `src/main/services/discord.service.ts`
- [ ] Connect with discord.js v14 bot client
- [ ] Methods: `connect()`, `disconnect()`, `getStats()`, `getMembers()`, `sendMessage()`, `testConnection()`
- [ ] Event listeners for member join/leave, message create
- [ ] Error handling + reconnection logic
- [ ] IPC handlers registered

### Telegram Service
- [ ] `src/main/services/telegram.service.ts`
- [ ] Connect with node-telegram-bot-api (polling mode)
- [ ] Methods: `connect()`, `disconnect()`, `getStats()`, `getMembers()`, `sendMessage()`, `sendMedia()`, `testConnection()`
- [ ] Event listeners for new members, messages
- [ ] Error handling + reconnection logic
- [ ] IPC handlers registered

### Platform Aggregator
- [ ] `src/main/services/platform.aggregator.ts`
- [ ] Unified interface over Discord + Telegram
- [ ] `getGlobalStats()`, `getAllMembers()`, `sendToAll()`
- [ ] Parallel calls, graceful fallback if one platform is down
- [ ] Connection status reporting for StatusBar

### Status Bar Integration
- [ ] StatusBar reads connection state from main process
- [ ] Green/red dots for Discord and Telegram
- [ ] Real-time status updates via IPC

## Acceptance Criteria

- Settings panel renders with all forms
- Tokens save to DB and persist across restarts
- "Test Connection" returns success/failure for both platforms
- StatusBar shows green dots when connected
- Platform services emit events that main process receives

## Tag

```bash
git tag v0.2.0  # settings panel + credential storage
git tag v0.2.1  # Discord service
git tag v0.2.2  # Telegram service + aggregator
```
