# AI Agent System

## Overview

An autonomous agent that runs communities on the user's behalf. It has a persistent identity (profile), can hold conversations (conversation engine), and executes automated actions (automation engine). Fully optional — disabled when no AI provider is configured.

## Providers (4)

| Provider | SDK | Models |
|----------|-----|--------|
| xAI Grok | openai SDK (compatible) | grok-3, grok-3-mini |
| Anthropic Claude | @anthropic-ai/sdk | claude-sonnet, claude-haiku |
| OpenAI | openai SDK | gpt-4o, gpt-4o-mini |
| Google Gemini | @google/generative-ai | gemini-2.5-pro, gemini-2.5-flash |

All providers normalize to one interface:

```typescript
interface AiProvider {
  complete(system: string, user: string): Promise<string>
  isAvailable(): boolean
}
```

## Three Pillars

### 1. Agent Profile

Persistent identity the AI assumes for all interactions:

- **Name & role** — "Community Manager for ProjectX"
- **Tone** — casual / professional / technical, humor level, emoji usage
- **Knowledge base** — project FAQ, rules, links, common Q&A pairs
- **Language** — primary language, multilingual support
- **Boundaries** — what it can/cannot do, escalation conditions

Profile is injected as system prompt context for every AI call.

### 2. Conversation Engine

Context-aware response generation:

- Reads conversation history before responding
- Uses pattern library for consistent responses
- Adapts tone per profile settings
- Escalates to human when boundaries are hit
- Learns from user corrections (stored as pattern refinements)

### 3. Automation Engine

Event-driven rule system:

```typescript
interface AutomationRule {
  trigger: {
    type: 'new_member' | 'keyword' | 'schedule' | 'inactivity' | 'regex'
    conditions: Record<string, unknown>
  }
  action: {
    type: 'reply' | 'dm' | 'post' | 'moderate' | 'escalate'
    payload: Record<string, unknown>
  }
  platform: Platform | null  // null = all
  enabled: boolean
}
```

Examples:
- New member joins Discord → send welcome DM
- Message contains FAQ keyword → auto-reply
- No activity in channel for 24h → post engagement prompt
- Toxic message detected → flag for review + temporary mute

## Agent Terminal Panel

Live feed showing:
- Agent actions in real-time
- Pending items requiring approval
- Active conversation threads
- Override controls: pause, resume, take over

## Database Tables

```sql
CREATE TABLE agent_profile (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  tone TEXT,
  knowledge TEXT,
  boundaries TEXT,
  language TEXT DEFAULT 'en',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_patterns (
  id INTEGER PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  trigger_value TEXT NOT NULL,
  response_template TEXT NOT NULL,
  platform TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  last_used DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_automations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,
  action TEXT NOT NULL,
  platform TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  last_triggered DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_actions (
  id INTEGER PRIMARY KEY,
  action_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  context TEXT,
  input TEXT,
  output TEXT,
  status TEXT DEFAULT 'completed',
  correction TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Settings Panel (AI tab)

- Provider dropdown (Grok / Claude / OpenAI / Gemini / None)
- API key input (encrypted via safeStorage)
- Model selector (options change per provider)
- Temperature slider (0.3 default)
- Custom system prompt textarea
- Per-feature toggles (enable/disable per module)
- Test connection button

## Optional Behavior

```typescript
// Renderer pattern — AI features vanish when unavailable
function AgentFeature({ children }) {
  const isAvailable = useAgentStore(s => s.isAvailable)
  if (!isAvailable) return null
  return children
}
```

No grayed-out states, no "upgrade" prompts. Features simply don't render.

## Service Files

```
src/main/services/ai/
  ├── agent.service.ts          # core agent loop, orchestration
  ├── profile.service.ts        # CRUD for agent profile
  ├── conversation.service.ts   # context-aware response generation
  ├── automation.service.ts     # rule engine, trigger evaluation
  ├── patterns.service.ts       # pattern library management
  ├── providers/
  │   ├── base.provider.ts      # abstract interface
  │   ├── grok.provider.ts
  │   ├── claude.provider.ts
  │   ├── openai.provider.ts
  │   └── gemini.provider.ts
  └── prompts/
      └── system.prompt.ts      # builds system prompt from profile + context
```
