import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * Reads the OS `prefers-reduced-motion` setting reactively.
 *
 * Components guard Framer Motion springs with the returned flag so motion
 * collapses to instant state changes for users who have asked for less
 * motion in System Settings > Accessibility > Display.
 *
 * CSS duration tokens are also zeroed at the media-query level in
 * globals.css — this hook is for imperative (JS-driven) animation only.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
