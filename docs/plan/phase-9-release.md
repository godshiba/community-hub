# Phase 9 — Polish & Release

**Goal:** Bug fixes, testing, performance optimization, build configuration, and v1.0.0 release.

**Version range:** `v0.9.x` → `v1.0.0`

**Depends on:** All previous phases

---

## Tasks

### Testing
- [ ] Unit tests for all services (main process)
- [ ] Unit tests for all stores (renderer)
- [ ] Integration tests for IPC round-trips
- [ ] Test database migrations (fresh install + upgrade)
- [ ] Test with real Discord bot token
- [ ] Test with real Telegram bot token
- [ ] Test with each AI provider (Grok, Claude, OpenAI, Gemini)
- [ ] Test all keyboard shortcuts
- [ ] Verify 80%+ test coverage

### Bug Fixes
- [ ] Fix all known bugs from previous phases
- [ ] Fix any console errors or warnings
- [ ] Fix edge cases: no platforms connected, no data, empty states
- [ ] Fix error states: API failures, DB errors, network issues

### Performance
- [ ] React.memo on expensive components (charts, tables)
- [ ] Lazy load panels (only render active panel)
- [ ] Debounce search inputs
- [ ] Optimize DB queries (check indexes)
- [ ] Profile renderer for unnecessary re-renders

### UI Polish
- [ ] Consistent glassmorphism across all panels
- [ ] Smooth transitions between panels
- [ ] Loading skeletons for all async content
- [ ] Empty states for all panels (no data yet)
- [ ] Error boundary with friendly error display
- [ ] Verify all Lucide icons render correctly

### Build Configuration
- [ ] electron-builder config for macOS (.dmg)
- [ ] electron-builder config for Windows (.exe / .msi)
- [ ] electron-builder config for Linux (.AppImage / .deb)
- [ ] App icon and metadata
- [ ] Auto-updater configuration (optional for v1)
- [ ] Code signing (optional for v1)

### Documentation
- [ ] Update README with screenshots
- [ ] Installation instructions
- [ ] Configuration guide (platform tokens, AI setup)
- [ ] Update CLAUDE.md if architecture changed during implementation

### Release
- [ ] Create `v1.0.0-rc.1` tag for testing
- [ ] Fix any RC issues → `v1.0.0-rc.2` if needed
- [ ] Final `v1.0.0` tag
- [ ] GitHub Release with release notes and installers attached

## Acceptance Criteria

- All tests pass with 80%+ coverage
- No console errors in production build
- App installs and runs clean on macOS (primary target)
- All 7 panels work correctly
- Platform connections stable
- AI agent works with all 4 providers
- PDF and CSV exports produce valid files
- App launches in < 3 seconds

## Tag

```bash
git tag v0.9.0  # all features complete, testing begins
git tag v0.9.1  # bug fixes
git tag v0.9.2  # performance + polish
git tag v1.0.0-rc.1  # release candidate
git tag v1.0.0  # stable release
```
