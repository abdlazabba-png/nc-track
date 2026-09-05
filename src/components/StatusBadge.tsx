import type { SubmissionStatus } from '../types'

const STYLES: Record<SubmissionStatus, { badge: string; dot: string }> = {
  compliant: { badge: 'bg-green-50 text-green-800 ring-green-600/20', dot: 'bg-green-500' },
  pending: { badge: 'bg-gold-50 text-gold-700 ring-gold-600/20', dot: 'bg-gold-600' },
  flagged: { badge: 'bg-red-50 text-red-800 ring-red-600/20', dot: 'bg-red-500' },
}

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const s = STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${s.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}
