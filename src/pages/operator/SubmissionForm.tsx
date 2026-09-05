import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addDoc, collection, doc, serverTimestamp } from 'firebase/firestore'
import { Navbar } from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useDocument } from '../../hooks/useDocument'
import { db } from '../../lib/firebase'
import { computeNcPercent, computeStatus } from '../../lib/scoring'
import type { Project } from '../../types'

const numberField = (v: string) => (v === '' ? 0 : Number(v))

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-400/20'
const labelClass = 'mb-1 block text-sm font-medium text-navy-700'

const ESTIMATE_STYLES = {
  compliant: 'border-green-200 bg-green-50 text-green-800',
  pending: 'border-gold-400/40 bg-gold-50 text-gold-700',
  flagged: 'border-red-200 bg-red-50 text-red-800',
}

export function SubmissionForm() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const projectRef = useMemo(() => (projectId ? doc(db, 'projects', projectId) : null), [projectId])
  const { data: project } = useDocument<Project>(projectRef)

  const [periodLabel, setPeriodLabel] = useState('')
  const [nigerianPersonnelCount, setNigerianPersonnelCount] = useState('')
  const [totalPersonnelCount, setTotalPersonnelCount] = useState('')
  const [nigerianSpendNaira, setNigerianSpendNaira] = useState('')
  const [totalSpendNaira, setTotalSpendNaira] = useState('')
  const [trainingHoursLocal, setTrainingHoursLocal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo(() => {
    const input = {
      nigerianPersonnelCount: numberField(nigerianPersonnelCount),
      totalPersonnelCount: numberField(totalPersonnelCount),
      nigerianSpendNaira: numberField(nigerianSpendNaira),
      totalSpendNaira: numberField(totalSpendNaira),
      trainingHoursLocal: numberField(trainingHoursLocal),
    }
    const pct = computeNcPercent(input)
    return project ? { pct, status: computeStatus(pct, project.ncThresholdPercent) } : { pct, status: null }
  }, [nigerianPersonnelCount, totalPersonnelCount, nigerianSpendNaira, totalSpendNaira, trainingHoursLocal, project])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !projectId || !project) return
    setError(null)
    setSubmitting(true)
    try {
      const input = {
        nigerianPersonnelCount: numberField(nigerianPersonnelCount),
        totalPersonnelCount: numberField(totalPersonnelCount),
        nigerianSpendNaira: numberField(nigerianSpendNaira),
        totalSpendNaira: numberField(totalSpendNaira),
        trainingHoursLocal: numberField(trainingHoursLocal),
      }
      const computedNcPercent = computeNcPercent(input)
      const status = computeStatus(computedNcPercent, project.ncThresholdPercent)

      const submissionRef = await addDoc(collection(db, 'submissions'), {
        projectId,
        operatorId: user.uid,
        periodLabel,
        ...input,
        evidenceFileUrls: [],
        computedNcPercent,
        status,
        submittedAt: Date.now(),
        reviewedAt: null,
        reviewerNote: null,
      })

      if (status === 'flagged') {
        await addDoc(collection(db, 'alerts'), {
          submissionId: submissionRef.id,
          operatorId: user.uid,
          message: `${project.projectName} (${periodLabel}) came in at ${computedNcPercent}%, below the ${project.ncThresholdPercent}% threshold.`,
          createdAt: serverTimestamp(),
          acknowledged: false,
        })
      }

      navigate(`/operator/projects/${projectId}`)
    } catch (err) {
      console.error(err)
      setError('Could not submit — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Navbar title={project ? `New Submission — ${project.projectName}` : 'New Submission'} />
      <main className="mx-auto max-w-xl p-6">
        <Link
          to={`/operator/projects/${projectId}`}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-700"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <form onSubmit={handleSubmit} className="rounded-lg border border-navy-100 bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-lg font-bold text-navy-700">New Submission</h1>
          <p className="mb-5 text-sm text-gray-500">
            {project ? `${project.projectName} · Threshold ${project.ncThresholdPercent}%` : 'Loading project…'}
          </p>

          <label className={labelClass}>Period label</label>
          <input
            required
            placeholder="e.g. Q3 2026"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            className={`mb-4 ${inputClass}`}
          />

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nigerian personnel</label>
              <input
                type="number"
                min="0"
                required
                value={nigerianPersonnelCount}
                onChange={(e) => setNigerianPersonnelCount(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Total personnel</label>
              <input
                type="number"
                min="0"
                required
                value={totalPersonnelCount}
                onChange={(e) => setTotalPersonnelCount(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nigerian spend (₦)</label>
              <input
                type="number"
                min="0"
                required
                value={nigerianSpendNaira}
                onChange={(e) => setNigerianSpendNaira(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Total spend (₦)</label>
              <input
                type="number"
                min="0"
                required
                value={totalSpendNaira}
                onChange={(e) => setTotalSpendNaira(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <label className={labelClass}>Local training hours</label>
          <input
            type="number"
            min="0"
            required
            value={trainingHoursLocal}
            onChange={(e) => setTrainingHoursLocal(e.target.value)}
            className={`mb-4 ${inputClass}`}
          />

          <p className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Evidence file upload is not available in this prototype deployment — evidence can be discussed with
            your reviewer separately.
          </p>

          <div
            className={`mb-4 flex items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors ${
              preview.status ? ESTIMATE_STYLES[preview.status] : 'border-navy-100 bg-navy-50 text-navy-700'
            }`}
          >
            <span>Live estimate</span>
            <span className="flex items-center gap-2 font-bold">
              {preview.pct}%
              {preview.status && <span className="font-medium capitalize">· {preview.status}</span>}
            </span>
          </div>

          {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !project}
            className="w-full rounded-md bg-navy-700 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-600 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </main>
    </div>
  )
}
