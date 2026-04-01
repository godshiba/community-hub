# Phase 7 — AI Agent System

**Goal:** Autonomous AI agent that can reply to messages, moderate, welcome members, and execute automation rules. Fully optional — invisible when no provider configured.

**Version range:** `v0.7.x`

**Depends on:** Phase 1 (IPC + DB). Independent of platform phases, but needs Phase 2 for live message handling.

---

## Tasks

### 7.0 — Shared Types & Provider Layer (v0.7.0)

#### Agent Types
- [x] `src/shared/agent-types.ts` — `AgentProfile`, `AgentPattern`, `AgentAutomation`, `AgentAction`, `AgentStatus`, filter/payload types
- [x] Update `src/shared/ipc-types.ts` — replace `unknown` stubs with proper types from `agent-types.ts`
- [x] Add missing IPC channels: `agent:getStatus`, `agent:deletePattern`, `agent:deleteAutomation`, `agent:toggleAutomation`, `agent:editAction`, `agent:testProvider`

#### Provider Interface
- [x] `src/main/services/ai/provider.interface.ts` — `AiProvider { complete(system, user): Promise<string>; isAvailable(): boolean }`
- [x] `src/main/services/ai/providers/grok.provider.ts` — OpenAI-compatible SDK (xAI endpoint)
- [x] `src/main/services/ai/providers/claude.provider.ts` — @anthropic-ai/sdk
- [x] `src/main/services/ai/providers/openai.provider.ts` — openai SDK
- [x] `src/main/services/ai/providers/gemini.provider.ts` — @google/generative-ai
- [x] `src/main/services/ai/provider.factory.ts` — creates provider from `AiConfig`
- [x] All providers normalize to the same interface
- [x] Install SDKs: `openai`, `@anthropic-ai/sdk`, `@google/generative-ai`

#### Agent Repository
- [x] `src/main/services/ai/agent.repository.ts` — CRUD for `agent_profile`, `agent_patterns`, `agent_automations`, `agent_actions` tables

### 7.1 — Agent Services (v0.7.1)

#### Agent Profile
- [x] `src/main/services/ai/profile.service.ts` — load/save profile, build system prompt from profile
- [x] Profile injects into system prompt for every AI call (name, tone, knowledge, boundaries)

#### Conversation Engine
- [x] `src/main/services/ai/conversation.engine.ts`
- [x] Receives incoming messages from platform services via event listener
- [x] Builds context: agent profile + conversation history + automation rules
- [x] Calls provider for response
- [x] Confidence scoring: auto-send if high, queue for approval if low
- [x] Stores actions in `agent_actions` table

#### Automation Engine
- [x] `src/main/services/ai/automation.engine.ts`
- [x] Rule structure: trigger (keyword/event/schedule/regex) + condition + action (reply/moderate/welcome/escalate)
- [x] Evaluates rules against incoming messages and events
- [x] Executes matched actions via platform services

#### System Prompt Builder
- [x] `src/main/services/ai/prompts/system.prompt.ts` — builds system prompt from profile + context + patterns

### 7.2 — IPC & Store (v0.7.2)

#### IPC Handlers
- [x] `src/main/ipc/agent.ts` — `registerAgentHandlers()` with all agent IPC channels
- [x] Wire `registerAgentHandlers()` into `src/main/index.ts`
- [x] Hook platform message events into conversation engine

#### Agent Store
- [x] `src/renderer/stores/agent.store.ts` — actions, queue, status, filters, profile, patterns, automations

### 7.3 — Agent Terminal Panel (v0.7.3)

#### Panel Components
- [x] `AgentPanel.tsx` — split layout: action feed (left) + detail view (right)
- [x] `ActionFeed.tsx` — scrolling list of agent actions with type badges (replied/flagged/welcomed/scheduled)
- [x] `ApprovalQueue.tsx` — pending items needing human approval (approve/edit/reject)
- [x] `ConversationThread.tsx` — full thread view with user messages + agent responses
- [x] `AgentControls.tsx` — pause/resume agent, status indicator (running/paused/unavailable)
- [x] Action filtering by type, platform, status

#### Settings Integration
- [x] `AgentProfileEditor.tsx` — edit name, tone, knowledge, boundaries (sub-section in Settings AI tab)
- [x] `AutomationRules.tsx` — create/edit/delete/toggle automation rules
- [x] `PatternLibrary.tsx` — reusable response patterns CRUD

#### Optionality Gate
- [x] All AI components check provider availability via `agent:getStatus`
- [x] Return `null` (not disabled state) when no provider configured
- [x] Agent Terminal icon hidden in IconBar when no provider
- [x] Settings AI tab shows "Configure a provider to enable AI features" when unconfigured

## Acceptance Criteria

- Agent responds to messages on Discord and Telegram using configured provider
- Profile (tone, knowledge, boundaries) shapes all responses
- Automation rules trigger correctly on keywords and events
- Low-confidence responses queue for approval
- Agent Terminal shows real-time action feed
- Conversation thread shows full context
- Pause/resume works
- Delete/toggle operations work for patterns and automations
- Everything vanishes when no AI provider is set
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0

## Tag

```bash
git tag v0.7.0  # types + provider interface + all 4 providers + repository
git tag v0.7.1  # agent services (profile, conversation, automation)
git tag v0.7.2  # IPC handlers + store + platform integration
git tag v0.7.3  # agent terminal panel + settings UI + optionality gate
```
