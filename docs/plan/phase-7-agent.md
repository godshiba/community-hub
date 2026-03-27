# Phase 7 — AI Agent System

**Goal:** Autonomous AI agent that can reply to messages, moderate, welcome members, and execute automation rules. Fully optional — invisible when no provider configured.

**Version range:** `v0.7.x`

**Depends on:** Phase 1 (IPC + DB). Independent of platform phases, but needs Phase 2 for live message handling.

---

## Tasks

### Provider Interface
- [ ] `src/main/services/ai/provider.interface.ts` — `AiProvider { complete(system, user): Promise<string> }`
- [ ] `src/main/services/ai/providers/grok.provider.ts` — OpenAI-compatible SDK
- [ ] `src/main/services/ai/providers/claude.provider.ts` — @anthropic-ai/sdk
- [ ] `src/main/services/ai/providers/openai.provider.ts` — openai SDK
- [ ] `src/main/services/ai/providers/gemini.provider.ts` — @google/generative-ai
- [ ] `src/main/services/ai/provider.factory.ts` — creates provider from config
- [ ] All providers normalize to the same interface

### Agent Profile
- [ ] `src/main/services/ai/agent-profile.service.ts`
- [ ] Profile stored in `agent_profile` table: name, tone, knowledge base, response boundaries
- [ ] `AgentProfileEditor.tsx` in Settings panel — edit name, tone, knowledge, boundaries
- [ ] Profile injects into system prompt for every AI call

### Conversation Engine
- [ ] `src/main/services/ai/conversation.engine.ts`
- [ ] Receives incoming messages from platform services
- [ ] Builds context: agent profile + conversation history + automation rules
- [ ] Calls provider for response
- [ ] Confidence scoring: auto-send if high, queue for approval if low
- [ ] Stores actions in `agent_actions` table

### Automation Engine
- [ ] `src/main/services/ai/automation.engine.ts`
- [ ] `AutomationRules.tsx` in Settings — create/edit/delete rules
- [ ] Rule structure: trigger (keyword/event/schedule) → condition → action (reply/moderate/welcome/escalate)
- [ ] `PatternLibrary.tsx` in Settings — reusable response patterns
- [ ] Patterns stored in `agent_patterns` table
- [ ] Rules stored in `agent_automations` table

### Agent Terminal Panel
- [ ] `AgentPanel.tsx` — split layout: action feed (left) + conversation thread (right)
- [ ] `ActionFeed.tsx` — scrolling list of agent actions with type badges (replied/flagged/welcomed/scheduled)
- [ ] `ApprovalQueue.tsx` — pending items needing human approval (approve/edit/reject)
- [ ] `ConversationThread.tsx` — full thread view with user messages + agent responses
- [ ] `AgentControls.tsx` — pause/resume agent, status indicator
- [ ] Action filtering by type, platform, status

### Agent Store & IPC
- [ ] `agent.store.ts` — actions, queue, status, filters
- [ ] IPC channels: `agent:actions`, `agent:approve`, `agent:reject`, `agent:edit`, `agent:pause`, `agent:resume`, `agent:status`

### Optionality Gate
- [ ] All AI components check provider availability
- [ ] Return `null` (not disabled state) when no provider configured
- [ ] Agent Terminal icon hidden in IconBar when no provider
- [ ] Settings AI tab shows "Configure a provider to enable AI features"

## Acceptance Criteria

- Agent responds to messages on Discord and Telegram using configured provider
- Profile (tone, knowledge, boundaries) shapes all responses
- Automation rules trigger correctly on keywords and events
- Low-confidence responses queue for approval
- Agent Terminal shows real-time action feed
- Conversation thread shows full context
- Pause/resume works
- Everything vanishes when no AI provider is set

## Tag

```bash
git tag v0.7.0  # provider interface + all 4 providers
git tag v0.7.1  # agent profile + conversation engine
git tag v0.7.2  # automation engine + pattern library
git tag v0.7.3  # agent terminal panel
```
