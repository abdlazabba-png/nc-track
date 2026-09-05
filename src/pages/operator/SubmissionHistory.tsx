import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, doc, query, where, orderBy } from 'firebase/firestore'
import { Navbar } from '../../components/Navbar'
import { StatusBadge } from '../../components/StatusBadge'
import { Spinner, EmptyState } from '../../components/Feedback'
import { useAuth } from '../../context/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { useDocument } from '../../hooks/useDocument'
import { db } from '../../lib/firebase'
import type { Project, Submission } from '../../types'

export function SubmissionHistory() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()

  const projectRef = useMemo(() => (projectId ? doc(db, 'projects', projectId) : null), [projectId])
  const { data: project } = useDocument<Project>(projectRef)

  const submissionsQuery = useMemo(
    () =>
      projectId && user
        ? query(
            collection(db, 'submissions'),
            where('projectId', '==', projectId),
            where('operatorId', '==', user.uid),
            orderBy('submittedAt', 'desc'),
          )
        : null,
    [projectId, user],
  )
  const { data: submissions, loading } = useCollection<Submission>(submissionsQuery)

  return (
    <div>
      <Navbar title={project ? project.projectName : 'Submission History'} />
      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <Link
              to="/operator"
              className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-700"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              All projects
            </Link>
            {project && (
              <h1 className="mt-1 text-lg font-bold text-navy-700">
                {project.projectName}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {project.state} · Threshold {project.ncThresholdPercent}%
                </span>
              </h1>
            )}
          </div>
          <Link
            to={`/operator/projects/${projectId}/new`}
            className="shrink-0 rounded-md bg-navy-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-600"
          >
            + New Submission
          </Link>
        </div>

        {loading && <Spinner label="Loading submissions…" />}
        {!loading && submissions.length === 0 && (
          <EmptyState title="No submissions yet" hint="Submit your first period's utilization data to get started." />
        )}

        {submissions.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-navy-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-navy-50 text-left text-xs uppercase tracking-wide text-navy-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 font-semibold">NC %</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {submissions.map((s) => (
                  <tr key={s.id} className="transition hover:bg-navy-50/60">
                    <td className="px-4 py-3 font-medium text-navy-700">{s.periodLabel}</td>
                    <td className="px-4 py-3 tabular-nums">{s.computedNcPercent}%</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
