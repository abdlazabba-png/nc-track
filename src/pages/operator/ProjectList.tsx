import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, orderBy } from 'firebase/firestore'
import { Navbar } from '../../components/Navbar'
import { Spinner, EmptyState } from '../../components/Feedback'
import { useAuth } from '../../context/AuthContext'
import { useCollection } from '../../hooks/useCollection'
import { db } from '../../lib/firebase'
import type { Project } from '../../types'

export function ProjectList() {
  const { user } = useAuth()

  const projectsQuery = useMemo(
    () =>
      user
        ? query(collection(db, 'projects'), where('operatorId', '==', user.uid), orderBy('projectName'))
        : null,
    [user],
  )
  const { data: projects, loading } = useCollection<Project>(projectsQuery)

  return (
    <div>
      <Navbar title="My Projects" />
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="mb-5 text-lg font-bold text-navy-700">My Projects</h1>

        {loading && <Spinner label="Loading projects…" />}
        {!loading && projects.length === 0 && (
          <EmptyState
            title="No projects assigned yet"
            hint="Once a reviewer assigns a project to your company, it will appear here."
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/operator/projects/${p.id}`}
              className="group rounded-lg border border-navy-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-navy-400 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-navy-50 text-navy-700">
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                  </svg>
                </span>
                <svg
                  className="h-4 w-4 text-navy-100 transition group-hover:translate-x-0.5 group-hover:text-navy-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h2 className="font-bold text-navy-700">{p.projectName}</h2>
              <p className="mt-1 text-sm text-gray-500">{p.state}</p>
              <p className="mt-3 inline-flex rounded bg-gold-50 px-2 py-0.5 text-xs font-semibold text-gold-700">
                Threshold {p.ncThresholdPercent}%
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
