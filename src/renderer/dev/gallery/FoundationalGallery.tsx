import { Surface } from '@renderer/components/ui-native/Surface'
import { Divider } from '@renderer/components/ui-native/Divider'
import { StatusDot } from '@renderer/components/ui-native/StatusDot'
import { Pill } from '@renderer/components/ui-native/Pill'
import { Badge } from '@renderer/components/ui-native/Badge'
import { KeyCap } from '@renderer/components/ui-native/KeyCap'
import { Avatar } from '@renderer/components/ui-native/Avatar'
import { Skeleton } from '@renderer/components/ui-native/Skeleton'
import { Section } from '@renderer/components/ui-native/Section'
import { GallerySection, GalleryRow } from './GallerySection'

export function FoundationalGallery(): React.ReactElement {
  return (
    <>
      <GallerySection id="surface" title="Surface" subtitle="Four variants for card layering">
        <GalleryRow label="Plain">
          <Surface variant="plain" style={{ padding: 12, width: 200 }}>
            surface-card
          </Surface>
        </GalleryRow>
        <GalleryRow label="Raised">
          <Surface variant="raised" style={{ padding: 12, width: 200 }}>
            surface-card-raised
          </Surface>
        </GalleryRow>
        <GalleryRow label="Input">
          <Surface variant="input" style={{ padding: 12, width: 200 }}>
            surface-input
          </Surface>
        </GalleryRow>
        <GalleryRow label="Elevated">
          <Surface variant="elevated" style={{ padding: 12, width: 200 }}>
            surface-card-elevated
          </Surface>
        </GalleryRow>
      </GallerySection>

      <GallerySection id="divider" title="Divider">
        <GalleryRow label="Hairline">
          <div style={{ width: 260 }}>
            <Divider weight="hairline" />
          </div>
        </GalleryRow>
        <GalleryRow label="Strong">
          <div style={{ width: 260 }}>
            <Divider weight="strong" />
          </div>
        </GalleryRow>
        <GalleryRow label="Vertical">
          <div style={{ display: 'flex', height: 24, alignItems: 'center' }}>
            <span>left</span>
            <Divider orientation="vertical" style={{ marginInline: 10 }} />
            <span>right</span>
          </div>
        </GalleryRow>
      </GallerySection>

      <GallerySection id="statusdot" title="StatusDot">
        <GalleryRow label="Tones">
          <StatusDot tone="success" />
          <StatusDot tone="warning" />
          <StatusDot tone="error" />
          <StatusDot tone="neutral" />
          <StatusDot tone="accent" />
        </GalleryRow>
        <GalleryRow label="Pulsing">
          <StatusDot tone="success" pulse />
          <StatusDot tone="warning" pulse />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="pill" title="Pill">
        <GalleryRow label="Tones">
          <Pill variant="neutral">Neutral</Pill>
          <Pill variant="accent">Accent</Pill>
          <Pill variant="success">Success</Pill>
          <Pill variant="warning">Warning</Pill>
          <Pill variant="error">Error</Pill>
          <Pill variant="discord">Discord</Pill>
          <Pill variant="telegram">Telegram</Pill>
        </GalleryRow>
      </GallerySection>

      <GallerySection id="badge" title="Badge" subtitle="Numeric count badge">
        <GalleryRow label="Counts">
          <Badge count={1} />
          <Badge count={12} />
          <Badge count={99} />
          <Badge count={150} />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="keycap" title="KeyCap">
        <GalleryRow label="Shortcuts">
          <KeyCap keys={['cmd', 'K']} />
          <KeyCap keys={['shift', 'cmd', 'A']} />
          <KeyCap keys={['opt', 'enter']} />
          <KeyCap keys={['esc']} />
          <KeyCap keys={['up']} />
        </GalleryRow>
        <GalleryRow label="Sizes">
          <KeyCap keys={['cmd', 'K']} size="sm" />
          <KeyCap keys={['cmd', 'K']} size="md" />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="avatar" title="Avatar">
        <GalleryRow label="Initials">
          <Avatar name="Alice Liddell" />
          <Avatar name="Bob" />
          <Avatar name="Carol Danvers" />
        </GalleryRow>
        <GalleryRow label="Sizes">
          <Avatar name="Small" size={20} />
          <Avatar name="Medium" size={28} />
          <Avatar name="Large" size={40} />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="skeleton" title="Skeleton">
        <GalleryRow label="Line">
          <Skeleton variant="line" style={{ width: 220 }} />
        </GalleryRow>
        <GalleryRow label="Circle">
          <Skeleton variant="circle" />
        </GalleryRow>
        <GalleryRow label="Rect">
          <Skeleton variant="rect" style={{ width: 160, height: 80 }} />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="section" title="Section wrapper">
        <Section title="Panel section" subtitle="Groups related content">
          <Surface variant="plain" style={{ padding: 12 }}>
            Any children render in the body slot.
          </Surface>
        </Section>
      </GallerySection>
    </>
  )
}
