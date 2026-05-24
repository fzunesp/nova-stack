export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-50 last:border-0">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-14 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export function TableRowSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-slate-50 last:border-0">
          <td className="px-6 py-4"><Skeleton className="h-4 w-4 rounded" /></td>
          <td className="px-6 py-4"><Skeleton className="h-4 flex-1" /></td>
          <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
          <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
          <td className="px-6 py-4"><Skeleton className="h-7 w-14 rounded-md" /></td>
        </tr>
      ))}
    </>
  )
}
