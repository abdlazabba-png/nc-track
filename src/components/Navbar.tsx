import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'

export function Navbar({ title }: { title: string }) {
  const { user, role } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b border-navy-900/10 bg-navy-700/95 backdrop-blur supports-[backdrop-filter]:bg-navy-700/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-7 text-white" />
          <div className="leading-tight">
            <div className="font-bold tracking-wide text-white">NC-Track</div>
            <div className="text-xs text-navy-100/80">{title}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="hidden text-right sm:block">
            <div className="text-navy-100">{user?.email}</div>
            {role && (
              <div className="text-xs font-medium uppercase tracking-wide text-gold-400">{role}</div>
            )}
          </div>
          <button
            onClick={() => signOut(auth)}
            className="rounded-md bg-gold-600 px-3 py-1.5 text-sm font-semibold text-navy-900 transition hover:bg-gold-400"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
