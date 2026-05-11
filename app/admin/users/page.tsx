'use client'

import { useState } from 'react'
import Link from 'next/link'

// In production, these would come from a DB. For now, .env config.
const DEMO_KEYS = [
  { id: '1', key: 'SIGNAL2026', siteUrl: 'all', label: 'Default Key', active: true },
  { id: '2', key: 'AVIATOR1', siteUrl: 'all', label: 'Key 2', active: true },
  { id: '3', key: 'PREMIUM1', siteUrl: 'all', label: 'Key 3', active: true },
]

export default function AdminUsersPage() {
  const [keys] = useState(DEMO_KEYS)
  const [copied, setCopied] = useState<string | null>(null)

  function copy(key: string) {
    navigator.clipboard.writeText(key)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="min-h-screen bg-cyber-bg flex">
      <aside className="w-56 border-r border-white/5 bg-cyber-card/50 p-3 sticky top-0 h-screen">
        <div className="p-2 mb-4">
          <div className="font-display text-sm font-black text-cyber-cyan tracking-wider">TONIC</div>
        </div>
        {[
          { href: '/admin/dashboard', label: '◈ Dashboard' },
          { href: '/admin/users', label: '⚿ Access Keys' },
          { href: '/admin/sites', label: '⊕ Sites' },
          { href: '/admin/signals', label: '◎ Signals' },
          { href: '/admin/settings', label: '⚙ Settings' },
          { href: '/admin/logs', label: '☰ Logs' },
        ].map(n => (
          <Link key={n.href} href={n.href} className="flex items-center px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all font-mono">
            {n.label}
          </Link>
        ))}
      </aside>

      <main className="flex-1 p-6">
        <div className="max-w-2xl">
          <div className="mb-6">
            <h1 className="font-display text-xl font-black text-white tracking-wider">Access Keys</h1>
            <p className="text-white/30 text-sm font-mono mt-1">
              Client access keys are set in <code className="text-cyber-cyan/60">.env.local</code> → <code className="text-cyber-cyan/60">CLIENT_ACCESS_KEYS</code>
            </p>
          </div>

          <div className="glass-card border border-white/5 rounded-xl p-5 mb-4">
            <div className="text-xs text-cyber-yellow/60 font-mono border border-cyber-yellow/15 bg-cyber-yellow/5 rounded-lg px-4 py-3 mb-4">
              ⚠ To add/remove keys: edit CLIENT_ACCESS_KEYS in .env.local then restart the app.
              <br />Format: KEY1,KEY2,KEY3
            </div>
            <div className="space-y-2">
              {keys.map(k => (
                <div key={k.id} className="flex items-center justify-between py-3 px-4 border border-white/5 rounded-lg bg-white/2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${k.active ? 'bg-cyber-green status-pulse' : 'bg-white/20'}`} />
                    <div>
                      <div className="text-sm font-mono text-white">{k.key}</div>
                      <div className="text-xs text-white/30">{k.label} · Site: {k.siteUrl}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => copy(k.key)}
                    className="text-xs text-cyber-cyan/50 hover:text-cyber-cyan font-mono transition-colors px-2 py-1 border border-cyber-cyan/10 rounded"
                  >
                    {copied === k.key ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card border border-white/5 rounded-xl p-5">
            <div className="font-display text-sm font-bold text-white mb-3">How to Add a New Key</div>
            <ol className="text-sm text-white/50 font-mono space-y-1 list-decimal list-inside">
              <li>Open <span className="text-cyber-cyan">.env.local</span></li>
              <li>Find <span className="text-cyber-cyan">CLIENT_ACCESS_KEYS</span></li>
              <li>Add your new key: <span className="text-cyber-cyan">SIGNAL2024,NEWKEY123</span></li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
