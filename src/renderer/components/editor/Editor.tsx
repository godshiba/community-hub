import { useEffect, type CSSProperties } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'
import { EditorToolbar } from './EditorToolbar'
import './editor.css'

export interface EditorProps {
  /** Markdown source. */
  value: string
  /** Called with the latest markdown on every change. */
  onChange: (markdown: string) => void
  placeholder?: string
  autoFocus?: boolean
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

const SHELL: CSSProperties = {
  border: '1px solid var(--color-divider)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  background: 'var(--color-surface-input)'
}

const BODY: CSSProperties = {
  maxHeight: 320,
  overflowY: 'auto'
}

export function Editor({
  value,
  onChange,
  placeholder = 'Write something…',
  autoFocus = false,
  ariaLabel,
  className,
  style
}: EditorProps): React.ReactElement | null {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit ships its own Link in v3 — disable to avoid duplicate-extension warnings.
        link: false
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' }
      }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({
        html: false,
        breaks: true,
        linkify: true,
        transformPastedText: true,
        transformCopiedText: true
      })
    ],
    content: value,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        'aria-label': ariaLabel ?? 'Rich text editor'
      }
    },
    onUpdate: ({ editor }) => {
      // tiptap-markdown stores its serializer on editor.storage.markdown
      const md = editor.storage.markdown.getMarkdown() as string
      onChange(md)
    }
  })

  // Keep external value changes in sync (e.g. form reset). Avoid resetting
  // when the new value already equals the editor's current markdown to
  // preserve cursor position during normal typing.
  useEffect(() => {
    if (!editor) return
    const current = editor.storage.markdown.getMarkdown() as string
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <div className={className} style={{ ...SHELL, ...style }}>
      <EditorToolbar editor={editor} />
      <div className="ui-editor-body" style={BODY}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
