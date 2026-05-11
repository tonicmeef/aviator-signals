'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid password.'); return }
      router.push('/admin/dashboard')
    } catch {
      setError('Connection error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cyber-bg bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display text-xs tracking-[0.4em] text-cyber-red/60 uppercase mb-2">⚠ RESTRICTED</div>
          <h1 className="font-display text-xl font-black text-white tracking-widest">ADMIN PANEL</h1>
          <p className="text-white/30 text-xs font-mono mt-1">Tonic Control Center</p>
        </div>

        <div className="glass-card border border-cyber-red/15 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-display tracking-widest text-white/40 uppercase mb-2">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password..."
                className="w-full bg-cyber-muted/40 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-cyber-red/40 transition-all"
              />
            </div>
            {error && (
              <div className="text-cyber-red text-xs font-mono border border-cyber-red/20 bg-cyber-red/5 rounded-lg px-3 py-2">
                ⚠ {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyber-red/80 to-cyber-pink/80 rounded-lg py-3 text-white font-display font-black text-sm tracking-widest uppercase hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Access Admin'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <a href="/login" className="text-xs text-white/20 hover:text-white/40 font-mono transition-colors">← Back to Client Login</a>
          </div>
        </div>
      </div>
    </div>
  )
}
