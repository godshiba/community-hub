import { useEffect, useState } from 'react'
import { GlassPanel } from '@/components/glass/GlassPanel'
import { useModerationStore } from '@/stores/moderation.store'
import { PanelHeader } from '@/components/shared/PanelHeader'
import { MemberTable } from './MemberTable'
import { MemberDetailPanel } from './MemberDetailPanel'
import { WarningDialog } from './WarningDialog'
import { BanDialog } from './BanDialog'

export function ModerationPanel(): React.ReactElement {
  const { selectedMember, fetchMembers, syncMembers, loading, error } = useModerationStore()
  const [warnTarget, setWarnTarget] = useState<number | null>(null)
  const [banTarget, setBanTarget] = useState<number | null>(null)

  useEffect(() => { fetchMembers() }, [])

  return (
    <GlassPanel className="p-4 space-y-4 overflow-y-auto h-full">
      <PanelHeader
        title="Moderation"
        subtitle="Manage community members, warnings, and bans"
        actions={
          <button
            onClick={() => syncMembers()}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'Syncing...' : 'Sync Members'}
          </button>
        }
      />

      {error && (
        <div className="px-3 py-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-4 h-[calc(100%-5rem)]">
        <div className={selectedMember ? 'w-1/2' : 'w-full'}>
          <MemberTable onWarn={setWarnTarget} onBan={setBanTarget} />
        </div>

        {selectedMember && (
          <div className="w-1/2">
            <MemberDetailPanel onWarn={setWarnTarget} onBan={setBanTarget} />
          </div>
        )}
      </div>

      <WarningDialog memberId={warnTarget} onClose={() => setWarnTarget(null)} />
      <BanDialog memberId={banTarget} onClose={() => setBanTarget(null)} />
    </GlassPanel>
  )
}
