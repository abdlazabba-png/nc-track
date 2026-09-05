import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, updateDoc, doc, orderBy } from 'firebase/firestore'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Navbar } from '../../components/Navbar'
import { StatusBadge } from '../../components/StatusBadge'
import { Spinner } from '../../components/Feedback'
import { useCollection } from '../../hooks/useCollection'
import { db } from '../../lib/firebase'
import type { Alert, Operator, Project, Submission } from '../../types'

const selectClass =
  'rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm transition focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-400/20'

export function Dashboard() {
  const submissionsQuery = useMemo(() => query(collection(db, 'submissions'), orderBy('submittedAt', 'desc')), [])
  const { data: submissions, loading } = useCollection<Submission>(submissionsQuery)
  const { data: projects } = useCollection<Project>(useMemo(() => collection(db, 'projects'), []))
  const { data: operators } = useCollection<Operator>(useMemo(() => collection(db, 'operators'), []))
  const { data: alerts } = useCollection<Alert>(useMemo(() => collection(db, 'alerts'), []))

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const operatorById = useMemo(() => new Map(operators.map((o) => [o.id, o])), [operators])

  const [stateFilter, setStateFilter] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const states = useMemo(() => [...new Set(projects.map((p) => p.state))].sort(), [projects])

  const rows = useMemo(
    () =>
      submissions.map((s) => ({
        submission: s,
        project: projectById.get(s.projectId),
        operator: operatorById.get(s.operatorId),
      })),
    [submissions, projectById, operatorById],
  )

  const filteredRows = rows.filter(({ submission, project, operator }) => {
    if (stateFilter && project?.state !== stateFilter) return false
    if (sectorFilter && operator?.sector !== sectorFilter) return false
    if (statusFilter && submission.status !== statusFilter) return false
    return true
  })

  const totalOperators = operators.length
  const compliantCount = submissions.filter((s) => s.status === 'compliant').length
  const flaggedCount = submissions.filter((s) => s.status === 'flagged').length
  const avgScore = submissions.length
    ? Math.round((submissions.reduce((sum, s) => sum + s.computedNcPercent, 0) / submissions.length) * 10) / 10
    : 0

  const chartData = useMemo(() => {
    const byState = new Map<string, { total: number; count: number }>()
    for (const { submission, project } of rows) {
      if (!project) continue
      const entry = byState.get(project.state) ?? { total: 0, count: 0 }
      entry.total += submission.computedNcPercent
      entry.count += 1
      byState.set(project.state, entry)
    }
    return [...byState.entries()].map(([state, { total, count }]) => ({
      state,
      avgNcPercent: Math.round((total / count) * 10) / 10,
    }))
  }, [rows])

  const unacknowledged = alerts.filter((a) => !a.acknowledged)

  async function acknowledge(alertId: string) {
    await updateDoc(doc(db, 'alerts', alertId), { acknowledged: true })
  }

  return (
    <div>
      <Navbar title="Reviewer Dashboard" />
      <main className="mx-auto max-w-6xl p-6">
        {unacknowledged.length > 0 && (
          <div className="mb-6 space-y-2">
            {unacknowledged.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-8.99 3.75h.008v.008h-.008v-.008z" />
                  </svg>
                  <span>{a.message}</span>
                </div>
                <button
                  onClick={() => acknowledge(a.id)}
                  className="shrink-0 rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard label="Operators" value={totalOperators} icon="building" />
          <SummaryCard
            label="% Compliant"
            value={submissions.length ? `${Math.round((compliantCount / submissions.length) * 100)}%` : '—'}
            icon="check"
            accent="text-green-600"
          />
          <SummaryCard
            label="% Flagged"
            value={submissions.length ? `${Math.round((flaggedCount / submissions.length) * 100)}%` : '—'}
            icon="flag"
            accent="text-red-600"
          />
          <SummaryCard label="Avg NC Score" value={`${avgScore}%`} icon="chart" accent="text-gold-700" />
        </div>

        {chartData.length > 0 && (
          <div className="mb-6 rounded-lg border border-navy-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-navy-700">Average NC % by State</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                <XAxis dataKey="state" fontSize={12} tickLine={false} axisLine={{ stroke: '#DCE3EC' }} />
                <YAxis fontSize={12} unit="%" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: '#DCE3EC', fontSize: 13 }}
                  cursor={{ fill: '#EEF2F7' }}
                />
                <Bar dataKey="avgNcPercent" fill="#1B3358" radius={[4, 4, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-3">
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className={selectClass}>
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className={selectClass}>
            <option value="">All sectors</option>
            <option value="upstream">Upstream</option>
            <option value="midstream">Midstream</option>
            <option value="downstream">Downstream</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            <option value="compliant">Compliant</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
          </select>
          {(stateFilter || sectorFilter || statusFilter) && (
            <button
              onClick={() => {
                setStateFilter('')
                setSectorFilter('')
                setStatusFilter('')
              }}
              className="text-sm font-medium text-navy-600 hover:text-navy-700"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading && <Spinner label="Loading submissions…" />}

        {!loading && (
          <div className="overflow-hidden rounded-lg border border-navy-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-navy-50 text-left text-xs uppercase tracking-wide text-navy-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Operator</th>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold">State</th>
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 font-semibold">NC %</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredRows.map(({ submission, project, operator }) => (
                  <tr key={submission.id} className="transition hover:bg-navy-50/60">
                    <td className="px-4 py-3">
                      <Link
                        to={`/reviewer/submissions/${submission.id}`}
                        className="font-medium text-navy-700 hover:text-navy-600 hover:underline"
                      >
                        {operator?.companyName ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{project?.projectName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{project?.state ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{submission.periodLabel}</td>
                    <td className="px-4 py-3 font-medium tabular-nums text-navy-700">
                      {submission.computedNcPercent}%
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={submission.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No submissions match these filters.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

const ICONS: Record<string, string> = {
  building: 'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4',
  check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  flag: 'M3 3v18M3 4h13l-2 4 2 4H3',
  chart: 'M3 3v18h18M8 17V9m5 8V5m5 12v-6',
}

function SummaryCard({
  label,
  value,
  icon,
  accent = 'text-navy-700',
}: {
  label: string
  value: string | number
  icon: keyof typeof ICONS
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-navy-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <svg className={`h-4 w-4 ${accent}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[icon]} />
        </svg>
      </div>
      <p className="text-2xl font-bold text-navy-700">{value}</p>
    </div>
  )
}
