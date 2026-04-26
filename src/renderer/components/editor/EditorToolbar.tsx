import { type CSSProperties, type ReactNode } from 'react'
import {
  TextB, TextItalic, TextStrikethrough, Code, ListBullets, ListNumbers,
  Quotes, CodeBlock, Link as LinkIcon
} from '@phosphor-icons/react'
import type { Editor } from '@tiptap/react'
import { Tooltip } from '@/components/ui-native/Tooltip'

interface EditorToolbarProps {
  editor: Editor
}

const BAR: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: 4,
  background: 'var(--color-surface-card-raised)',
  borderBottom: '1px solid var(--color-divider)'
}

const BUTTON_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 26,
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  background: 'transparent',
  color: 'var(--color-fg-secondary)',
  cursor: 'pointer',
  transition:
    'background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)'
}

const BUTTON_ACTIVE: CSSProperties = {
  background: 'var(--color-accent-fill)',
  color: 'var(--color-accent)'
}

const SEPARATOR: CSSProperties = {
  width: 1,
  height: 16,
  background: 'var(--color-divider)',
  marginInline: 4
}

interface IconButtonProps {
  label: string
  shortcut?: ReadonlyArray<string>
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

function IconButton({ label, shortcut, active, disabled, onClick, children }: IconButtonProps): React.ReactElement {
  const style: CSSProperties = {
    ...BUTTON_BASE,
    ...(active ? BUTTON_ACTIVE : null),
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer'
  }
  return (
    <Tooltip label={label} shortcut={shortcut} side="bottom">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        style={style}
        className="ui-editor-toolbar-btn"
      >
        {children}
      </button>
    </Tooltip>
  )
}

export function EditorToolbar({ editor }: EditorToolbarProps): React.ReactElement {
  const can = editor.can()
  return (
    <div role="toolbar" aria-label="Formatting" style={BAR}>
      <IconButton
        label="Bold"
        shortcut={['⌘', 'B']}
        active={editor.isActive('bold')}
        disabled={!can.toggleBold()}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <TextB size={14} weight="bold" />
      </IconButton>
      <IconButton
        label="Italic"
        shortcut={['⌘', 'I']}
        active={editor.isActive('italic')}
        disabled={!can.toggleItalic()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TextItalic size={14} weight="bold" />
      </IconButton>
      <IconButton
        label="Strikethrough"
        active={editor.isActive('strike')}
        disabled={!can.toggleStrike()}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <TextStrikethrough size={14} weight="bold" />
      </IconButton>
      <IconButton
        label="Inline code"
        active={editor.isActive('code')}
        disabled={!can.toggleCode()}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={14} weight="bold" />
      </IconButton>

      <span aria-hidden style={SEPARATOR} />

      <IconButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListBullets size={14} weight="bold" />
      </IconButton>
      <IconButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListNumbers size={14} weight="bold" />
      </IconButton>
      <IconButton
        label="Blockquote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quotes size={14} weight="bold" />
      </IconButton>
      <IconButton
        label="Code block"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <CodeBlock size={14} weight="bold" />
      </IconButton>

      <span aria-hidden style={SEPARATOR} />

      <IconButton
        label="Add link"
        shortcut={['⌘', 'K']}
        active={editor.isActive('link')}
        onClick={() => {
          const previous = (editor.getAttributes('link') as { href?: string }).href ?? ''
          const url = window.prompt('URL', previous)
          if (url === null) return
          if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
          }
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        }}
      >
        <LinkIcon size={14} weight="bold" />
      </IconButton>
    </div>
  )
}
