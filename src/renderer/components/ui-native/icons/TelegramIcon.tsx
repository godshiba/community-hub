import type { SVGProps } from 'react'

export interface TelegramIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string
}

export function TelegramIcon({
  size = 16,
  'aria-label': ariaLabel,
  ...rest
}: TelegramIconProps): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel ?? 'Telegram'}
      fill="currentColor"
      {...rest}
    >
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.96 1.25-5.54 3.66-.52.36-.99.53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.41-1.42-.87.03-.24.36-.48 1-.73 3.93-1.71 6.55-2.84 7.87-3.39 3.76-1.58 4.53-1.85 5.04-1.85.11 0 .36.03.52.18.15.14.19.33.21.47.01.14-.01.52-.05.95Z" />
    </svg>
  )
}
