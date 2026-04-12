# Phase 5b — Agent Brain: Memory, Reasoning & Actions

**Goal:** Replace the current chatbot-with-knowledge-base with a real autonomous agent that remembers users, reasons about intent, takes actions, and learns from every interaction. The agent should feel like a knowledgeable community team member, not a FAQ lookup tool.

**Version range:** `v1.5.1+`

**Depends on:** Phase 5 (knowledge base, channel config, FTS5 infrastructure stays as-is)

---

## What's Wrong With the Current Agent

The current flow is:

```
message → pattern match? → FTS5 search → LLM(system prompt + message) → text reply
```

Problems:

1. **No user memory.** Every message is stateless. The agent doesn't know if it talked to this user yesterday, last week, or ever. It can't say "as we discussed before" because it has no "before."

2. **No intent understanding.** A user asking a question, making a complaint, requesting help, or just chatting all hit the same pipeline. The knowledge base gets queried even for "lol thanks."

3. **No actions.** The agent can only produce text. It can't look up a user's history, assign a role, create a ticket, tag a moderator, or do anything useful besides reply.

4. **No reasoning.** The LLM gets a flat system prompt with knowledge entries stapled on. It doesn't think about what the user needs — it just generates a response to the latest message.

5. **No learning.** The agent doesn't remember what worked. If a user asks the same question twice, the agent generates a fresh response from scratch. It can't track that a user's issue was resolved or still pending.

## Architecture

### New Flow

```
message arrives
  │
  ├─ 1. Load user context (DB: fast, no LLM)
  │     - Who is this? Member since when? Roles? Warnings?
  │     - Past conversations with agent (last N turns)
  │     - Learned facts about this user
  │
  ├─ 2. Classify intent (cheap LLM call, ~50 tokens)
  │     - question | request | complaint | greeting | follow_up | off_topic
  │     - Determines what context to gather and how to respond
  │
  ├─ 3. Assemble context based on intent
  │     - question/follow_up  → search knowledge base, load conversation history
  │     - request             → check what the agent can do, load user permissions
  │     - complaint           → load user's recent history, escalation rules
  │     - greeting            → load user memory for personalized response
  │     - off_topic           → minimal context, brief response
  │
  ├─ 4. Agent reasoning (main LLM call with structured context)
  │     - Full user profile + conversation history + relevant knowledge
  │     - Structured output: { thought, response, actions[], memory_updates[] }
  │     - The LLM THINKS before answering (chain of thought)
  │
  ├─ 5. Execute actions (if any)
  │     - search_knowledge    → query KB and re-call LLM with results
  │     - lookup_member       → fetch member profile/history
  │     - escalate            → create escalation, notify moderator
  │     - assign_role         → trigger role assignment
  │     - create_reminder     → schedule a follow-up
  │     - none                → just respond
  │
  └─ 6. Save memory
        - Store conversation turn (user message + agent response)
        - Store any facts the LLM decided to remember
        - Update user interaction stats
```

### Key Design Decisions

**Structured output, not function calling.** The `AiProvider` interface has `complete(system, user) -> string`. We can't use native tool_use/function_calling since it's provider-dependent. Instead, the reasoning prompt instructs the LLM to respond in a JSON format. The engine parses it and executes actions. If parsing fails, the raw text is used as the response (graceful fallback).

**Two LLM calls per complex message, one for simple.** Intent classification is fast (~50 tokens). For `greeting` or `off_topic`, skip the heavy reasoning call and respond directly. For `question`, `request`, or `complaint`, do the full reasoning chain. Average cost stays low because most messages are simple.

**User memory is structured + freeform.** Structured fields (last_interaction, interaction_count, primary_language, expertise_level) support fast queries. Freeform `facts` field stores LLM-decided observations as JSON array. The agent learns things like "prefers Spanish" or "had billing issue resolved on 2026-04-10."

**Conversation history is per-user, not per-channel.** A user asking about billing in #support and then following up in #general should get continuity. Store by `platform + userId`, not by channel.

---

## Tasks

### 5b.0 — Types & Migration

- [ ] `src/shared/agent-brain-types.ts` — new types for the agent brain
  ```
  UserMemory {
    id, platform, platformUserId, username,
    firstInteraction, lastInteraction, interactionCount,
    primaryLanguage, expertiseLevel,
    facts: string[]           // LLM-decided observations
    conversationSummary       // compressed summary of past interactions
    updatedAt
  }

  ConversationTurn {
    id, platform, platformUserId, channelId,
    userMessage, agentResponse,
    intent, knowledgeEntryIds,
    actions: AgentDecidedAction[],
    createdAt
  }

  IntentType = 'question' | 'request' | 'complaint' | 'greeting' |
               'follow_up' | 'off_topic' | 'feedback'

  IntentClassification {
    intent: IntentType
    confidence: number
    needsKnowledge: boolean      // should we search KB?
    needsUserHistory: boolean    // should we load past interactions?
    isUrgent: boolean            // complaint or frustrated tone?
  }

  AgentDecidedAction {
    type: 'search_knowledge' | 'lookup_member' | 'escalate' |
          'assign_role' | 'create_reminder' | 'tag_moderator' | 'none'
    params: Record<string, unknown>
    result?: string              // filled after execution
  }

  AgentReasoningResult {
    thought: string              // chain of thought (logged, not sent)
    response: string             // what to say to the user
    actions: AgentDecidedAction[]
    memoryUpdates: string[]      // facts to remember about this user
    confidence: number
  }
  ```
- [ ] Add IPC channels for user memory (view/edit in UI):
  ```
  'agent:getUserMemory'         { platform, userId } → UserMemory | null
  'agent:getUserConversations'  { platform, userId, limit } → ConversationTurn[]
  'agent:clearUserMemory'       { platform, userId } → void
  'agent:getRecentConversations' { limit } → ConversationTurn[]
  ```
- [ ] Migration `012_agent_brain.sql`:
  ```sql
  user_memory (
    id, platform, platform_user_id, username,
    first_interaction, last_interaction, interaction_count,
    primary_language, expertise_level,
    facts TEXT DEFAULT '[]',
    conversation_summary TEXT,
    updated_at,
    UNIQUE(platform, platform_user_id)
  )

  conversation_turns (
    id, platform, platform_user_id, channel_id,
    user_message, agent_response,
    intent TEXT,
    knowledge_entry_ids TEXT DEFAULT '[]',
    actions TEXT DEFAULT '[]',
    thought TEXT,
    confidence REAL,
    created_at
  )

  CREATE INDEX idx_conv_turns_user ON conversation_turns(platform, platform_user_id);
  CREATE INDEX idx_conv_turns_time ON conversation_turns(created_at DESC);
  CREATE INDEX idx_user_memory_lookup ON user_memory(platform, platform_user_id);
  ```

### 5b.1 — User Memory Service

- [ ] `src/main/services/ai/user-memory.repository.ts` — CRUD for user memory
  - `getOrCreate(platform, userId, username)` — lazy-create on first interaction
  - `getConversationHistory(platform, userId, limit)` — last N turns
  - `addConversationTurn(...)` — store a full turn with intent, actions, thought
  - `updateFacts(platform, userId, facts)` — update learned observations
  - `updateSummary(platform, userId, summary)` — store compressed conversation summary
  - `incrementInteraction(platform, userId)` — bump count + last_interaction timestamp
  - `getActiveUsers(since, limit)` — users the agent has talked to recently
- [ ] Memory compaction: when conversation history exceeds 50 turns, use LLM to summarize older turns into `conversation_summary` field and delete the raw turns. Keeps DB lean while preserving context.

### 5b.2 — Intent Classifier

- [ ] `src/main/services/ai/intent-classifier.ts` — fast intent classification
  - Single LLM call with concise prompt (< 200 tokens total)
  - Input: user message + last 2 conversation turns (if any)
  - Output: `IntentClassification` (parsed from structured LLM response)
  - Fallback: if parsing fails, default to `question` intent with `needsKnowledge: true`
  - Classification prompt:
    ```
    Classify this community message. Return JSON only.
    Recent context: [last 2 turns if available]
    Message: "{message}"
    → { "intent": "...", "confidence": 0.0-1.0,
         "needsKnowledge": bool, "needsUserHistory": bool, "isUrgent": bool }
    ```
  - Optimization: skip LLM for obvious patterns:
    - Messages < 5 words with greeting words → `greeting` (no LLM call)
    - Messages that are clearly follow-ups ("yes", "ok", "thanks", "what about...") → `follow_up` (no LLM call)
    - Messages ending with `?` → likely `question`

### 5b.3 — Context Assembler

- [ ] `src/main/services/ai/context-assembler.ts` — gathers the right context per intent
  - Input: `ConversationContext` + `IntentClassification` + `UserMemory`
  - Output: `AssembledContext` containing:
    - `userProfile` — structured summary of who this user is
    - `conversationHistory` — relevant past turns (formatted for prompt)
    - `knowledgeContext` — from existing `knowledge.service.ts` (only if `needsKnowledge`)
    - `memberProfile` — from `moderation.repository` if `needsUserHistory`
    - `channelContext` — from existing `channel-config.service.ts`
    - `availableActions` — what the agent can do in this context
  - Context budget: keep total context under ~3000 tokens to leave room for reasoning
  - Smart truncation: summarize long conversation histories, trim knowledge entries
  - `buildContextPrompt(assembled)` — turns AssembledContext into a structured prompt section

### 5b.4 — Agent Reasoning Engine

- [ ] `src/main/services/ai/agent-reasoning.ts` — the core agent loop
  - **Main entry:** `processMessage(ctx, provider)` → `AgentReasoningResult`
  - **Step 1 — Load memory:** `userMemoryRepo.getOrCreate()`
  - **Step 2 — Classify intent:** `intentClassifier.classify()`
  - **Step 3 — Assemble context:** `contextAssembler.assemble()`
  - **Step 4 — Reason:** call LLM with structured reasoning prompt
    ```
    You are {name} assisting a community member.

    == User Profile ==
    {assembled user context}

    == Conversation History ==
    {last N turns}

    == Reference Material ==
    {knowledge entries if any}

    == Available Actions ==
    You can take these actions by including them in your response:
    - search_knowledge: { query } — search for more information
    - lookup_member: {} — get this user's full community profile
    - escalate: { reason } — escalate to a human moderator
    - tag_moderator: { reason } — ping a moderator in channel
    - assign_role: { role } — assign a role to this user
    - create_reminder: { message, hours } — remind yourself to follow up

    == Instructions ==
    Think step by step about what this user needs.
    Respond with JSON:
    {
      "thought": "your reasoning (not shown to user)",
      "response": "your message to the user",
      "actions": [{ "type": "...", "params": {} }],
      "memory_updates": ["fact to remember about this user"],
      "confidence": 0.0-1.0
    }
    ```
  - **Step 5 — Parse:** extract JSON from LLM response. If parsing fails, use the raw text as `response` with empty actions (graceful degradation).
  - **Step 6 — Execute actions:** process each `AgentDecidedAction`:
    - `search_knowledge` → call `retrieveKnowledge()`, re-call LLM with results appended
    - `lookup_member` → call `getMemberByPlatformId()` + `getMemberDetail()`, re-call LLM
    - `escalate` → create escalation entry via `audit.repository`
    - `tag_moderator` → send message in channel tagging moderator role
    - `assign_role` → call `roles.service` to assign
    - `create_reminder` → store in DB for follow-up task to pick up
  - **Step 7 — Save:** store conversation turn + update user memory
  - **Action loop limit:** max 2 action rounds per message to prevent infinite loops

- [ ] `src/main/services/ai/reasoning-prompts.ts` — prompt templates for the reasoning engine
  - `buildReasoningPrompt(profile, assembled)` — main reasoning prompt
  - `buildClassificationPrompt(message, recentTurns)` — intent classification prompt
  - `buildSummaryPrompt(turns)` — conversation compaction prompt
  - Each prompt is a pure function — testable, no side effects

### 5b.5 — Integration: Replace conversation.engine.ts Core

- [ ] Refactor `conversation.engine.ts`:
  - `respondWithLlm()` now delegates to `agent-reasoning.ts` instead of doing its own prompt building
  - Pattern matching stays (it's fast and intentional — admin-configured templates)
  - The engine becomes a thin dispatcher:
    1. Check patterns → if match, return template (no LLM)
    2. Else → call `agentReasoning.processMessage()` → return result
  - Keep the existing `ConversationResult` interface for backward compat with `agent.service.ts` and `index.ts` message handler
- [ ] `agent.service.ts` — pass provider to reasoning engine, no other changes needed
- [ ] `index.ts` message handler — no changes needed (it only sees `ConversationResult`)

### 5b.6 — IPC & Store

- [ ] `src/main/ipc/agent-brain.ts` — `registerAgentBrainHandlers()` — handlers for user memory and conversations
- [ ] Register in `src/main/index.ts`
- [ ] Extend `src/renderer/stores/agent.store.ts` OR create `agent-brain.store.ts`:
  - `fetchUserMemory(platform, userId)` — for the UI to display
  - `fetchUserConversations(platform, userId, limit)` — past conversations
  - `clearUserMemory(platform, userId)` — admin can reset a user's memory
  - `fetchRecentConversations(limit)` — for the conversation feed

### 5b.7 — Conversation Memory UI

- [ ] `src/renderer/panels/agent/ConversationMemory.tsx` — view agent's memory of users
  - Search for a user by name/ID
  - View their learned facts, conversation summary, interaction count
  - View full conversation history with the agent (all turns with intent + actions)
  - Admin can: clear memory, edit facts, view the agent's "thought" for each turn
  - Shows which knowledge entries were used per response
- [ ] `src/renderer/panels/agent/ReasoningInspector.tsx` — debug view for agent reasoning
  - For a selected conversation turn, shows:
    - Intent classification result
    - Assembled context (what the agent knew)
    - Chain of thought (the `thought` field)
    - Actions taken and their results
    - Memory updates saved
  - This is the admin's window into WHY the agent said what it said
- [ ] Add "Memory" tab to `AgentPanel.tsx` (alongside Terminal and Knowledge Base)

### 5b.8 — Conversation Compaction Task

- [ ] `src/main/tasks/memory-compaction.ts` — background task (runs every 6h)
  - For each user with > 50 conversation turns:
    - Take oldest 40 turns
    - Use LLM to summarize them into a paragraph
    - Store summary in `user_memory.conversation_summary`
    - Delete the 40 raw turns
  - Keeps the DB lean while preserving long-term context
  - The summary is injected into the reasoning prompt as "past interaction summary"

---

## What Stays From Phase 5

Everything. This phase builds on top of Phase 5, not replacing it:

- **Knowledge base** — stays as-is. The context assembler calls `retrieveKnowledge()` when the intent classifier says knowledge is needed.
- **Channel configs** — stays as-is. The context assembler loads channel config for personality/scope overrides.
- **FTS5 search** — stays as-is. The agent can now also DECIDE to search (via `search_knowledge` action) rather than always searching.
- **Knowledge UI** — unchanged.
- **Channel config UI** — unchanged.
- **Patterns & automations** — unchanged. Patterns still fire before the reasoning engine.

## What Changes

| Component | Before | After |
|-----------|--------|-------|
| `conversation.engine.ts` | Builds prompt, calls LLM, returns text | Thin dispatcher → delegates to reasoning engine |
| Knowledge search | Runs on EVERY message | Runs only when intent requires it or agent decides to |
| System prompt | Static template + knowledge dump | Dynamic, assembled per-intent with user context |
| Confidence scoring | Keyword-based penalty | LLM self-reports confidence + knowledge grounding |
| User context | None (stateless) | Full per-user memory with learned facts |
| Response quality | Generic one-shot | Reasoned with chain of thought |
| Agent actions | Text only | Can escalate, assign roles, tag mods, search, remind |

## Acceptance Criteria

- Agent remembers past interactions with each user across sessions
- Agent classifies intent before responding (visible in reasoning inspector)
- Agent can take actions (escalate, search, lookup member) — not just reply
- Agent's chain of thought is logged and viewable by admin
- Agent learns facts about users ("prefers Spanish", "is a moderator")
- Greeting a returning user references their history
- Follow-up questions work without repeating context
- Conversation compaction keeps DB under control
- Memory UI lets admins inspect and manage per-user memory
- Reasoning inspector shows full decision trace per turn
- Graceful fallback: if JSON parsing fails, agent still responds with plain text
- Pattern matching still works as before (no regression)
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Two LLM calls per message doubles cost | Intent classifier skips LLM for obvious patterns (greetings, follow-ups). Simple intents get one-shot response. Only complex intents use full reasoning. |
| Structured JSON output fails to parse | Graceful fallback: raw text becomes the response, actions are skipped. Log the failure for debugging. |
| Action loop: agent keeps searching/looking up | Hard limit of 2 action rounds per message. After that, respond with what you have. |
| Memory grows unbounded | Compaction task summarizes old turns. Max 50 raw turns per user. Facts array capped at 20 entries. |
| Provider differences in following JSON instructions | Reasoning prompt uses clear delimiters and simple JSON structure. All providers (GPT-4, Claude, Grok, Gemini) handle this well. Test with each provider. |
| Latency increase from multi-step reasoning | Intent classification is fast (~200ms). Context assembly is DB-only. Main reasoning call is the same cost as before. Total added latency: ~300ms. |

## Tag

```bash
git tag v1.5.1  # agent brain: memory, reasoning, actions
```
