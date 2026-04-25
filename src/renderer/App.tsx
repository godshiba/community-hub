import { useState, useSyncExternalStore } from 'react'
import { Shell } from '@/components/shell/Shell'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { useAgentStore } from '@/stores/agent.store'
import { useSystemAccent } from '@/hooks/useSystemAccent'
import { useWindowActive } from '@/hooks/useWindowActive'
import { DevPreview } from '@/dev/DevPreview'
import { PrimitiveGallery } from '@/dev/PrimitiveGallery'

function subscribeHash(cb: () => void): () => void {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
function getHash(): string { return window.location.hash }
function useHash(): string {
  return useSyncExternalStore(subscribeHash, getHash, () => '')
}

export function App(): React.ReactElement {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const hash = useHash()

  useSystemAccent()
  useWindowActive()

  const fetchAgentStatus = useAgentStore((s) => s.fetchStatus)
  // Kick off agent status on mount — agentStore initialises lazily
  useState(() => { fetchAgentStatus() })

  if (import.meta.env.DEV && hash === '#/dev') {
    return <DevPreview />
  }

  if (import.meta.env.DEV && hash === '#/dev/primitives') {
    return <PrimitiveGallery />
  }

  return (
    <>
      <Shell onSearchClick={() => setCommandPaletteOpen(true)} />
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  )
}
