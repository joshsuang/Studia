import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export function AuthScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'sign-in') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
      } else {
        const { error: err, data } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        if (!data.session) setInfo('Check your inbox to confirm your email, then sign in.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <GraduationCap size={20} />
          </div>
          <span className="text-xl font-semibold">Studia</span>
        </div>
        <h1 className="text-lg font-semibold">{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-1 text-sm text-muted">
          {mode === 'sign-in' ? 'Sign in to sync your study data.' : 'Your tasks and progress sync across every device.'}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
              placeholder="you@school.edu"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Password</label>
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
          {info && <p className="rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="focus-ring w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-black hover:brightness-110 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
            setError('')
            setInfo('')
          }}
          className="focus-ring mt-4 w-full text-center text-xs text-muted hover:text-white"
        >
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
