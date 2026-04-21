import { useState } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  tags: readonly string[]
  onChange: (tags: readonly string[]) => void
  placeholder?: string
}

export function TagInput({ tags, onChange, placeholder = 'Type and press Enter...' }: TagInputProps): React.ReactElement {
  const [input, setInput] = useState('')

  const handleAdd = (): void => {
    const trimmed = input.trim()
    if (!trimmed || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    setInput('')
  }

  const handleRemove = (index: number): void => {
    onChange(tags.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-[10px] rounded"
          >
            {tag}
            <button
              onClick={() => handleRemove(i)}
              className="text-accent/60 hover:text-red-400 transition-colors"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 px-2 py-1 bg-white/[0.03] border border-glass-border rounded text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>
    </div>
  )
}
