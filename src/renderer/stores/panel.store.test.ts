import { describe, it, expect, beforeEach } from 'vitest'
import { usePanelStore } from './panel.store'

describe('panel.store', () => {
  beforeEach(() => {
    usePanelStore.setState({
      activePanel: 'dashboard',
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
})
