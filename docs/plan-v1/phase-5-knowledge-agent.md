# Phase 5 — Knowledge Base & Smart Agent

**Goal:** Transform the AI agent from a chat responder into a knowledge-powered assistant. Admins feed it docs, FAQs, and rules; the agent answers member questions accurately from this knowledge base. Per-channel behavior config.

**Version range:** `v1.5.x`

**Depends on:** Phase 4 (AI content moderation layer provides classification infrastructure)

---

## Tasks

### 5.0 — Types & Migration

- [x] `src/shared/knowledge-types.ts` — `KnowledgeEntry`, `KnowledgeCategory`, `ChannelConfig`, `QueryResult`
  - Entry: title, content, category, tags, platform scope, last updated
  - Category: name, description, priority
  - Channel config: channel ID, system prompt override, respond mode, knowledge scope
- [x] Add IPC channels: `knowledge:getEntries`, `knowledge:createEntry`, `knowledge:updateEntry`, `knowledge:deleteEntry`, `knowledge:search`, `knowledge:getChannelConfigs`, `knowledge:updateChannelConfig`
- [x] Migration `010_knowledge_base.sql` — `knowledge_entries`, `knowledge_categories`, `channel_agent_configs` tables

### 5.1 — Knowledge Base Service

- [x] `src/main/services/ai/knowledge.repository.ts` — CRUD for knowledge entries
  - Full-text search using SQLite FTS5 (virtual table for fast text search)
  - Category-based filtering
  - Tag-based filtering
  - Platform-scoped entries (some knowledge only relevant to Discord or Telegram)
- [x] `src/main/services/ai/knowledge.service.ts` — knowledge retrieval for agent
  - Given a user question, find top-N relevant entries (FTS5 ranking + optional AI re-ranking)
  - Build context window: relevant entries + conversation history
  - Inject into agent system prompt as reference material

### 5.2 — Agent Enhancement

- [x] Extend `src/main/services/ai/conversation.engine.ts`
  - Before generating response: query knowledge base for relevant entries
  - Include relevant knowledge in system prompt context
  - Track which entries were used (for analytics)
  - Confidence boost when answer is grounded in knowledge (reduces approval queue)
- [x] Extend `src/main/services/ai/prompts/system.prompt.ts`
  - Add knowledge context section to system prompt
  - Instruct agent to cite knowledge entries when answering
  - "If you don't know, say so" boundary

### 5.3 — Per-Channel Agent Config

- [x] `src/main/services/ai/channel-config.service.ts` — per-channel agent behavior
  - System prompt override per channel (e.g., support channel gets help-focused prompt)
  - Respond mode per channel: always, mentioned, never
  - Knowledge scope per channel: which categories to use
  - Personality override per channel (formal in announcements, casual in general)
- [x] Wire channel config into conversation engine (lookup config before processing message)

### 5.4 — IPC & Store

- [x] `src/main/ipc/knowledge.ts` — `registerKnowledgeHandlers()`
- [x] Register in `src/main/index.ts`
- [x] `src/renderer/stores/knowledge.store.ts` — entries, categories, channel configs, search results

### 5.5 — Knowledge Base UI

- [x] `src/renderer/panels/agent/KnowledgeBasePanel.tsx` — manage knowledge entries
  - Entry list with search and category filter
  - Create/edit entry form: title, content (rich text via TipTap), category, tags, platform scope
  - Bulk import from markdown files or text
  - Entry usage stats (how often cited by agent)
- [x] Add "Knowledge Base" tab/view to `AgentPanel.tsx`

### 5.6 — Channel Config UI

- [x] `src/renderer/panels/settings/ChannelAgentConfig.tsx` — per-channel agent settings
  - List of channels from connected platforms
  - Per-channel: respond mode, system prompt override, knowledge categories
  - Preview: test agent response with channel config applied
- [x] Add to Settings AI tab

## Acceptance Criteria

- Knowledge entries are searchable with FTS5 full-text search
- Agent references knowledge base when answering questions
- Answers grounded in knowledge are more confident (fewer approval prompts)
- Per-channel config changes agent behavior (prompt, respond mode, knowledge scope)
- Knowledge base UI supports CRUD, search, import, and usage stats
- Channel config UI shows real platform channels
- Agent says "I don't know" when question is outside knowledge base
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0

## Tag

```bash
git tag v1.5.0  # knowledge base + per-channel agent config
```
