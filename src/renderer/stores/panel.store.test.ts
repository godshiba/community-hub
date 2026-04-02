import { describe, it, expect, beforeEach } from 'vitest'
import { usePanelStore } from './panel.store'

describe('panel.store', () => {
  beforeEach(() => {
    usePanelStore.setState({
      activePanel: 'dashboard',
      secondaryPanel: null,
      splitRatio: 0.6,
      panelHistory: []
    })
  })

  it('has dashboard as default active panel', () => {
    expect(usePanelStore.getState().activePanel).toBe('dashboard')
  })

  it('sets active panel and records history', () => {
    usePanelStore.getState().setActivePanel('scheduler')
    const state = usePanelStore.getState()
    expect(state.activePanel).toBe('scheduler')
    expect(state.panelHistory).toEqual(['dashboard'])
    expect(state.secondaryPanel).toBeNull()
  })

  it('opens and closes secondary panel', () => {
    usePanelStore.getState().openSecondary('settings')
    expect(usePanelStore.getState().secondaryPanel).toBe('settings')

    usePanelStore.getState().closeSecondary()
    expect(usePanelStore.getState().secondaryPanel).toBeNull()
  })

  it('clamps split ratio between 0.2 and 0.8', () => {
    usePanelStore.getState().setSplitRatio(0.1)
    expect(usePanelStore.getState().splitRatio).toBe(0.2)

    usePanelStore.getState().setSplitRatio(0.95)
    expect(usePanelStore.getState().splitRatio).toBe(0.8)

    usePanelStore.getState().setSplitRatio(0.5)
    expect(usePanelStore.getState().splitRatio).toBe(0.5)
  })

  it('goes back through history', () => {
    usePanelStore.getState().setActivePanel('scheduler')
    usePanelStore.getState().setActivePanel('events')

    usePanelStore.getState().goBack()
    expect(usePanelStore.getState().activePanel).toBe('scheduler')

    usePanelStore.getState().goBack()
    expect(usePanelStore.getState().activePanel).toBe('dashboard')
  })

  it('does nothing when going back with empty history', () => {
    usePanelStore.getState().goBack()
    expect(usePanelStore.getState().activePanel).toBe('dashboard')
  })

  it('limits history to 20 entries', () => {
    for (let i = 0; i < 25; i++) {
      usePanelStore.getState().setActivePanel(i % 2 === 0 ? 'scheduler' : 'dashboard')
    }
    expect(usePanelStore.getState().panelHistory.length).toBeLessThanOrEqual(20)
  })

  it('closes secondary panel when switching active', () => {
    usePanelStore.getState().openSecondary('settings')
    usePanelStore.getState().setActivePanel('events')
    expect(usePanelStore.getState().secondaryPanel).toBeNull()
  })
})
