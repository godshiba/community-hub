import { useState } from 'react'
import { Button } from '@renderer/components/ui-native/Button'
import {
  Toast,
  ToastProvider,
  ToastViewport
} from '@renderer/components/ui-native/Toast'
import { ProgressBar } from '@renderer/components/ui-native/ProgressBar'
import { CircularProgress } from '@renderer/components/ui-native/CircularProgress'
import { DiscordIcon } from '@renderer/components/ui-native/icons/DiscordIcon'
import { TelegramIcon } from '@renderer/components/ui-native/icons/TelegramIcon'
import { GallerySection, GalleryRow } from './GallerySection'

export function FeedbackGallery(): React.ReactElement {
  const [info, setInfo] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const [warning, setWarning] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  const [progress] = useState<number>(62)

  return (
    <ToastProvider>
      <GallerySection id="toast" title="Toast">
        <GalleryRow label="Variants">
          <Button variant="secondary" onClick={() => setInfo(true)}>
            Info
          </Button>
          <Button variant="secondary" onClick={() => setSuccess(true)}>
            Success
          </Button>
          <Button variant="secondary" onClick={() => setWarning(true)}>
            Warning
          </Button>
          <Button variant="destructive" onClick={() => setError(true)}>
            Error
          </Button>
        </GalleryRow>

        <Toast
          open={info}
          onOpenChange={setInfo}
          variant="info"
          title="Heads up"
          description="Just a gentle reminder."
        />
        <Toast
          open={success}
          onOpenChange={setSuccess}
          variant="success"
          title="Saved"
          description="Your changes are live."
        />
        <Toast
          open={warning}
          onOpenChange={setWarning}
          variant="warning"
          title="Almost there"
          description="Your session expires in 1 minute."
          action={{ label: 'Extend', altText: 'Extend session', onClick: () => setWarning(false) }}
        />
        <Toast
          open={error}
          onOpenChange={setError}
          variant="error"
          title="Something went wrong"
          description="Errors do not auto-dismiss."
        />

        <ToastViewport />
      </GallerySection>

      <GallerySection id="progressbar" title="ProgressBar">
        <GalleryRow label="Determinate">
          <div style={{ width: 260 }}>
            <ProgressBar value={progress} ariaLabel="Upload progress" />
          </div>
          <span style={{ fontSize: 13 }}>{progress}%</span>
        </GalleryRow>
        <GalleryRow label="Indeterminate">
          <div style={{ width: 260 }}>
            <ProgressBar ariaLabel="Loading" />
          </div>
        </GalleryRow>
        <GalleryRow label="Tones">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 260 }}>
            <ProgressBar value={60} tone="accent" />
            <ProgressBar value={60} tone="success" />
            <ProgressBar value={60} tone="warning" />
            <ProgressBar value={60} tone="error" />
          </div>
        </GalleryRow>
      </GallerySection>

      <GallerySection id="circularprogress" title="CircularProgress">
        <GalleryRow label="Sizes (indeterminate)">
          <CircularProgress size="xs" ariaLabel="xs" />
          <CircularProgress size="sm" ariaLabel="sm" />
          <CircularProgress size="md" ariaLabel="md" />
          <CircularProgress size="lg" ariaLabel="lg" />
        </GalleryRow>
        <GalleryRow label="Determinate">
          <CircularProgress size="md" value={25} ariaLabel="25%" />
          <CircularProgress size="md" value={50} ariaLabel="50%" />
          <CircularProgress size="md" value={75} ariaLabel="75%" />
          <CircularProgress size="md" value={100} ariaLabel="100%" />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="icons" title="Custom icons">
        <GalleryRow label="Platform">
          <DiscordIcon size={24} style={{ color: 'var(--color-discord, #5865F2)' }} />
          <TelegramIcon size={24} style={{ color: 'var(--color-telegram, #29b6f6)' }} />
        </GalleryRow>
      </GallerySection>
    </ToastProvider>
  )
}
