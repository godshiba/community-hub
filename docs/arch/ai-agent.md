# AI Agent System

Provider-agnostic AI with conversation engine, automation rules, and action logging.

## Files

### Provider Layer

| File | Purpose | Depends on |
|------|---------|------------|
| `src/main/services/ai/provider.interface.ts` | `AiProvider` interface: `complete(system, user) -> string`, `isAvailable()` | -- |
| `src/main/services/ai/provider.factory.ts` | `createProvider(config)` — returns correct provider or null | All provider files |
| `src/main/services/ai/providers/grok.provider.ts` | Grok API via OpenAI-compatible SDK | provider.interface |
| `src/main/services/ai/providers/claude.provider.ts` | Anthropic Claude API | provider.interface |
| `src/main/services/ai/providers/openai.provider.ts` | OpenAI API | provider.interface |
| `src/main/services/ai/providers/gemini.provider.ts` | Google Gemini API | provider.interface |

### Engine Layer

| File | Purpose | Depends on |
|------|---------|------------|
| `src/main/services/ai/agent.service.ts` | Singleton orchestrator — init, configure, pause/resume, handle messages/new members, delegates to engines | conversation.engine, automation.engine, provider.factory, agent.repository, profile.service |
| `src/main/services/ai/conversation.engine.ts` | Message evaluation, AI response generation, confidence scoring, context building | provider.interface, agent.repository, system.prompt |
| `src/main/services/ai/automation.engine.ts` | Rule matching engine — trigger patterns, actions, cooldowns | agent.repository |
| `src/main/services/ai/profile.service.ts` | Default profile creation, `getOrCreateDefault()` | agent.repository |
| `src/main/services/ai/prompts/system.prompt.ts` | Builds system prompt string from agent profile data | agent-types |

### Knowledge & Channel Config Layer

| File | Purpose | Depends on |
|------|---------|------------|
| `src/main/services/ai/knowledge.repository.ts` | Knowledge entries, categories, channel configs CRUD + FTS5 search | database.service |
| `src/main/services/ai/knowledge.service.ts` | Knowledge retrieval for agent — FTS5 search, context building, confidence boost | knowledge.repository |
| `src/main/services/ai/channel-config.service.ts` | Per-channel agent config cache — respond mode, knowledge scope, personality overrides | knowledge.repository |

### Data Layer

| File | Purpose | Tables used |
|------|---------|-------------|
| `src/main/services/ai/agent.repository.ts` | Agent DB operations — profile, patterns, automations, actions CRUD | `agent_profile`, `agent_patterns`, `agent_automations`, `agent_actions` |

### IPC

| File | Purpose |
|------|---------|
| `src/main/ipc/agent.ts` | 16 handlers: status, actions, approve/reject/edit, pause/resume, profile CRUD, patterns CRUD, automations CRUD, test provider |
| `src/main/ipc/knowledge.ts` | 15 handlers: knowledge entries CRUD, search, import, categories CRUD, channel configs CRUD |

### Renderer — Agent Panel

| File | Purpose | Depends on |
|------|---------|------------|
| `src/renderer/stores/agent.store.ts` | Zustand store — status, actions, profile, patterns, automations | agent-types, ipc-types |
| `src/renderer/panels/agent/AgentPanel.tsx` | Root panel — controls + action feed/approval split view | agent.store |
| `src/renderer/panels/agent/AgentControls.tsx` | Run/pause/status display, provider info | agent.store |
| `src/renderer/panels/agent/ActionFeed.tsx` | Chronological agent action log | agent.store |
| `src/renderer/panels/agent/ActionFilters.tsx` | Filter actions by type/status/date | agent.store |
| `src/renderer/panels/agent/ApprovalQueue.tsx` | Pending actions needing user approval | agent.store |
| `src/renderer/panels/agent/ConversationThread.tsx` | Message thread visualization | agent.store |

### Renderer — Knowledge Base (in Agent panel)

| File | Purpose | Depends on |
|------|---------|------------|
| `src/renderer/stores/knowledge.store.ts` | Zustand store — entries, categories, search, channel configs | knowledge-types, ipc-types |
| `src/renderer/panels/agent/KnowledgeBasePanel.tsx` | Knowledge entry list, search, category filter, bulk import | knowledge.store |
| `src/renderer/panels/agent/KnowledgeEntryForm.tsx` | Create/edit knowledge entry form | knowledge-types |
| `src/renderer/panels/agent/KnowledgeCategoryManager.tsx` | Category sidebar — CRUD + selection filter | knowledge-types |

### Renderer — Agent Settings (in Settings panel)

| File | Purpose | Depends on |
|------|---------|------------|
| `src/renderer/panels/settings/AiProviderForm.tsx` | AI provider selection + API key + model config | settings-types |
| `src/renderer/panels/settings/AgentProfileEditor.tsx` | Agent name, tone, role, knowledge, boundaries | agent.store |
| `src/renderer/panels/settings/PatternLibrary.tsx` | Response pattern templates CRUD | agent.store |
| `src/renderer/panels/settings/AutomationRules.tsx` | Automation rule CRUD (triggers + actions) | agent.store |
| `src/renderer/panels/settings/ChannelAgentConfig.tsx` | Per-channel agent behavior — respond mode, prompt overrides, knowledge scope | knowledge.store |

## Message Flow

```
Platform message arrives
  -> platform-manager.ts onMessage()
  -> index.ts callback
  -> agent.service.ts handleMessage()
     -> conversation.engine.ts evaluate() -> AI provider -> response
     -> automation.engine.ts match() -> rule actions
  -> agent.repository.ts logAction()
  -> platform service sendMessage() (if auto-approved)
```

## Change Map

| Operation | Files to touch |
|-----------|---------------|
| Add new AI provider | New `providers/<name>.provider.ts` + add case to `provider.factory.ts` + update `settings-types.ts` |
| Add new automation trigger type | `automation.engine.ts` + `agent-types.ts` + `AutomationRules.tsx` |
| Add new action type | `agent-types.ts` + `agent.repository.ts` + `ActionFeed.tsx` |
| Change conversation logic | `conversation.engine.ts` + possibly `system.prompt.ts` |
| Add agent setting | `agent-types.ts` + `agent.repository.ts` + `AgentProfileEditor.tsx` |
| New agent panel sub-view | New `src/renderer/panels/agent/<Name>.tsx` + import in `AgentPanel.tsx` |
| Add knowledge entry | `knowledge.repository.ts` + `knowledge-types.ts` + `KnowledgeBasePanel.tsx` |
| Change channel config | `channel-config.service.ts` + `knowledge.repository.ts` + `ChannelAgentConfig.tsx` |
