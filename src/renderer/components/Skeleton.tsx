import { memo } from 'react'

interface SkeletonProps {
  className?: string
}

export const Skeleton = memo(function Skeleton({ className = '' }: SkeletonProps): React.ReactElement {
  return (
    <div className={`animate-pulse bg-glass-surface rounded ${className}`} />
  )
})

export const SkeletonRow = memo(function SkeletonRow(): React.ReactElement {
  return (
    <tr className="border-b border-glass-border/50">
      <td className="py-2 px-2"><Skeleton className="h-3 w-24" /></td>
      <td className="py-2 px-2"><Skeleton className="h-3 w-16" /></td>
      <td className="py-2 px-2"><Skeleton className="h-3 w-8" /></td>
      <td className="py-2 px-2"><Skeleton className="h-3 w-8" /></td>
      <td className="py-2 px-2"><Skeleton className="h-3 w-14" /></td>
      <td className="py-2 px-2"><Skeleton className="h-3 w-16" /></td>
    </tr>
  )
})

export const SkeletonCard = memo(function SkeletonCard(): React.ReactElement {
  return (
    <div className="px-3 py-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
})
