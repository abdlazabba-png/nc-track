import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'

export function ProtectedRoute({
  role,
  children,
}: {
  role: Role
  children: ReactNode
}) {
  const { user, role: userRole, loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-navy-700">Loading…</div>
  }

  if (!user || userRole !== role) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
