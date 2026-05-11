'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashStats {
  totalRounds: number
  activeSites: number
  signalLevel: string
  aiEnabled: boolean
  dataMode: string
}

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/admin/users', label: 'Access Keys', icon: '⚿' },
  { href: '/admin/sites', label: 'Sites', icon: '⊕' },
  { href: '/admin/signals', label: 'Signals', icon: '◎' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' },
  { href: '/admin/logs', label: 'Logs', icon: '☰' },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectors, setConnectors] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/connectors'),
      fetch('/api/signals/current'),
    ]).then(async ([cr, sr]) => {
      if (cr.status === 401 || sr.status === 401) { router.push('/admin'); return }
      const cdata = await cr.json()
      const sdata = await sr.json()
      setConnectors(cdata.connectors || [])
      setStats({
        totalRounds: 30,
        activeSites: (cdata.connectors || []).filter((c: any) => c.enabled).length,
        signalLevel: sdata.signal?.label || 'Watch Zone',
        aiEnabled: sdata.aiEnabled ?? false,
        dataMode: cdata.connectors?.[0]?.mode || 'mock',
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [router])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-cyber-bg flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/5 bg-cyber-card/50 flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-white/5">
          <div className="font-display text-sm font-black text-cyber-cyan glow-cyan tracking-wider">TONIC</div>
          <div className="text-white/30 text-xs font-mono mt-0.5">Admin Control</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body text-white/50 hover:text-white hover:bg-white/5 transition-all group"
            >
              <span className="text-cyber-cyan/50 group-hover:text-cyber-cyan transition-colors font-mono">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-white/30 hover:text-cyber-red/60 font-mono transition-colors"
          >
            ✕ Logout Admin
          </button>
          <Link href="/signals" className="block px-3 py-2 text-xs text-white/20 hover:text-cyber-cyan/40 font-mono transition-colors">
            → Client View
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl">
          <div className="mb-6">
            <h1 className="font-display text-xl font-black text-white tracking-wider">Dashboard</h1>
            <p className="text-white/30 text-sm font-mono mt-1">System overview & connector health</p>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 text-white/30 font-mono text-sm">
              <div className="w-4 h-4 border border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
              Loading system status...
            </div>
          ) : (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Active Sites', value: stats?.activeSites ?? 0, color: 'text-cyber-green' },
                  { label: 'Data Mode', value: stats?.dataMode?.toUpperCase() ?? 'MOCK', color: 'text-cyber-yellow' },
                  { label: 'Signal Level', value: stats?.signalLevel ?? '–', color: 'text-cyber-cyan' },
                  { label: 'AI Engine', value: stats?.aiEnabled ? 'ONLINE' : 'OFFLINE', color: stats?.aiEnabled ? 'text-cyber-green' : 'text-white/30' },
                ].map(s => (
                  <div key={s.label} className="glass-card border border-white/5 rounded-xl p-4">
                    <div className="text-xs text-white/30 font-mono uppercase tracking-wider mb-2">{s.label}</div>
                    <div className={`font-display text-lg font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Connector status */}
              <div className="glass-card border border-white/5 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-sm font-black text-white tracking-wider">Site Connectors</h2>
                  <Link href="/admin/sites" className="text-xs text-cyber-cyan/50 hover:text-cyber-cyan font-mono transition-colors">Manage →</Link>
                </div>
                <div className="space-y-2">
                  {connectors.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full status-pulse ${c.enabled ? 'bg-cyber-green' : 'bg-white/20'}`} />
                        <div>
                          <div className="text-sm text-white font-body">{c.siteName}</div>
                          <div className="text-xs text-white/30 font-mono">{c.siteUrl}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${c.mode === 'mock' ? 'border-cyber-yellow/30 text-cyber-yellow' : 'border-cyber-green/30 text-cyber-green'}`}>
                          {c.mode.toUpperCase()}
                        </span>
                        <span className={`text-xs font-mono ${c.enabled ? 'text-cyber-green' : 'text-white/30'}`}>
                          {c.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { href: '/admin/users', label: 'Manage Access Keys', desc: 'Add/remove client keys' },
                  { href: '/admin/signals', label: 'Signal Rules', desc: 'Edit thresholds & logic' },
                  { href: '/admin/settings', label: 'Settings', desc: 'Branding & app config' },
                  { href: '/admin/logs', label: 'System Logs', desc: 'View connector events' },
                  { href: '/admin/sites', label: 'Site Manager', desc: 'Enable/disable sites' },
                ].map(l => (
                  <Link key={l.href} href={l.href} className="glass-card border border-white/5 hover:border-cyber-cyan/20 rounded-xl p-4 transition-all group">
                    <div className="text-sm font-display font-bold text-white group-hover:text-cyber-cyan transition-colors">{l.label}</div>
                    <div className="text-xs text-white/30 font-mono mt-1">{l.desc}</div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
