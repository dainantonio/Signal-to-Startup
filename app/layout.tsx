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
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Signal to Startup',
  },
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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f0f0f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Signal to Startup" />
      </head>
      <body suppressHydrationWarning className="font-sans flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <footer className="bg-gray-950 border-t border-gray-800 mt-auto py-8 px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Left — brand */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Signal to Startup</p>
                <p className="text-xs text-gray-400">Powered by EntrepAIneur</p>
                <p className="text-xs text-gray-500 mt-2">&copy; 2026 EntrepAIneur. All rights reserved.</p>
              </div>

              {/* Center — nav */}
              <div className="flex flex-row md:flex-col gap-4 md:gap-2 md:items-center">
                <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors">Home</Link>
                <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">Dashboard</Link>
                <Link href="/#step-1" className="text-xs text-gray-400 hover:text-white transition-colors">How It Works</Link>
              </div>

              {/* Right — legal */}
              <div className="space-y-2 md:text-right">
                <div className="flex flex-row md:flex-col md:items-end gap-4 md:gap-2">
                  <Link href="/terms" className="text-xs text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
                  <Link href="/privacy" className="text-xs text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                </div>
                <p className="text-xs text-gray-500 mt-2">hello@entrepaIneur.com</p>
              </div>

            </div>
            <div className="border-t border-gray-800 mt-8 pt-4 text-center">
              <p className="text-xs text-gray-600">
                AI-generated content is for informational purposes only and does not constitute financial or legal advice.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
