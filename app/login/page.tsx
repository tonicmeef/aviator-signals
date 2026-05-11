'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Site { id: string; name: string; url: string }

export default function LoginPage() {
  const router = useRouter()
  const [sites, setSites]       = useState<Site[]>([])
  const [siteUrl, setSiteUrl]   = useState('')
  const [accessKey, setKey]     = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [booting, setBooting]   = useState(false)
  const [bootLines, setLines]   = useState<string[]>([])
  const [siteName, setSiteName] = useState('')

  // Load sites from API (picks up dynamically-added sites)
  useEffect(() => {
    fetch('/api/sites/list')
      .then(r => r.json())
      .then(d => setSites(d.sites || []))
      .catch(() => {
        // fallback to hardcoded if API fails
        setSites([
          { id: 'pridebet',    name: 'PrideBet',       url: 'https://pridebet.co.zw/' },
          { id: 'winbucks',    name: 'WinBucks',        url: 'https://winbucks.co.zw/' },
          { id: 'bettingcozw', name: 'Betting.co.zw',  url: 'https://betting.co.zw/' },
          { id: 'bolabet',     name: 'BolaBet',         url: 'https://www.bolabet.co.zw/' },
        ])
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!siteUrl)   { setError('Select a betting platform.'); return }
    if (!accessKey) { setError('Enter your access key.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, accessKey }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid access key.'); setLoading(false); return }

      const name = sites.find(s => s.url === siteUrl)?.name || siteUrl
      setSiteName(name)
      setBooting(true); setLoading(false)

      const lines = [
        '> TONIC_CORE_v26.5 INITIALIZING…',
        `> CONNECTOR: ${name.toUpperCase()}`,
        '> SIGNAL ENGINE: LOADING…',
        '> ROUND TRACKER: ONLINE',
        '> AUTHENTICATION: VERIFIED ✓',
        '> SYSTEM READY — LAUNCHING SIGNALS…',
      ]
      for (const line of lines) {
        await new Promise(r => setTimeout(r, 320))
        setLines(prev => [...prev, line])
      }
      await new Promise(r => setTimeout(r, 350))
      router.push('/signals')
    } catch {
      setError('Connection error. Try again.')
      setLoading(false)
    }
  }

  if (booting) return (
    <div className="min-h-screen bg-cyber-bg bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="glass-card border border-cyber-cyan/20 rounded-lg p-6 font-mono text-sm">
          <div className="text-cyber-cyan mb-4 text-xs tracking-widest opacity-60" style={{ fontFamily: 'Orbitron, monospace' }}>
            SYSTEM BOOT SEQUENCE
          </div>
          {bootLines.map((line, i) => (
            <div key={i} className="text-cyber-green mb-1 count-up">{line}</div>
          ))}
          {bootLines.length < 6 && <span className="text-cyber-cyan cursor-blink">_</span>}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cyber-bg bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-cyber-blue/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] rounded-full bg-cyber-cyan/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-cyber-cyan status-pulse" />
            <span className="font-mono text-xs text-cyber-cyan/60 tracking-[0.3em] uppercase">Signal Platform v26.5</span>
            <div className="w-2 h-2 rounded-full bg-cyber-cyan status-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider mb-1" style={{ fontFamily: 'Orbitron, monospace', textShadow: '0 0 12px #00e5ff, 0 0 24px rgba(0,229,255,0.4)' }}>
            LISCONVASTAG
          </h1>
          <p className="text-xs text-cyber-cyan/50 tracking-[0.4em] uppercase font-mono">Aviator Signals</p>
        </div>

        <div className="glass-card border border-cyber-cyan/15 rounded-xl p-8 border-glow-cyan">
          <div className="font-mono text-xs text-cyber-cyan/40 mb-6 tracking-widest">&gt; INITIALIZE_SYSTEM</div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs tracking-widest text-cyber-cyan/60 uppercase mb-2 font-mono">
                Betting Platform
              </label>
              <div className="relative">
                <select
                  value={siteUrl}
                  onChange={e => setSiteUrl(e.target.value)}
                  className="w-full bg-cyber-muted/40 border border-cyber-cyan/20 rounded-lg px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-cyber-cyan/50 focus:bg-cyber-muted/60 transition-all cursor-pointer"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  <option value="" className="bg-cyber-bg">— Select Platform —</option>
                  {sites.map(s => (
                    <option key={s.url} value={s.url} className="bg-cyber-bg">{s.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyber-cyan/40">▾</div>
              </div>
            </div>

            <div>
              <label className="block text-xs tracking-widest text-cyber-cyan/60 uppercase mb-2 font-mono">
                Access Key
              </label>
              <input
                type="password"
                value={accessKey}
                onChange={e => setKey(e.target.value)}
                placeholder="Enter access key…"
                className="w-full bg-cyber-muted/40 border border-cyber-cyan/20 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-cyber-cyan/50 transition-all"
              />
            </div>

            {error && (
              <div className="border border-cyber-red/30 bg-cyber-red/5 rounded-lg px-4 py-3 text-cyber-red text-xs font-mono flex items-center gap-2">
                <span className="text-base">⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyber-blue to-cyber-cyan rounded-lg py-3.5 text-cyber-bg font-black text-sm tracking-widest uppercase transition-all hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-cyber-bg/40 border-t-cyber-bg rounded-full animate-spin" />
                  Authenticating…
                </span>
              ) : 'Initialize System'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <a href="/admin" className="text-xs text-white/20 hover:text-cyber-cyan/40 transition-colors font-mono tracking-widest">
              [ ADMIN PANEL ]
            </a>
          </div>
        </div>

        <p className="text-center text-white/15 text-xs mt-6 font-mono">
          TONIC © 2026 — PREMIUM SIGNAL PLATFORM
        </p>
      </div>
    </div>
  )
}
