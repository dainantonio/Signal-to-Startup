import type {Metadata} from 'next';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Signal to Startup — Turn Market Signals into Business Ideas',
  description: 'Analyze news, policy, and market signals to identify actionable, low-cost business opportunities. Powered by AI.',
  openGraph: {
    title: 'Signal to Startup',
    description: 'Turn news and market signals into actionable business opportunities. Powered by Gemini AI.',
    type: 'website',
    siteName: 'Signal to Startup',
  },
  twitter: {
    card: 'summary',
    title: 'Signal to Startup',
    description: 'Turn news and market signals into actionable business opportunities. Powered by Gemini AI.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body suppressHydrationWarning className="font-sans flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-border/10 bg-white/60 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">

              {/* Left — brand */}
              <div className="space-y-2">
                <p className="text-sm font-serif italic font-bold tracking-tight">Signal to Startup</p>
                <p className="text-xs text-muted leading-relaxed max-w-xs">
                  Turn market signals into startup opportunities.
                </p>
                <p className="text-[10px] font-mono text-muted/60">
                  Powered by{' '}
                  <a
                    href="#"
                    className="text-primary hover:underline"
                  >
                    EntrepAIneur
                  </a>
                </p>
              </div>

              {/* Center — nav */}
              <div className="flex flex-row md:flex-col md:items-center gap-4 md:gap-2">
                <Link href="/" className="text-xs font-mono text-muted hover:text-foreground transition-colors">Home</Link>
                <Link href="/dashboard" className="text-xs font-mono text-muted hover:text-foreground transition-colors">Dashboard</Link>
                <Link href="/#step-1" className="text-xs font-mono text-muted hover:text-foreground transition-colors">How it works</Link>
              </div>

              {/* Right — legal */}
              <div className="md:text-right space-y-2">
                <div className="flex flex-row md:flex-col md:items-end gap-4 md:gap-2">
                  <Link href="/terms" className="text-xs font-mono text-muted hover:text-foreground transition-colors">Terms of Service</Link>
                  <Link href="/privacy" className="text-xs font-mono text-muted hover:text-foreground transition-colors">Privacy Policy</Link>
                </div>
                <p className="text-[10px] font-mono text-muted/50 mt-4">
                  &copy; 2026 EntrepAIneur. All rights reserved.
                </p>
              </div>

            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
