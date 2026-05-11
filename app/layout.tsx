import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tonic Aviator Signals',
  description: 'Premium Aviator signal tracking and round analysis platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cyber-bg text-white antialiased">
        {children}
      </body>
    </html>
  )
}
