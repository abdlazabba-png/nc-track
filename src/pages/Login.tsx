import { useState, type FormEvent } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/firebase'
import { Logo } from '../components/Logo'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const token = await cred.user.getIdTokenResult()
      const role = token.claims.role
      navigate(role === 'reviewer' ? '/reviewer' : '/operator')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-700 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative flex items-center gap-3">
          <Logo className="h-9 w-9 text-white" />
          <span className="text-lg font-bold tracking-wide">NC-Track</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            Nigerian Content compliance, tracked and scored automatically.
          </h1>
          <p className="mt-4 text-navy-100">
            Operators submit utilization data, reviewers see compliance status the moment it's
            computed — no spreadsheets, no lag.
          </p>
        </div>
        <p className="relative text-xs text-navy-100/70">
          Capstone prototype for the Nigerian Content Compliance &amp; Utilization Tracking Platform.
        </p>
      </div>

      <div className="flex items-center justify-center bg-navy-50 px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-bold text-navy-700">NC-Track</span>
          </div>

          <h2 className="text-xl font-bold text-navy-700">Sign in</h2>
          <p className="mb-6 text-sm text-gray-500">Enter your operator or reviewer credentials.</p>

          <label className="mb-1 block text-sm font-medium text-navy-700">Email</label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-400/20"
          />

          <label className="mb-1 block text-sm font-medium text-navy-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-400/20"
          />

          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-navy-700 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-600 disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
