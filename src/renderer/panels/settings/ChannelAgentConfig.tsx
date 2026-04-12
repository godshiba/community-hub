import { useEffect, useState } from 'react'
import { Settings2, Trash2, Plus } from 'lucide-react'
import { GlassCard } from '@/components/glass/GlassCard'
import { GlassModal } from '@/components/glass/GlassModal'
import { Badge } from '@/components/shared/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import type {
  ChannelAgentConfig as ChannelConfig,
  ChannelAgentConfigPayload
} from '@shared/knowledge-types'
import type { ChannelInfo } from '@shared/scheduler-types'
import type { Platform } from '@shared/settings-types'

const RESPOND_MODES: Array<{ value: ChannelConfig['respondMode']; label: string; desc: string }> = [
  { value: 'mentioned', label: 'When mentioned', desc: 'Respond only when @mentioned' },
  { value: 'always', label: 'Always', desc: 'Respond to every message' },
  { value: 'never', label: 'Never', desc: 'Do not respond in this channel' }
]

export function ChannelAgentConfig(): React.ReactElement {
  const {
    channelConfigs,
    categories,
    fetchChannelConfigs,
    fetchCategories,
    updateChannelConfig,
    deleteChannelConfig
  } = useKnowledgeStore()

  const [channels, setChannels] = useState<readonly ChannelInfo[]>([])
  const [editingConfig, setEditingConfig] = useState<ChannelConfig | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchChannelConfigs()
    fetchCategories()
    loadChannels()
  }, [])

  const loadChannels = async (): Promise<void> => {
    try {
      const result = await window.api.invoke('scheduler:getChannels')
      if (result.success) {
        setChannels(result.data)
      }
    } catch { /* ignore */ }
  }

  // Channels that don't have a config yet
  const unconfiguredChannels = channels.filter(
    (ch) => !channelConfigs.some((c) => c.platform === ch.platform && c.channelId === ch.id)
  )

  const handleAddChannel = (channel: ChannelInfo): void => {
    updateChannelConfig({
      platform: channel.platform,
      channelId: channel.id,
      channelName: channel.name,
      respondMode: 'mentioned',
      enabled: true,
      knowledgeCategoryIds: []
    })
    setShowAddModal(false)
  }

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-text-primary">Per-Channel Agent Config</h3>
          <p className="text-xs text-text-muted">
            Customize how the agent behaves in specific channels
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
          disabled={unconfiguredChannels.length === 0}
        >
          <Plus className="size-3.5" />
          Add Channel
        </button>
      </div>

      {channelConfigs.length === 0 ? (
        <EmptyState
          icon={Settings2}
          title="No channel configs"
          description="Add per-channel configurations to customize agent behavior in specific channels"
          action={
            unconfiguredChannels.length > 0
              ? { label: 'Configure a channel', onClick: () => setShowAddModal(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-1.5">
          {channelConfigs.map((config) => (
            <ChannelConfigRow
              key={config.id}
              config={config}
              categories={categories}
              onEdit={() => setEditingConfig(config)}
              onDelete={() => deleteChannelConfig(config.id)}
            />
          ))}
        </div>
      )}

      {/* Add channel modal */}
      <GlassModal open={showAddModal} onClose={() => setShowAddModal(false)}>
        <h3 className="text-sm font-medium text-text-primary mb-3">Add Channel Config</h3>
        {unconfiguredChannels.length === 0 ? (
          <p className="text-xs text-text-muted">
            All connected channels already have configs, or no platforms are connected.
          </p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {unconfiguredChannels.map((ch) => (
              <button
                key={`${ch.platform}-${ch.id}`}
                onClick={() => handleAddChannel(ch)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left rounded hover:bg-white/[0.04] transition-colors"
              >
                <Badge
                  variant={ch.platform === 'discord' ? 'platform-discord' : 'platform-telegram'}
                >
                  {ch.platform}
                </Badge>
                <span className="text-text-primary truncate">{ch.name}</span>
                {ch.guildName && (
                  <span className="text-text-muted ml-auto">{ch.guildName}</span>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-3">
          <button
            onClick={() => setShowAddModal(false)}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>
      </GlassModal>

      {/* Edit config modal */}
      {editingConfig && (
        <ChannelConfigEditor
          config={editingConfig}
          categories={categories}
          onSave={(payload) => {
            updateChannelConfig(payload)
            setEditingConfig(null)
          }}
          onClose={() => setEditingConfig(null)}
        />
      )}
    </GlassCard>
  )
}

// ---------------------------------------------------------------------------
// Sub: Config row
// ---------------------------------------------------------------------------

function ChannelConfigRow({
  config,
  categories,
  onEdit,
  onDelete
}: {
  config: ChannelConfig
  categories: readonly { id: number; name: string }[]
  onEdit: () => void
  onDelete: () => void
}): React.ReactElement {
  const scopedCategories = categories.filter((c) =>
    config.knowledgeCategoryIds.includes(c.id)
  )

  return (
    <div className="group flex items-center gap-2 px-3 py-2 bg-white/[0.02] rounded">
      <Badge
        variant={config.platform === 'discord' ? 'platform-discord' : 'platform-telegram'}
      >
        {config.platform}
      </Badge>
      <span className="text-xs text-text-primary truncate flex-1">
        {config.channelName ?? config.channelId}
      </span>
      <Badge
        variant={
          config.respondMode === 'always' ? 'success' :
          config.respondMode === 'never' ? 'error' : 'muted'
        }
      >
        {config.respondMode}
      </Badge>
      {scopedCategories.length > 0 && (
        <span className="text-[10px] text-text-muted">
          {scopedCategories.length} categories
        </span>
      )}
      {!config.enabled && <Badge variant="warning">disabled</Badge>}
      <button
        onClick={onEdit}
        className="p-1 opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-secondary transition-all"
        title="Edit"
      >
        <Settings2 className="size-3.5" />
      </button>
      <button
        onClick={onDelete}
        className="p-1 opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all"
        title="Remove"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub: Config editor modal
// ---------------------------------------------------------------------------

function ChannelConfigEditor({
  config,
  categories,
  onSave,
  onClose
}: {
  config: ChannelConfig
  categories: readonly { id: number; name: string }[]
  onSave: (payload: ChannelAgentConfigPayload) => void
  onClose: () => void
}): React.ReactElement {
  const [respondMode, setRespondMode] = useState(config.respondMode)
  const [systemPromptOverride, setSystemPromptOverride] = useState(
    config.systemPromptOverride ?? ''
  )
  const [personalityOverride, setPersonalityOverride] = useState(
    config.personalityOverride ?? ''
  )
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    [...config.knowledgeCategoryIds]
  )
  const [enabled, setEnabled] = useState(config.enabled)

  const toggleCategory = (id: number): void => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    onSave({
      platform: config.platform as Platform,
      channelId: config.channelId,
      channelName: config.channelName,
      respondMode,
      systemPromptOverride: systemPromptOverride.trim() || null,
      personalityOverride: personalityOverride.trim() || null,
      knowledgeCategoryIds: selectedCategoryIds,
      enabled
    })
  }

  return (
    <GlassModal open onClose={onClose} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-sm font-medium text-text-primary">
          Configure: {config.channelName ?? config.channelId}
        </h3>

        {/* Enabled toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-glass-border bg-glass-surface"
          />
          <span className="text-xs text-text-secondary">Enable per-channel config</span>
        </label>

        {/* Respond mode */}
        <div>
          <label className="text-xs text-text-muted block mb-1.5">Respond Mode</label>
          <div className="space-y-1">
            {RESPOND_MODES.map((mode) => (
              <label
                key={mode.value}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer text-xs transition-colors ${
                  respondMode === mode.value ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-white/[0.03]'
                }`}
              >
                <input
                  type="radio"
                  name="respondMode"
                  value={mode.value}
                  checked={respondMode === mode.value}
                  onChange={() => setRespondMode(mode.value)}
                  className="sr-only"
                />
                <span className="font-medium">{mode.label}</span>
                <span className="text-text-muted">{mode.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* System prompt override */}
        <div>
          <label className="text-xs text-text-muted block mb-1">
            System Prompt Override (optional)
          </label>
          <textarea
            value={systemPromptOverride}
            onChange={(e) => setSystemPromptOverride(e.target.value)}
            placeholder="Custom system prompt for this channel..."
            rows={3}
            className="w-full px-3 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 resize-y"
          />
        </div>

        {/* Personality override */}
        <div>
          <label className="text-xs text-text-muted block mb-1">
            Personality Override (optional)
          </label>
          <input
            type="text"
            value={personalityOverride}
            onChange={(e) => setPersonalityOverride(e.target.value)}
            placeholder="e.g., formal and professional"
            className="w-full px-3 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>

        {/* Knowledge category scope */}
        {categories.length > 0 && (
          <div>
            <label className="text-xs text-text-muted block mb-1.5">
              Knowledge Scope (empty = all categories)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    selectedCategoryIds.includes(cat.id)
                      ? 'bg-accent/15 border-accent/30 text-accent'
                      : 'bg-glass-surface border-glass-border text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </GlassModal>
  )
}
