import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { Navbar } from '../../components/Navbar'
import { StatusBadge } from '../../components/StatusBadge'
import { Spinner } from '../../components/Feedback'
import { useDocument } from '../../hooks/useDocument'
import { db } from '../../lib/firebase'
import type { Operator, Project, Submission, SubmissionStatus } from '../../types'

export function SubmissionDetail() {
  const { submissionId } = useParams<{ submissionId: string }>()

  const submissionRef = useMemo(() => (submissionId ? doc(db, 'submissions', submissionId) : null), [submissionId])
  const { data: submission } = useDocument<Submission>(submissionRef)

  const projectRef = useMemo(
    () => (submission ? doc(db, 'projects', submission.projectId) : null),
    [submission],
  )
  const { data: project } = useDocument<Project>(projectRef)

  const operatorRef = useMemo(
    () => (submission ? doc(db, 'operators', submission.operatorId) : null),
    [submission],
  )
  const { data: operator } = useDocument<Operator>(operatorRef)

  const [overrideStatus, setOverrideStatus] = useState<SubmissionStatus | ''>('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  async function handleOverride(e: FormEvent) {
    e.preventDefault()
    if (!submissionRef || !overrideStatus || !reason.trim()) return
    setError(null)
    setSubmitting(true)
    try {
      await updateDoc(submissionRef, {
        status: overrideStatus,
        reviewerNote: reason.trim(),
        reviewedAt: Date.now(),
      })
      setOverrideStatus('')
      setReason('')
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2500)
    } catch {
      setError('Could not save the override — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!submission) {
    return (
      <div>
        <Navbar title="Submission Detail" />
        <main className="mx-auto max-w-2xl p-6">
          <Spinner label="Loading submission…" />
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navbar title="Submission Detail" />
      <main className="mx-auto max-w-2xl p-6">
        <Link
          to="/reviewer"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-700"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>

        <div className="mb-6 overflow-hidden rounded-lg border border-navy-100 bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-navy-100 bg-navy-50/60 px-6 py-4">
            <div>
              <h1 className="text-lg font-bold text-navy-700">{project?.projectName ?? 'Project'}</h1>
              <p className="text-sm text-gray-500">
                {operator?.companyName} · {project?.state} · {submission.periodLabel}
              </p>
            </div>
            <StatusBadge status={submission.status} />
          </div>

          <dl className="grid grid-cols-2 gap-y-4 px-6 py-5 text-sm">
            <DetailField label="Computed NC %">
              <span className="font-bold text-navy-700">{submission.computedNcPercent}%</span>
            </DetailField>
            <DetailField label="Project threshold">{project?.ncThresholdPercent}%</DetailField>

            <DetailField label="Nigerian / Total personnel">
              {submission.nigerianPersonnelCount} / {submission.totalPersonnelCount}
            </DetailField>
            <DetailField label="Local training hours">{submission.trainingHoursLocal}</DetailField>

            <DetailField label="Nigerian / Total spend" full>
              ₦{submission.nigerianSpendNaira.toLocaleString()} / ₦{submission.totalSpendNaira.toLocaleString()}
            </DetailField>

            <DetailField label="Submitted">{new Date(submission.submittedAt).toLocaleString()}</DetailField>
            {submission.reviewedAt && (
              <DetailField label="Last reviewed">{new Date(submission.reviewedAt).toLocaleString()}</DetailField>
            )}

            {submission.reviewerNote && (
              <DetailField label="Reviewer note" full>
                <span className="italic text-gray-600">{submission.reviewerNote}</span>
              </DetailField>
            )}
          </dl>

          <p className="border-t border-navy-100 bg-gray-50 px-6 py-3 text-xs text-gray-400">
            Evidence file upload is not available in this prototype deployment.
          </p>
        </div>

        <form onSubmit={handleOverride} className="rounded-lg border border-navy-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-bold text-navy-700">Override status</h2>
          <p className="mb-4 text-xs text-gray-500">
            A reason is required — this becomes part of the audit record on the submission.
          </p>

          <select
            value={overrideStatus}
            onChange={(e) => setOverrideStatus(e.target.value as SubmissionStatus)}
            className="mb-3 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-400/20"
          >
            <option value="">Select new status…</option>
            <option value="compliant">Compliant</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
          </select>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="Reason for override (required)"
            rows={3}
            className="mb-3 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-400/20"
          />

          {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {savedFlash && (
            <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Override saved.</p>
          )}

          <button
            type="submit"
            disabled={submitting || !overrideStatus || !reason.trim()}
            className="w-full rounded-md bg-navy-700 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-600 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save override'}
          </button>
        </form>
      </main>
    </div>
  )
}

function DetailField({
  label,
  children,
  full = false,
}: {
  label: string
  children: ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? 'col-span-2' : undefined}>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-navy-900">{children}</dd>
    </div>
  )
}
