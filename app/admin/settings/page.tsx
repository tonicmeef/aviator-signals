'use client'

import Link from 'next/link'

export default function AdminSettingsPage() {
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
            <h1 className="font-display text-xl font-black text-white tracking-wider">Settings</h1>
            <p className="text-white/30 text-sm font-mono mt-1">App configuration reference</p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'Branding',
                desc: 'Edit app name, logo, and colors',
                file: 'app/layout.tsx',
                detail: 'Change the <title>, metadata description, and font imports. Colors are in tailwind.config.js under the cyber theme.',
              },
              {
                title: 'Admin Password',
                desc: 'Change the admin panel password',
                file: '.env.local → ADMIN_PASSWORD',
                detail: 'Set ADMIN_PASSWORD=yourpassword in .env.local. Restart app after changing.',
              },
              {
                title: 'Client Access Keys',
                desc: 'Manage who can access the signal client',
                file: '.env.local → CLIENT_ACCESS_KEYS',
                detail: 'Comma-separated keys: KEY1,KEY2,KEY3. All keys work for all sites currently.',
              },
              {
                title: 'OpenAI API',
                desc: 'Enable AI-powered explanations',
                file: '.env.local → OPENAI_API_KEY',
                detail: 'Set your OpenAI API key. Leave blank to disable AI features gracefully. Get key at platform.openai.com.',
              },
              {
                title: 'Data Mode',
                desc: 'Switch between mock and live data',
                file: '.env.local → DEFAULT_DATA_MODE',
                detail: 'Set to "live" when live connectors are implemented. Default: "mock".',
              },
              {
                title: 'JWT Secret',
                desc: 'Token signing secret (IMPORTANT for production)',
                file: '.env.local → JWT_SECRET',
                detail: 'MUST be changed before deploying to production. Generate with: openssl rand -base64 32',
              },
            ].map(s => (
              <div key={s.title} className="glass-card border border-white/5 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-display font-bold text-white text-sm">{s.title}</div>
                  <code className="text-xs text-cyber-cyan/50 font-mono bg-cyber-cyan/5 border border-cyber-cyan/10 px-2 py-0.5 rounded">{s.file}</code>
                </div>
                <p className="text-xs text-white/40 font-mono">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
