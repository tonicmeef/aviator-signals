'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Round, Signal } from '@/lib/types'

// ── colour maps ──────────────────────────────────────────
const LEVEL = {
  safe:     { text: 'text-cyber-green',  border: 'border-cyber-green/30',  bg: 'bg-cyber-green/5',  glow: 'border-glow-green', label: 'SAFE RANGE'  },
  watch:    { text: 'text-cyber-yellow', border: 'border-cyber-yellow/30', bg: 'bg-cyber-yellow/5', glow: '',                  label: 'WATCH ZONE'  },
  highrisk: { text: 'text-cyber-red',   border: 'border-cyber-red/30',    bg: 'bg-cyber-red/5',    glow: 'border-glow-red',   label: 'HIGH RISK'   },
}

function MultiplierBadge({ value }: { value: number }) {
  const cls =
    value < 1.5  ? 'text-cyber-blue   border-cyber-blue/20   bg-cyber-blue/5'   :
    value < 2.0  ? 'text-cyber-cyan   border-cyber-cyan/20   bg-cyber-cyan/5'   :
    value < 5.0  ? 'text-cyber-yellow border-cyber-yellow/20 bg-cyber-yellow/5' :
    value < 10   ? 'text-cyber-pink   border-cyber-pink/20   bg-cyber-pink/5'   :
                   'text-white         border-white/20         bg-white/5'
  return (
    <span className={`inline-block border rounded px-2 py-0.5 font-mono text-xs font-bold ${cls}`}>
      {value.toFixed(2)}x
    </span>
  )
}

function LiveClock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return <span className="font-display text-3xl font-black text-cyber-yellow tabular-nums" style={{ fontFamily: 'Orbitron, monospace', textShadow: '0 0 20px #ffd700, 0 0 40px rgba(255,215,0,0.4)' }}>{t}</span>
}

function useTMinus() {
  const [t, setT] = useState('1:00')
  useEffect(() => {
    const tick = () => {
      const s = 60 - new Date().getSeconds()
      const r = s === 60 ? 0 : s
      setT(`${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`)
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return t
}

function getWindowTime() {
  const now = new Date()
  const a = new Date(now); a.setMinutes(now.getMinutes() + 1); a.setSeconds(0)
  const b = new Date(a);   b.setMinutes(a.getMinutes() + 1)
  const f = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  return `${f(a)} - ${f(b)}`
}

// ── main component ───────────────────────────────────────
type DataMode = 'auto' | 'manual'

export default function SignalsPage() {
  const router   = useRouter()
  const tMinus   = useTMinus()

  // shared
  const [mode, setMode]           = useState<DataMode>('auto')
  const [signal, setSignal]       = useState<Signal | null>(null)
  const [rounds, setRounds]       = useState<Round[]>([])
  const [siteName, setSiteName]   = useState('')
  const [siteUrl, setSiteUrl]     = useState('')
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRef]      = useState(false)
  const [error, setError]         = useState('')
  const [winCount, setWinCount]   = useState(0)
  const [lossCount, setLossCount] = useState(0)
  const [marketTrend, setTrend]   = useState<'BLUE'|'PURPLE'|'PINK'>('BLUE')

  // AI
  const [aiText,     setAiText]    = useState('')
  const [aiSummary,  setAiSum]     = useState('')
  const [aiLoading,  setAiLoad]    = useState(false)

  // Manual mode
  const [manualInput,   setManualInput]   = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError,   setManualError]   = useState('')
  const [manualStats,   setManualStats]   = useState<null | {
    parsedCount: number
    rejected: string[]
    analysis: {
      avgMultiplier: number
      lowCount: number
      midCount: number
      highCount: number
      lowStreak: number
      highStreak: number
      recentTrend: string
    }
  }>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Auto mode data fetch ─────────────────────────────
  const fetchAuto = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRef(true)
    setError('')
    try {
      const [sr, rr] = await Promise.all([
        fetch('/api/signals/current'),
        fetch('/api/rounds/recent?count=30'),
      ])
      if (sr.status === 401) { router.push('/login'); return }
      const sd = await sr.json()
      const rd = await rr.json()
      if (sd.signal)   setSignal(sd.signal)
      if (rd.rounds)   setRounds(rd.rounds)
      if (sd.siteName) setSiteName(sd.siteName)
      if (sd.siteUrl)  setSiteUrl(sd.siteUrl)
      if (rd.rounds?.length) {
        const avg5 = rd.rounds.slice(0, 5).reduce((s: number, r: Round) => s + r.multiplier, 0) / 5
        setTrend(avg5 >= 9 ? 'PINK' : avg5 >= 2 ? 'PURPLE' : 'BLUE')
      }
    } catch { setError('Connection lost. Retrying…') }
    finally   { setLoading(false); setRef(false) }
  }, [router])

  useEffect(() => { fetchAuto() }, [fetchAuto])
  useEffect(() => {
    if (mode !== 'auto') return
    const id = setInterval(() => fetchAuto(true), 25000)
    return () => clearInterval(id)
  }, [fetchAuto, mode])

  // ── AI explanation (auto mode) ───────────────────────
  async function fetchAI() {
    setAiLoad(true); setAiText(''); setAiSum('')
    try {
      const r = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl }),
      })
      const d = await r.json()
      setAiText(d.explanation || d.error || 'No analysis available.')
    } catch { setAiText('AI analysis unavailable.') }
    finally { setAiLoad(false) }
  }

  // ── Manual mode: analyze submitted rounds ────────────
  async function handleManualAnalyze() {
    if (!manualInput.trim()) { setManualError('Paste or type your rounds first.'); return }
    setManualLoading(true); setManualError(''); setManualStats(null)
    setSignal(null); setRounds([]); setAiText(''); setAiSum('')
    try {
      const r = await fetch('/api/rounds/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput: manualInput, siteUrl, siteName }),
      })
      const d = await r.json()
      if (!r.ok) { setManualError(d.error || 'Analysis failed.'); return }
      setSignal(d.signal)
      setRounds(d.rounds)
      setManualStats({ parsedCount: d.parsedCount, rejected: d.rejected, analysis: d.analysis })
      if (d.aiExplanation) setAiText(d.aiExplanation)
      if (d.aiSummary)     setAiSum(d.aiSummary)
      if (d.rounds?.length) {
        const avg5 = d.rounds.slice(0, 5).reduce((s: number, r: Round) => s + r.multiplier, 0) / 5
        setTrend(avg5 >= 9 ? 'PINK' : avg5 >= 2 ? 'PURPLE' : 'BLUE')
      }
    } catch { setManualError('Network error. Try again.') }
    finally { setManualLoading(false) }
  }

  function handleClearManual() {
    setManualInput(''); setManualStats(null); setManualError('')
    setSignal(null); setRounds([]); setAiText(''); setAiSum('')
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const lv = signal ? LEVEL[signal.level] : LEVEL.watch
  const trendCfg = {
    BLUE:   { label: 'BLUE (1–1.99)',   cls: 'bg-blue-600'   },
    PURPLE: { label: 'PURPLE (2–8.99)', cls: 'bg-purple-600' },
    PINK:   { label: 'PINK (9x+)',      cls: 'bg-pink-600'   },
  }

  if (loading) return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-xs text-cyber-cyan/40 tracking-widest">LOADING SIGNALS…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cyber-bg bg-grid pb-10">

      {/* ── Sticky header ── */}
      <div className="border-b border-white/5 bg-cyber-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-display text-xs font-black text-cyber-cyan tracking-widest" style={{ fontFamily: 'Orbitron, monospace', textShadow: '0 0 12px #00e5ff' }}>
              TONIC
            </div>
            <div className="text-white/30 text-xs font-mono">Aviator Signals</div>
          </div>
          <div className="flex items-center gap-3">
            {refreshing && <div className="w-3 h-3 border border-cyber-cyan/50 border-t-cyber-cyan rounded-full animate-spin" />}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full status-pulse ${mode === 'auto' ? 'bg-cyber-green' : 'bg-cyber-purple'}`} />
              <span className={`text-xs font-mono ${mode === 'auto' ? 'text-cyber-green/70' : 'text-cyber-purple/70'}`}>
                {mode === 'auto' ? 'AUTO' : 'MANUAL'}
              </span>
            </div>
            <button onClick={handleLogout} className="text-white/20 hover:text-cyber-red/60 transition-colors text-xs font-mono">EXIT</button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {error && (
          <div className="border border-cyber-red/30 bg-cyber-red/5 rounded-lg px-4 py-2 text-cyber-red text-xs font-mono text-center">⚠ {error}</div>
        )}

        {/* ── Mode Toggle ── */}
        <div className="glass-card border border-white/5 rounded-xl p-1 flex">
          {(['auto', 'manual'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setSignal(null); setRounds([]); setAiText(''); setAiSum(''); setManualStats(null); setManualError('') }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-all ${
                mode === m
                  ? m === 'auto'
                    ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20'
                    : 'bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/20'
                  : 'text-white/30 hover:text-white/50 border border-transparent'
              }`}
            >
              {m === 'auto' ? '🤖 Auto Signal' : '✏️ Manual Input'}
            </button>
          ))}
        </div>

        {/* ── Market Trend ── */}
        <div className="glass-card border border-white/5 rounded-xl p-4">
          <div className="text-xs font-mono text-white/30 uppercase tracking-widest mb-3 text-center">Market Trend</div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(trendCfg) as Array<keyof typeof trendCfg>).map(k => (
              <button
                key={k}
                onClick={() => setTrend(k)}
                className={`rounded-lg py-3 text-xs font-bold tracking-wide transition-all ${trendCfg[k].cls} text-white ${marketTrend === k ? 'opacity-100 scale-105 shadow-lg' : 'opacity-35 hover:opacity-55'}`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                {trendCfg[k].label}
              </button>
            ))}
          </div>
          <div className="mt-2 h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-50" />
        </div>

        {/* ── Platform badge ── */}
        <div className="border border-white/10 rounded-lg px-4 py-3 text-center">
          <span className="font-display text-xs tracking-widest text-cyber-yellow uppercase" style={{ fontFamily: 'Orbitron, monospace', textShadow: '0 0 12px #ffd700' }}>
            Platform: {siteName || '—'}
          </span>
        </div>

        {/* ── Clock ── */}
        <div className="text-center py-1"><LiveClock /></div>

        {/* ── Terminal line ── */}
        <div className="border-l-2 border-cyber-cyan/40 pl-4">
          <span className="font-mono text-xs text-cyber-cyan/50">
            &gt; CORE_v26.5_{mode.toUpperCase()}_MODE... {mode === 'auto' ? 'awaiting input' : 'ready for manual rounds'}
            <span className="cursor-blink">_</span>
          </span>
        </div>

        {/* ════════════════════════════════════════
            AUTO MODE SECTION
        ════════════════════════════════════════ */}
        {mode === 'auto' && (
          <button
            onClick={() => { fetchAuto(true); fetchAI() }}
            className="w-full bg-gradient-to-r from-cyber-purple to-cyber-pink rounded-xl py-4 text-white font-display font-black tracking-widest uppercase text-sm hover:brightness-110 transition-all active:scale-[0.98]"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            Analyze Market
          </button>
        )}

        {/* ════════════════════════════════════════
            MANUAL MODE SECTION
        ════════════════════════════════════════ */}
        {mode === 'manual' && (
          <div className="glass-card border border-cyber-purple/20 rounded-xl p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-cyber-purple/70 uppercase tracking-widest">
                  Paste Rounds
                </label>
                <button onClick={handleClearManual} className="text-xs text-white/20 hover:text-white/50 font-mono transition-colors">
                  Clear
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder={
                  `Paste multiplier values separated by commas, spaces, or new lines.\n\nExamples:\n  1.24, 3.45, 1.02, 1.78, 2.15, 1.33\n  1.24x 3.45x 1.02x\n  1.24\n  3.45\n  1.02`
                }
                rows={7}
                className="w-full bg-cyber-muted/40 border border-cyber-purple/20 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-white/15 focus:outline-none focus:border-cyber-purple/50 transition-all resize-none"
              />

              <div className="flex gap-2 mt-1">
                {['1.24, 3.45, 1.02', '2.15, 1.33, 8.92', '1.05, 1.67, 2.44, 1.11'].map(ex => (
                  <button
                    key={ex}
                    onClick={() => setManualInput(prev => prev ? prev + ', ' + ex : ex)}
                    className="text-xs text-white/20 hover:text-cyber-purple/60 font-mono border border-white/5 hover:border-cyber-purple/20 px-2 py-1 rounded transition-all"
                  >
                    +{ex.split(',').length} ex
                  </button>
                ))}
              </div>
            </div>

            {manualError && (
              <div className="border border-cyber-red/30 bg-cyber-red/5 rounded-lg px-4 py-2.5 text-cyber-red text-xs font-mono">
                ⚠ {manualError}
              </div>
            )}

            {manualStats && (
              <div className="border border-cyber-purple/15 bg-cyber-purple/5 rounded-lg px-4 py-3 text-xs font-mono space-y-1">
                <div className="text-cyber-purple/60 uppercase tracking-widest mb-1">Parse Result</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-white/50">
                  <span>Rounds parsed: <span className="text-white">{manualStats.parsedCount}</span></span>
                  <span>Avg multiplier: <span className="text-white">{manualStats.analysis.avgMultiplier.toFixed(2)}x</span></span>
                  <span>Low (&lt;1.5x): <span className="text-white">{manualStats.analysis.lowCount}</span></span>
                  <span>Mid (1.5–2x): <span className="text-white">{manualStats.analysis.midCount}</span></span>
                  <span>High (2x+): <span className="text-white">{manualStats.analysis.highCount}</span></span>
                  <span>Trend: <span className={manualStats.analysis.recentTrend === 'rising' ? 'text-cyber-red' : manualStats.analysis.recentTrend === 'falling' ? 'text-cyber-green' : 'text-white'}>{manualStats.analysis.recentTrend}</span></span>
                  {manualStats.analysis.lowStreak > 0 && <span className="col-span-2">Low streak: <span className="text-cyber-green">{manualStats.analysis.lowStreak}</span></span>}
                  {manualStats.analysis.highStreak > 0 && <span className="col-span-2">High streak: <span className="text-cyber-red">{manualStats.analysis.highStreak}</span></span>}
                  {manualStats.rejected.length > 0 && (
                    <span className="col-span-2 text-cyber-yellow">
                      Ignored: {manualStats.rejected.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleManualAnalyze}
              disabled={manualLoading || !manualInput.trim()}
              className="w-full bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-xl py-4 text-white font-display font-black tracking-widest uppercase text-sm hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              {manualLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing {manualInput.split(/[\s,]+/).filter(Boolean).length} values…
                </span>
              ) : '⚡ Analyze Rounds'}
            </button>
          </div>
        )}

        {/* ── Signal Card (shared between auto & manual) ── */}
        {signal && (
          <div className={`glass-card border ${lv.border} ${lv.bg} ${lv.glow} rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-mono text-white/30 mb-1">
                  SYSTEM_MWOS_v26 · {mode === 'manual' ? 'MANUAL ANALYSIS' : 'AUTO'}
                </div>
                <div className={`font-display text-sm font-black tracking-widest ${lv.text}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                  {lv.label}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-white/30">T-MINUS</div>
                <div className="font-mono text-cyber-cyan font-bold">{tMinus}</div>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="font-display text-4xl font-black text-white tracking-wider" style={{ fontFamily: 'Orbitron, monospace' }}>
                {getWindowTime()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border border-cyber-green/25 bg-cyber-green/5 rounded-lg p-3 text-center">
                <div className="text-xs font-mono text-cyber-green/60 uppercase mb-1">Safe Odd</div>
                <div className="font-display text-2xl font-black text-cyber-green" style={{ fontFamily: 'Orbitron, monospace', textShadow: '0 0 12px #00ff88' }}>
                  {signal.safeOdd}x
                </div>
              </div>
              <div className="border border-cyber-red/25 bg-cyber-red/5 rounded-lg p-3 text-center">
                <div className="text-xs font-mono text-cyber-red/60 uppercase mb-1">Risk Target</div>
                <div className="font-display text-2xl font-black text-cyber-red" style={{ fontFamily: 'Orbitron, monospace', textShadow: '0 0 12px #ff2244' }}>
                  {signal.riskTarget}
                </div>
              </div>
            </div>

            <div className="border border-cyber-yellow/20 bg-cyber-yellow/5 rounded-lg px-4 py-2.5 text-center">
              <span className="font-display text-xs tracking-widest text-cyber-yellow uppercase" style={{ fontFamily: 'Orbitron, monospace' }}>
                Recommended Stake: $0.00
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-white/25 font-mono">STRENGTH</div>
                <div className={`text-sm font-bold ${lv.text}`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>{signal.signalStrength}</div>
              </div>
              <div>
                <div className="text-xs text-white/25 font-mono">CONFIDENCE</div>
                <div className="text-sm font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{signal.confidence}%</div>
              </div>
              <div>
                <div className="text-xs text-white/25 font-mono">RISK</div>
                <div className={`text-sm font-bold ${lv.text}`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>{signal.riskLevel}</div>
              </div>
            </div>

            {signal.notes && (
              <div className="mt-3 text-xs text-white/30 font-mono text-center italic">{signal.notes}</div>
            )}
          </div>
        )}

        {/* ── Win / Loss Tracker ── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setWinCount(c => c + 1)}
            className="bg-cyber-green/10 border border-cyber-green/30 hover:bg-cyber-green/20 rounded-xl py-4 text-cyber-green font-display font-black tracking-widest uppercase text-sm transition-all active:scale-[0.97]"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            WIN {winCount > 0 && <span className="opacity-60 text-xs ml-1">({winCount})</span>}
          </button>
          <button
            onClick={() => setLossCount(c => c + 1)}
            className="bg-cyber-red/10 border border-cyber-red/30 hover:bg-cyber-red/20 rounded-xl py-4 text-cyber-red font-display font-black tracking-widest uppercase text-sm transition-all active:scale-[0.97]"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            LOSS {lossCount > 0 && <span className="opacity-60 text-xs ml-1">({lossCount})</span>}
          </button>
        </div>

        {(winCount > 0 || lossCount > 0) && (
          <div className="glass-card border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="text-xs font-mono text-white/30">
              Session: <span className="text-cyber-green">{winCount}W</span> / <span className="text-cyber-red">{lossCount}L</span>
              {(winCount + lossCount) > 0 && (
                <span className="ml-2 text-white/50">{Math.round(winCount / (winCount + lossCount) * 100)}% WR</span>
              )}
            </div>
            <button onClick={() => { setWinCount(0); setLossCount(0) }} className="text-xs text-white/20 hover:text-cyber-red/60 font-mono transition-colors">RESET</button>
          </div>
        )}

        {/* ── AI Summary (manual mode) ── */}
        {aiSummary && (
          <div className="glass-card border border-cyber-purple/20 bg-cyber-purple/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyber-purple status-pulse" />
              <span className="text-xs font-mono text-cyber-purple/60 uppercase tracking-widest">AI Round Summary</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{aiSummary}</p>
          </div>
        )}

        {/* ── AI Explanation (both modes) ── */}
        {(aiText || aiLoading) && (
          <div className="glass-card border border-cyber-purple/20 bg-cyber-purple/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyber-purple status-pulse" />
              <span className="text-xs font-mono text-cyber-purple/60 uppercase tracking-widest">AI Signal Analysis</span>
            </div>
            {aiLoading
              ? <div className="flex items-center gap-3 text-cyber-purple/50 text-xs font-mono">
                  <span className="w-3 h-3 border border-cyber-purple/50 border-t-cyber-purple rounded-full animate-spin flex-shrink-0" />
                  Analyzing pattern…
                </div>
              : <p className="text-sm text-white/60 leading-relaxed" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{aiText}</p>
            }
          </div>
        )}

        {/* ── Recent Rounds ── */}
        {rounds.length > 0 && (
          <div className="glass-card border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono text-white/40 uppercase tracking-widest">
                {mode === 'manual' ? 'Your Rounds' : 'Recent Rounds'}
              </div>
              <div className="text-xs text-white/20 font-mono">{rounds.length} rounds</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rounds.slice(0, 30).map((r, i) => (
                <MultiplierBadge key={r.id || i} value={r.multiplier} />
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <button
            onClick={() => { if (mode === 'auto') fetchAuto(true); else handleClearManual() }}
            className="text-xs text-white/20 hover:text-cyber-cyan/40 font-mono transition-colors"
          >
            [ RESET BUFFER ]
          </button>
          <a href="/admin" className="text-xs text-white/20 hover:text-cyber-cyan/40 font-mono transition-colors">
            [ ADMIN PANEL ]
          </a>
        </div>
      </div>
    </div>
  )
}
