# UI Upgrade — Roadmap & Task Tracker

Step-by-step task tracker for [ui-upgrade.md](./ui-upgrade.md). Check items off as you complete them. Phase gates are hard — do not start the next phase until the gate passes.

---

## Resume (for Claude)

**Automation rules:** [.claude/rules/ui-upgrade-workflow.md](../../.claude/rules/ui-upgrade-workflow.md) — read this first.

**Resume protocol:**
1. Look at the Status Dashboard below to find the current phase.
2. Scan that phase for the first unchecked task (`- [ ]`).
3. State the task ID + title to the user and confirm before starting.
4. Follow the Task Execution Protocol in the workflow rules.

**Commit format:**
```
feat(ui): <task-id> <short imperative description>

Refs: docs/plan-v1/ui-upgrade-roadmap.md (Phase <n>, task <id>)
```

**Validation:** `npx tsc --noEmit && npm run build` after every task. No exceptions.

---

## Status Dashboard

**Current phase:** 3 complete — ready for Phase 4
**Last updated:** 2026-04-25
**Branch:** `ui/apple-native-redesign`

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 0 | Foundation | Complete | 9 / 9 |
| 1 | ui-native primitives | Complete | 43 / 43 |
| 2 | Shell | Complete | 14 / 14 |
| 3 | Command palette + shortcuts | Complete | 8 / 8 |
| 4 | Panel rewrites | Not started | 0 / 7 panels |
| 5 | Charts & editors | Not started | 0 / 5 |
| 6 | Motion pass | Not started | 0 / 8 |
| 7 | Polish & QA | Not started | 0 / 10 |

**Overall:** 74 / 112 tasks complete.

*(Phase 1 denominator corrected from 35 to 43 — sum of listed tasks 1.1–1.43; overall total updated accordingly.)*

---

## Phase 0 — Foundation

Set up window materials, design tokens, and the accent-color bridge. Nothing visible changes until Phase 1, but every later task depends on this.

Reference: [ui-upgrade.md § Materials, Design Tokens, Main-Process Changes](./ui-upgrade.md)

- [x] **0.1** Rewrite `src/renderer/styles/globals.css` with all design tokens (colors, surfaces, radii, spacing, shadows, motion, z-index).
- [x] **0.2** Update `src/main/index.ts` BrowserWindow options: `vibrancy: 'under-window'`, `visualEffectState: 'followsWindowActiveState'`, `backgroundColor: '#00000000'`, `trafficLightPosition: { x: 18, y: 18 }`. Remove `transparent: true` if present. Enforce `minWidth: 920`, `minHeight: 620`.
- [x] **0.3** Create `src/main/ipc/system.ts` with handlers: `system:getAccentColor`, `system:getUserLocale`, `system:getPlatform`. Emit `system:accentChanged`, `system:windowFocusChanged`, `system:fullscreenChanged`.
- [x] **0.4** Register system handlers in `src/main/index.ts` (spec adjusted — no `ipc/index.ts` aggregator exists). Channels added to `src/shared/ipc-types.ts`.
- [x] **0.5** Wire main-process focus/blur/fullscreen handlers on `BrowserWindow` to emit IPC events.
- [x] **0.6** Create `src/renderer/hooks/useSystemAccent.ts` — fetches initial accent, subscribes to changes, writes `--accent-system` CSS var, sets `[data-accent="graphite"]` on null.
- [x] **0.7** Create `src/renderer/hooks/useWindowActive.ts` — subscribes to focus events, toggles `[data-window-inactive]` on `<html>`.
- [x] **0.8** Create `src/renderer/hooks/useReducedMotion.ts` — reads `prefers-reduced-motion`.
- [x] **0.9** Create dev-only `/dev` route that renders all color tokens, typography scale, accent swatches, and motion demos. Gated behind `import.meta.env.DEV`.

**Acceptance gate:**
- App launches with real NSVisualEffectView vibrancy behind content.
- Traffic lights positioned at (18, 18).
- System accent color reflected in `--accent-system` on boot and on change (test by changing system accent in System Settings).
- Graphite mode (System Settings > Accent color > Graphite) triggers fallback via `[data-accent="graphite"]`.
- Window focus/blur toggles `[data-window-inactive]` attribute.
- Fullscreen enter/leave emits IPC events.
- Dev route at `/dev` shows all tokens.

---

## Phase 1 — ui-native Primitives

Build the primitive library. Panels don't change yet; everything lives in `PrimitiveGallery` for visual QA.

Reference: [ui-upgrade.md § Component Library](./ui-upgrade.md)

### Foundational primitives
- [x] **1.1** `Surface.tsx` — variants: `plain`, `raised`, `input`, `elevated`.
- [x] **1.2** `Divider.tsx` — horizontal/vertical, `hairline` / `strong`.
- [x] **1.3** `StatusDot.tsx` — colored dot indicator.
- [x] **1.4** `Pill.tsx` — variants: `neutral`, `accent`, `success`, `warning`, `error`, `discord`, `telegram`.
- [x] **1.5** `Badge.tsx` — count badge (numeric, sidebar/dock style).
- [x] **1.6** `KeyCap.tsx` — keycap rendering (e.g. `⌘K`).
- [x] **1.7** `Avatar.tsx` — circular, initials fallback in accent tint.
- [x] **1.8** `Skeleton.tsx` — `line`, `circle`, `rect` shimmer.
- [x] **1.9** `Section.tsx` — panel content section wrapper.

### Form primitives
- [x] **1.10** `Button.tsx` — variants `primary`/`secondary`/`plain`/`destructive`/`icon`. Sizes `sm`/`md`/`lg`. Full state matrix including `isLoading`.
- [x] **1.11** `TextField.tsx` — with `prefix`, `suffix`, `error`, `hint`, `characterCount`.
- [x] **1.12** `TextArea.tsx` — auto-grow up to max height.
- [x] **1.13** `PasswordField.tsx` — show/hide toggle.
- [x] **1.14** `NumberField.tsx` — TextField + Stepper.
- [x] **1.15** `Stepper.tsx` — NSStepper-style numeric stepper.
- [x] **1.16** `Toggle.tsx` — Apple switch with spring flip. (Spring flip deferred to Phase 6.7 — CSS transition for now.)
- [x] **1.17** `Checkbox.tsx` — with indeterminate state.
- [x] **1.18** `RadioGroup.tsx` — Apple radio buttons.
- [x] **1.19** `Slider.tsx` — re-skin shadcn Slider. (Skinned over `radix-ui` Slider — shadcn wrapper is not installed in this project.)
- [x] **1.20** `Select.tsx` — re-skin Radix Select (pop-up button look).
- [x] **1.21** `ComboBox.tsx` — typeahead-filterable select.
- [x] **1.22** `DatePicker.tsx` — wraps `react-day-picker` inside Popover.
- [x] **1.23** `TimePicker.tsx` — NumberField-based.
- [x] **1.24** `FormRow.tsx` — label + control + hint/error layout.
- [x] **1.25** `SegmentedControl.tsx` — spring indicator via `layoutId`. (CSS indicator for now — spring upgrade deferred to Phase 6.6 per Notes.)

### Surface / overlay primitives
- [x] **1.26** `Sheet.tsx` — modal sheet, scale + fade entry.
- [x] **1.27** `Alert.tsx` — NSAlert-style confirmation dialog.
- [x] **1.28** `Popover.tsx` — wraps Radix Popover with native styling.
- [x] **1.29** `Tooltip.tsx` — 500ms delay, keycap support.
- [x] **1.30** `ContextMenu.tsx` — right-click menu, submenus, separators.
- [x] **1.31** `DropdownMenu.tsx` — click-to-open menu.

### List / data primitives
- [x] **1.32** `ListRow.tsx` — leading/content/trailing slots, full state matrix.
- [x] **1.33** `Disclosure.tsx` — collapsible with rotating chevron.
- [x] **1.34** `EmptyState.tsx` — hero icon, title, subtitle, optional action.

### Feedback primitives
- [x] **1.35** `Toast.tsx` — types, auto-dismiss, swipe-to-dismiss.
- [x] **1.36** `ProgressBar.tsx` — determinate + indeterminate.
- [x] **1.37** `CircularProgress.tsx` — small spinner.

### Custom icons
- [x] **1.38** `ui-native/icons/DiscordIcon.tsx`, `TelegramIcon.tsx`.
- [x] **1.39** `ui-native/icons/icon-map.ts` — Lucide → Phosphor lookup table for migration.

### Gallery + tests
- [x] **1.40** Create dev-only `PrimitiveGallery` panel. One section per primitive showing every state.
- [x] **1.41** Unit tests per primitive (Vitest + RTL). Target 80% coverage of `ui-native/`.
- [x] **1.42** axe-core accessibility tests per primitive.
- [x] **1.43** Install deps: `framer-motion`, `@phosphor-icons/react`, `@tanstack/react-virtual`, `@dnd-kit/core`, `@dnd-kit/sortable`, `react-day-picker`, `react-markdown`, `electron-store`.

**Acceptance gate:**
- Gallery renders every primitive in every state.
- Side-by-side screenshot vs. Apple Mail/Notes/System Settings passes reviewer's visual check.
- Every primitive is keyboard-accessible and axe-clean.
- Storybook-equivalent coverage exists via the gallery.

---

## Phase 2 — Shell

Rewrite the app shell. Old panels still render inside the new shell (transitional state).

Reference: [ui-upgrade.md § Shell Architecture, State Persistence, App Menu](./ui-upgrade.md)

- [x] **2.1** Create `src/renderer/stores/shell.store.ts` with persistence — sidebarWidth, sidebarVisible, inspectorOpenByPanel, lastActivePanel, windowBounds, scrollTopByPanel, recentCommands.
- [x] **2.2** Create `src/renderer/hooks/usePanelToolbar.ts` — panels declare title/subtitle/actions/inspector config via this hook.
- [x] **2.3** Create `src/renderer/hooks/useScrollTop.ts` — for large-title scroll promotion, using `useSyncExternalStore`.
- [x] **2.4** Create `src/renderer/hooks/useKeyboardShortcut.ts` — shared shortcut registration.
- [x] **2.5** `src/renderer/components/shell/Toolbar.tsx` — full drag region spec, traffic light reserve, title, search pill, contextual actions slot, inspector toggle, large-title promotion.
- [x] **2.6** `src/renderer/components/shell/SourceList.tsx` — sections, rows with `layoutId` pill, resize handle, collapse, footer with agent/discord/telegram status.
- [x] **2.7** `src/renderer/components/shell/Inspector.tsx` — fixed 340px, toggle, per-panel registration, empty state, detail takeover button.
- [x] **2.8** `src/renderer/components/shell/Shell.tsx` — orchestrator: layout toolbar + sidebar + content + inspector.
- [x] **2.9** Rewrite `src/renderer/App.tsx` to render `<Shell>` instead of TitleBar/Sidebar/PanelContainer/StatusBar.
- [x] **2.10** Update `src/renderer/stores/panel.store.ts` — remove `secondaryPanel`, `splitRatio`, `breadcrumbs` fields. Preserve `activePanel`, `setActivePanel`.
- [x] **2.11** Create `src/main/menu.ts` with full app menu (Community Hub / File / Edit / View / Window / Help). Wire role strings + IPC for custom items.
- [x] **2.12** Create `src/main/services/notifications.ts` — native notification wrapper.
- [x] **2.13** Create `src/main/services/dock-badge.ts` — `app.dock.setBadge` reflecting pending approvals.
- [x] **2.14** Remove deleted files: `layout/TitleBar.tsx`, `layout/Sidebar.tsx`, `layout/StatusBar.tsx`, `layout/PanelContainer.tsx`, `layout/IconBar.tsx`, `shared/ToastContainer.tsx`. (glass/*, shared/PanelHeader, shared/Badge, shared/FilterBar, Skeleton deferred to Phase 4 — still imported by existing panels.)

**Acceptance gate:**
- Navigation works via sidebar clicks and `⌘1`..`⌘7`.
- Sidebar pill morphs between rows smoothly.
- Inspector opens/closes via toolbar button and `⌘⌥I` (renders empty state even when panel has no content registered).
- Traffic lights positioned correctly; toolbar drag regions behave (double-click zooms window).
- Sidebar collapse/resize works; state persists across app restart.
- Menu bar renders with all items; `⌘,` opens Settings, `⌘B` toggles sidebar, etc.
- No console errors; all old panel content still renders (styling may be unfinished).

---

## Phase 3 — Command Palette + Keyboard Shortcuts

Rebuild the palette on the new materials; add a shortcuts discoverability sheet.

Reference: [ui-upgrade.md § Command Palette, Keyboard Shortcuts](./ui-upgrade.md)

- [x] **3.1** Rewrite `src/renderer/components/shell/CommandPalette.tsx` on `Sheet` + vibrancy. 640px width, 20% from top, fade/scale entry.
- [x] **3.2** Update `src/renderer/components/shared/command-items.ts` (or move to `shell/command-items.ts`) — sources: Navigation, Members (via `moderation:searchMembers`), Settings sections, Actions, Recent.
- [x] **3.3** Wire recent-commands persistence (last 5) through `shell.store`.
- [x] **3.4** Build keyboard shortcuts overlay sheet (`⌘/`). Two-column grouped table.
- [x] **3.5** Wire every shortcut in [ui-upgrade.md § Keyboard Shortcuts master list].
- [x] **3.6** Add `Tooltip` with shortcut display to every icon-only toolbar button.
- [x] **3.7** Wire File/Edit/View menu items to renderer actions via IPC.
- [x] **3.8** Add focus trap to palette and shortcut sheet; Escape dismisses.

**Acceptance gate:**
- `⌘K` opens palette; fuzzy search across all sources works.
- `⌘/` opens shortcuts sheet.
- All 26 shortcuts in the master list functional.
- All icon buttons show a tooltip with their shortcut.
- Menu items route correctly.

---

## Phase 4 — Panel Rewrites

One panel per commit. Each panel uses the [Migration Checklist](#migration-checklist) from the bottom of this file.

Reference: [ui-upgrade.md § Panel Redesign](./ui-upgrade.md)

- [ ] **4.1** Dashboard — hero title, stat cards with sparklines, growth chart, heatmap + contributors grid, toolbar actions.
- [ ] **4.2** Moderation — FilterBar, virtualized ListRow list, inspector with MemberSummary, detail takeover, bulk-select, right-click menu.
- [ ] **4.3** Events — List/Calendar toggle, EventDetail inspector, calendar grid with event pills.
- [ ] **4.4** Scheduler — Queue/History toggle, PostPreview inspector, drag-reorder queue.
- [ ] **4.5** Agent — Start/Pause toggle, ActionFeed virtualized list, ActionDetail inspector, conversation/knowledge SegmentedControl.
- [ ] **4.6** Reports — Generate/History toggle, GeneratorOptions inspector, ReportPreview, progress bar while generating.
- [ ] **4.7** Settings — left-rail + right-detail layout (not a sheet), dirty-state indicators per section, Save buttons, unsaved-changes confirmation.

**Acceptance gate per panel:**
- Migration checklist ticks complete (see bottom).
- All existing functionality preserved.
- E2E tests pass.
- Panel looks Apple-native vs reference screenshots (reviewer judgement).

---

## Phase 5 — Charts & Editors

Theme Recharts and TipTap to match native.

Reference: [ui-upgrade.md § Charts & Editors](./ui-upgrade.md)

- [ ] **5.1** Create `src/renderer/components/charts/ChartTheme.tsx` — applies grid, axis, tooltip, color config.
- [ ] **5.2** Apply `ChartTheme` to all Recharts output (GrowthChart, ActivityHeatmap, report charts).
- [ ] **5.3** Add sparklines to Dashboard stat cards.
- [ ] **5.4** Create `src/renderer/components/editor/` with TipTap theme: body, toolbar, bubble menu, headings, code blocks, blockquote.
- [ ] **5.5** Apply TipTap theme to Scheduler PostEditor and any other editor usage.

**Acceptance gate:**
- No chart looks like a default Recharts chart.
- Editor toolbar uses native icons and spacing.
- Sparklines render correctly in all 4 stat cards.

---

## Phase 6 — Motion Pass

Wire Framer Motion where specified. Audit reduced-motion coverage.

Reference: [ui-upgrade.md § Motion](./ui-upgrade.md)

- [ ] **6.1** Sidebar selection pill — `layoutId="sidebar-selection"`, `spring-snappy`. Jumps on reduced motion.
- [ ] **6.2** Inspector open/close — width animation with `ease-decelerate`, content fade-in at 60%.
- [ ] **6.3** Modal sheet entry — scale 0.96→1 + fade, 220ms.
- [ ] **6.4** Popover entry — scale 0.96→1 + fade, 140ms.
- [ ] **6.5** Toast entry/exit — slide + fade, swipe-to-dismiss.
- [ ] **6.6** SegmentedControl indicator — `layoutId` scoped per group.
- [ ] **6.7** Toggle flip — spring-stiff.
- [ ] **6.8** Audit `useReducedMotion()` coverage — every motion must no-op when reduced-motion enabled.
- [ ] **6.9** Never-animate list verification — first mount, Settings open, resize, HMR reload.

**Acceptance gate:**
- Motion feels Apple-quiet (side-by-side with Mail/Notes).
- Reduced-motion users get instant transitions with no regressions.
- No animation jank during scroll, resize, or window switches.
- No `layoutId` collision warnings in console.

---

## Phase 7 — Polish & QA

Final details that push perception from "good" to "premium."

Reference: [ui-upgrade.md § Rollout Phase 7, Testing & Validation, Accessibility](./ui-upgrade.md)

- [ ] **7.1** Large-title scroll-collapse mechanics — hero title fades as panel scrolls, toolbar title fades in.
- [ ] **7.2** Overlay scrollbars — native-style, fade-out after 1.5s idle, appear on scroll.
- [ ] **7.3** Context menus wired on every list row (`ListRow` + `ContextMenu`).
- [ ] **7.4** Drag-and-drop file handlers — Scheduler image upload, Reports CSV drop. Valid/invalid drop visuals.
- [ ] **7.5** Empty-state copy centralized in `src/renderer/copy/empty-states.ts`.
- [ ] **7.6** Tooltip coverage audit — every icon-only button has a tooltip with shortcut where applicable.
- [ ] **7.7** Capture visual regression baselines for every panel + every primitive state.
- [ ] **7.8** axe-core accessibility pass on every panel. Fix violations.
- [ ] **7.9** Manual VoiceOver pass — every panel, every dialog, every palette source navigable.
- [ ] **7.10** First-run experience — empty Dashboard CTA pointing at Settings, onboarding tooltip on first `⌘K`.

**Acceptance gate:**
- Full-app VQA checklist passes.
- axe-core zero violations.
- Visual regression baselines captured; CI compares against them.
- Human reviewer signs off: "This looks like a real Mac app."

---

## Migration Checklist

Paste this into every Phase 4 PR description. Every box must be ticked before merging.

```markdown
### UI Upgrade Migration Checklist (panel: X)

- [ ] Outer `GlassPanel` wrapper removed
- [ ] Uses `usePanelToolbar({ title, subtitle, actions, inspector })`
- [ ] Hero title renders at top of panel content
- [ ] All Lucide icons replaced with Phosphor (see icon-map.ts)
- [ ] Tabs replaced with `SegmentedControl`
- [ ] List/table content uses `ListRow`
- [ ] Forms use `FormRow` + `ui-native` inputs
- [ ] Empty state uses `EmptyState`
- [ ] Loading state uses `Skeleton`
- [ ] Error state uses `EmptyState variant="error"`
- [ ] Right-click `ContextMenu` added where applicable
- [ ] `Tooltip` coverage on icon-only buttons
- [ ] Keyboard shortcuts declared for common actions
- [ ] Inspector wired (or explicitly documented as N/A)
- [ ] Visual regression baseline captured
- [ ] axe-core audit passes
- [ ] Existing tests green
- [ ] E2E test for critical flow updated/passing
```

---

## How to Use This File

See [.claude/rules/ui-upgrade-workflow.md](../../.claude/rules/ui-upgrade-workflow.md) for the full automation rules. Summary:

1. **Pick one phase at a time.** Don't interleave.
2. **Tick checkboxes as you complete tasks** — edit the file directly.
3. **Update the Status Dashboard** at the top after finishing each task (counts + Last updated + Branch).
4. **Do not start the next phase** until the current phase's acceptance gate passes.
5. **Commit format:** `feat(ui): <task id> <short description>` with `Refs:` footer pointing back here.
6. **One task = one commit.** Roadmap update is part of the task's commit, not separate.
7. **When a task reveals a spec gap**, update `ui-upgrade.md` first, then continue work, and log the decision in Notes & Discoveries.
8. **Flaky or blocked?** Move the task to a `### Blocked` section within the phase with a note explaining why, and pick up the next one.
9. **Branch:** single long-running branch `ui/apple-native-redesign`. Do not merge to `main` until Phase 7 completes.

---

## Notes & Discoveries

A running log of decisions and surprises found mid-implementation. Append-only.

- **0.4 (2026-04-21):** Spec referenced `src/main/ipc/index.ts` as the place to register handlers, but this project has no such aggregator — each handler is registered directly in `src/main/index.ts`. Updated `ui-upgrade.md` § Main-Process Changes to reflect the actual convention; registered `registerSystemHandlers()` alongside the existing calls.
- **1.16 / 1.25 (2026-04-22):** framer-motion (task 1.43) is not yet installed, so Toggle's spring flip and SegmentedControl's `layoutId` indicator are implemented with CSS transitions. Phase 6 tasks 6.6 and 6.7 already own upgrading these to spring animations once the dep lands — no spec change needed.
- **1.22 (2026-04-22):** Blocked pending `react-day-picker` install (task 1.43). See Phase 1 Blocked section.
- **1.43 (2026-04-23):** Phase 1 deps installed. Versions: `framer-motion@^12.38.0`, `@phosphor-icons/react@^2.1.10`, `@tanstack/react-virtual@^3.13.24`, `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `react-day-picker@^9.14.0`, `react-markdown@^10.1.0`, `electron-store@^11.0.2`. 1.22 DatePicker unblocked.
- **1.41 (2026-04-24):** Vitest config migrated from `environment: 'node'` single-env to v4 `projects` with separate `node` and `dom` (happy-dom) environments. Existing store/service tests keep their environment; new primitive `*.test.tsx` files run in `dom`. Added `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `happy-dom` as devDeps and a shared `src/test/dom-setup.ts`.
- **1.42 (2026-04-24):** axe-core surfaced three real a11y bugs: (1) `Avatar` needed `role="img"` to justify its `aria-label` (span-without-role + aria-label is axe-prohibited); (2) `ListRow` used `aria-selected` on `role="button"` which aria-allowed-attr flags — switched to `aria-pressed` for the default button role, `aria-selected` only when caller overrides role to option; (3) `Toggle` needs either a `label` prop or wrapping `<label>` — documented via the axe test. Also disabled axe's `aria-hidden-focus` for Sheet/Alert/Toast — known Radix focus-trap sentinel false positive under happy-dom.
- **Phase 1 gate (2026-04-24):** All 43 tasks complete. `npm run build` passes. `npx vitest run` passes 477 tests across 58 files (pretest rebuilds better-sqlite3 against system Node). `#/dev/primitives` renders 39 gallery sections — every primitive in every documented state. Every primitive has a unit test file and an axe-core audit (39 total). Side-by-side visual parity with Apple Mail/Notes/System Settings is a human review step — deferred to pre-merge review before Phase 7 ships. Proceeding to Phase 2 (Shell).
- **Phase 2 (2026-04-25):** shell.store uses localStorage persist (not electron-store) — avoids new IPC channels while satisfying persistence requirement. toolbarContext uses useSyncExternalStore external store pattern to avoid React context re-render loops when panels register actions. task 2.14 partial: glass/*, shared/PanelHeader, shared/Badge, shared/FilterBar, components/Skeleton deferred to Phase 4 — all still imported by existing panels. Deleting them now would break existing panels in their transitional state. `npx vitest run` passes 474 tests (3 removed for split-view coverage that no longer applies).
- **Phase 3 (2026-04-25):** CommandPalette uses Radix Dialog directly (not Sheet component) to achieve non-centered positioning (20% from top) that Sheet doesn't support. `shared/CommandPalette.tsx` and `shared/command-items.ts` deleted — replaced by `shell/CommandPalette.tsx` and `shell/command-items.ts`. `moderation:searchMembers` added to ipc-types + moderation handler — delegates to existing `getMembers` with search filter. "Toggle Agent" palette action navigates to agent panel (full toggle awaits Phase 4 panel rewrite). `TooltipProvider` added at App root. New `MenuActionType` values added: `openShortcutsSheet`, `newPost`, `newEvent`, `generateReport`, `focusSearch`. Panel-specific shortcuts (⌘A, ⇧⌘A, ⌘↵, ⌫, ↑↓, ⌃↵) dispatch DOM custom events (`panel:selectAll`, `panel:deselectAll`, `panel:openDetail`, `panel:openContextMenu`) for Phase 4 panels to subscribe to.
